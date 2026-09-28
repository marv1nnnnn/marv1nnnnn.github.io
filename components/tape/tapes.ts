// What each tape looks like as a cassette: one per palette and per Strudel pattern in sound.ts.
// Kept apart from sound.ts so the page can draw the shelf without loading Strudel.
export interface TapeLook {
  name: string;
  mood: string; // written on the label
  after: string; // the music it follows
  shell: string;
  shellOpacity: number; // 1 is solid plastic; lower is a clear or smoked shell
  hub: string;
  paper: string;
  ink: string;
  stripe: string;
  oxide: string;
}

export const LOOKS: Record<string, TapeLook> = {
  oxide: {
    name: 'oxide', mood: 'a loop that wears away', after: 'Basinski · Boards of Canada · OPN',
    shell: '#161618', shellOpacity: 1, hub: '#e6dfcf', paper: '#ece5d3', ink: '#1a1a1a', stripe: '#d9642b', oxide: '#2b1a10',
  },
  lain: {
    name: 'lain', mood: '3am', after: 'HTRK · Badalamenti · Fishmans',
    shell: '#26262a', shellOpacity: 0.62, hub: '#f2f2f0', paper: '#f5f4f1', ink: '#121212', stripe: '#e22330', oxide: '#1d1411',
  },
  phosphor: {
    name: 'phosphor', mood: 'machines that dream', after: 'Autechre · Boards of Canada',
    shell: '#7fd49c', shellOpacity: 0.34, hub: '#dcdcd2', paper: '#0e1510', ink: '#cfebd7', stripe: '#e2ffaa', oxide: '#221710',
  },
  uv: {
    name: 'uv', mood: 'a night bus in the rain', after: 'Burial · OPN',
    shell: '#3a2a86', shellOpacity: 0.58, hub: '#cfc8ff', paper: '#e4e0ff', ink: '#1a1433', stripe: '#ff5cd6', oxide: '#20150f',
  },
  mono: {
    name: 'mono', mood: 'pressure', after: 'The Bug · Coil · Swans',
    shell: '#e8e8e4', shellOpacity: 1, hub: '#141414', paper: '#0b0b0b', ink: '#ffffff', stripe: '#ffffff', oxide: '#171211',
  },
};
