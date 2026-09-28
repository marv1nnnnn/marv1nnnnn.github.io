// @strudel/web ships no types; only what components/tape/sound.ts uses is declared.
declare module '@strudel/web' {
  export function initStrudel(options?: Record<string, unknown>): Promise<unknown>;
  export function initAudio(options?: Record<string, unknown>): Promise<void>;
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>;
  export function getAudioContext(): AudioContext;
  export function setAudioContext(ctx: AudioContext): AudioContext;
  export function getSuperdoughAudioController(): { output: unknown };
  export function samples(source: string | Record<string, unknown>, base?: string, options?: Record<string, unknown>): Promise<void>;
  export function superdough(value: Record<string, unknown>, time: number, duration: number, cps?: number): Promise<void>;
}
