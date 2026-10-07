// The stations on the dial, west to east, each live from its own public stream. `at` is where it
// sits on the dial (0 to 1); `lon` is where it is in the world, which the dial uses to shade night
// and day and to put you on it. To add a station, give it a place on the dial between its
// neighbours, its city's time zone, and the stream its own player uses.

export const STATIONS = [
  { name: 'dublab', city: 'Los Angeles', tz: 'America/Los_Angeles', lon: -118.2, at: 0.07, url: 'https://dublab.out.airtime.pro/dublab_a', site: 'https://www.dublab.com' },
  { name: 'WFMU', city: 'Jersey City', tz: 'America/New_York', lon: -74.1, at: 0.18, url: 'https://stream0.wfmu.org/freeform-128k', site: 'https://wfmu.org' },
  { name: 'NTS 1', city: 'London', tz: 'Europe/London', lon: -0.1, at: 0.31, url: 'https://stream-relay-geo.ntslive.net/stream?client=direct', site: 'https://www.nts.live', nts: 0 },
  { name: 'NTS 2', city: 'London', tz: 'Europe/London', lon: 0, at: 0.38, url: 'https://stream-relay-geo.ntslive.net/stream2?client=direct', site: 'https://www.nts.live', nts: 1 },
  { name: 'FIP', city: 'Paris', tz: 'Europe/Paris', lon: 2.35, at: 0.46, url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', site: 'https://www.radiofrance.fr/fip' },
  { name: 'Kiosk Radio', city: 'Brussels', tz: 'Europe/Brussels', lon: 4.35, at: 0.54, url: 'https://kioskradiobxl.out.airtime.pro/kioskradiobxl_b', site: 'https://kioskradio.com' },
  { name: 'Cashmere Radio', city: 'Berlin', tz: 'Europe/Berlin', lon: 13.4, at: 0.62, url: 'https://cashmereradio.out.airtime.pro/cashmereradio_b', site: 'https://cashmereradio.com' },
  { name: 'Radio Alhara', city: 'Bethlehem', tz: 'Asia/Hebron', lon: 35.2, at: 0.72, url: 'https://n13.radiojar.com/78cxy6wkxtzuv', site: 'https://www.radioalhara.net' },
];

// Places on the dial with no station: the far end of it, where I listen from.
export const PLACES = [
  { city: 'Shanghai', tz: 'Asia/Shanghai', lon: 121.5, at: 0.87 },
  { city: 'Tokyo', tz: 'Asia/Tokyo', lon: 139.7, at: 0.95 },
];

// Longitude along the dial, between the places marked on it.
const KNOTS = [{ at: 0, lon: -135 }, ...STATIONS, ...PLACES, { at: 1, lon: 155 }]
  .map(({ at, lon }) => ({ at, lon }))
  .sort((a, b) => a.at - b.at)
  .filter((k, i, all) => !i || k.lon > all[i - 1].lon);

export function lonAt(at) {
  for (let i = 1; i < KNOTS.length; i++) {
    const a = KNOTS[i - 1];
    const b = KNOTS[i];
    if (at <= b.at) return a.lon + ((b.lon - a.lon) * (at - a.at)) / (b.at - a.at || 1);
  }
  return KNOTS[KNOTS.length - 1].lon;
}

export function atLon(lon) {
  for (let i = 1; i < KNOTS.length; i++) {
    const a = KNOTS[i - 1];
    const b = KNOTS[i];
    if (lon <= b.lon) return a.at + ((b.at - a.at) * (lon - a.lon)) / (b.lon - a.lon || 1);
  }
  return 1;
}
