// A file at a low bitrate, as an AudioWorklet. Not an MP3 encoder, but what one does to the sound:
// the music is cut into frames of 1024 samples, each frame is taken to the spectrum, everything
// above the cutoff is thrown away, and each band is quantised to the few steps its share of the
// bits allows. Quiet bins round down to nothing and come back the next frame, which is the swirl
// in the cymbals (the "birdies"); the coarse steps spread noise across the frame, which is the
// pre-echo before a drum. kbps sets how hungry it is: 192 is nearly clean, 64 swirls, 32 drowns.

const N = 1024;
const H = N / 2;
const BARK = [0, 100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480, 1720, 2000, 2320, 2700, 3150, 3700, 4400, 5300, 6400, 7700, 9500, 12000, 15500, 24000];

// The band a file at this bitrate keeps, roughly where encoders of the time cut it.
const cutoff = (kbps) => (kbps >= 192 ? 19000 : kbps >= 160 ? 17500 : kbps >= 128 ? 16000 : kbps >= 96 ? 14500 : kbps >= 64 ? 11000 : kbps >= 48 ? 8500 : 6500);

class Mp3ish extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'kbps', defaultValue: 128, minValue: 16, maxValue: 320, automationRate: 'k-rate' }];
  }

  constructor() {
    super();
    this.win = new Float32Array(N);
    for (let i = 0; i < N; i++) this.win[i] = Math.sqrt(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
    this.frame = new Float32Array(N);
    this.hop = new Float32Array(H);
    this.ready = new Float32Array(H);
    this.acc = new Float32Array(N);
    this.re = new Float32Array(N);
    this.im = new Float32Array(N);
    this.fill = 0;
    // bit reversal and twiddles for the FFT
    this.rev = new Uint16Array(N);
    const bits = Math.log2(N);
    for (let i = 0; i < N; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      this.rev[i] = r;
    }
    this.cos = new Float32Array(H);
    this.sin = new Float32Array(H);
    for (let i = 0; i < H; i++) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / N);
      this.sin[i] = Math.sin((2 * Math.PI * i) / N);
    }
    this.bandOf = new Uint8Array(H + 1);
    for (let k = 0; k <= H; k++) {
      const f = (k * sampleRate) / N;
      let b = 0;
      while (b < BARK.length - 2 && f >= BARK[b + 1]) b++;
      this.bandOf[k] = b;
    }
    this.bands = BARK.length - 1;
    this.energy = new Float32Array(this.bands);
    this.count = new Float32Array(this.bands);
    this.seed = 12345;
  }

  rand() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  fft(inverse) {
    const { re, im, rev, cos, sin } = this;
    for (let i = 0; i < N; i++) {
      const j = rev[i];
      if (j > i) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    const sign = inverse ? 1 : -1;
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1;
      const step = N / size;
      for (let start = 0; start < N; start += size) {
        for (let k = 0; k < half; k++) {
          const wr = cos[k * step];
          const wi = sign * sin[k * step];
          const a = start + k;
          const b = a + half;
          const xr = re[b] * wr - im[b] * wi;
          const xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr;
          im[b] = im[a] - xi;
          re[a] += xr;
          im[a] += xi;
        }
      }
    }
  }

  code(kbps) {
    const { re, im, win, frame, energy, count, bandOf, bands } = this;
    for (let i = 0; i < N; i++) {
      re[i] = frame[i] * win[i];
      im[i] = 0;
    }
    this.fft(false);
    // How short of bits the file is: nothing at 192 and up, most of it at 32.
    const starve = Math.min(1, Math.max(0, (176 - kbps) / 150));
    const top = Math.min(H, Math.round((cutoff(kbps) * N) / sampleRate));
    energy.fill(0);
    count.fill(0);
    let loudest = 0;
    for (let k = 0; k <= H; k++) {
      const p = re[k] * re[k] + im[k] * im[k];
      energy[bandOf[k]] += p;
      count[bandOf[k]] += 1;
      if (p > loudest) loudest = p;
    }
    for (let b = 0; b < bands; b++) energy[b] = count[b] ? energy[b] / count[b] : 0;
    const floor = loudest * (1e-6 + 4e-3 * starve * starve);
    for (let k = 0; k <= H; k++) {
      const b = bandOf[k];
      let keep = 0;
      if (k < top && energy[b] > floor) {
        const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
        // The step a band can afford: coarser up high, coarser when starved, and never quite the
        // same from frame to frame.
        const step = Math.sqrt(energy[b]) * starve * (0.35 + (1.4 * b) / bands) * (0.7 + 0.6 * this.rand());
        keep = step > 0 ? (Math.round(m / step) * step) / (m || 1) : 1;
      }
      re[k] *= keep;
      im[k] *= keep;
      if (k > 0 && k < H) {
        re[N - k] = re[k];
        im[N - k] = -im[k];
      }
    }
    this.fft(true);
    const { acc } = this;
    for (let i = 0; i < N; i++) acc[i] += (re[i] / N) * win[i];
    this.ready.set(acc.subarray(0, H));
    acc.copyWithin(0, H);
    acc.fill(0, H);
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output.length) return true;
    const kbps = params.kbps[0];
    const a = input[0];
    const b = input[1] ?? a;
    const n = output[0].length;
    for (let i = 0; i < n; i++) {
      const x = a ? (b ? (a[i] + b[i]) * 0.5 : a[i]) : 0;
      this.hop[this.fill] = x;
      const y = this.ready[this.fill];
      for (let c = 0; c < output.length; c++) output[c][i] = y;
      this.fill++;
      if (this.fill === H) {
        this.frame.copyWithin(0, H);
        this.frame.set(this.hop, H);
        this.code(kbps);
        this.fill = 0;
      }
    }
    return true;
  }
}

registerProcessor('mp3ish', Mp3ish);
