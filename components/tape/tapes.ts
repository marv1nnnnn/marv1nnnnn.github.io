// What each tape looks like as a cassette: one per palette and per Strudel pattern in sound.ts.
// Kept apart from sound.ts so the page can draw the shelf without loading Strudel.
export interface TapeLook {
  name: string;
  mood: string; // written on the label
  shell: string;
  shellOpacity: number; // 1 is solid plastic; lower is a clear or smoked shell
  hub: string;
  paper: string;
  ink: string;
  stripe: string;
  oxide: string;
}

export const LOOKS: Record<string, TapeLook> = {
  haze: {
    name: 'haze', mood: 'a loop that wears away',
    shell: '#1c1712', shellOpacity: 1, hub: '#e6dfcf', paper: '#ece5d3', ink: '#1a1a1a', stripe: '#d9642b', oxide: '#2b1a10',
  },
  '3am': {
    name: '3am', mood: 'a diner, the red room',
    shell: '#26262a', shellOpacity: 0.62, hub: '#f2f2f0', paper: '#f5f4f1', ink: '#121212', stripe: '#e22330', oxide: '#1d1411',
  },
  nightbus: {
    name: 'night bus', mood: 'rain, the last bus home',
    shell: '#27324a', shellOpacity: 0.5, hub: '#d8dde6', paper: '#111723', ink: '#d6dfeb', stripe: '#ff963c', oxide: '#1e1610',
  },
  ritual: {
    name: 'ritual', mood: 'to play in the dark',
    shell: '#3a2a86', shellOpacity: 0.58, hub: '#cfc8ff', paper: '#e4e0ff', ink: '#1a1433', stripe: '#ff5cd6', oxide: '#20150f',
  },
  pressure: {
    name: 'pressure', mood: 'speaker stacks, too loud',
    shell: '#e8e8e4', shellOpacity: 1, hub: '#141414', paper: '#0b0b0b', ink: '#ffffff', stripe: '#ffffff', oxide: '#171211',
  },
  // A home-dubbed tape: a scratched clear shell, a photocopied label, orange marker.
  bent: {
    name: 'bent', mood: 'bent circuits, Beijing',
    shell: '#8a8580', shellOpacity: 0.45, hub: '#2a2a2a', paper: '#e9e6df', ink: '#141414', stripe: '#ff5624', oxide: '#1c130e',
  },
};
