// Neo-brutalism solid color palette - bold, vibrant, flat colors
const BRUTALIST_COLORS = [
  '#FFEB3B', // Vibrant Yellow
  '#00E5FF', // Cyan
  '#FF4081', // Magenta
  '#76FF03', // Lime
  '#FF6E40', // Coral
  '#E040FB', // Violet
  '#FFD600', // Gold
  '#00BFA5', // Teal
  '#FF3D00', // Deep Orange
  '#00E676', // Neon Green
  '#2979FF', // Electric Blue
  '#FF6F00', // Amber
  '#D500F9', // Purple
  '#00B8D4', // Dark Cyan
  '#FFAB00', // Orange
  '#69F0AE', // Mint Green
];

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export function generateCardGradient(id: string) {
  const hash = hashString(id);
  const color = BRUTALIST_COLORS[hash % BRUTALIST_COLORS.length];
  return color;
}

// Get contrasting text color for accessibility
export function getContrastColor(bgColor: string): string {
  // Parse hex color
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
}
