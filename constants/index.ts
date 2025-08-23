// Re-export Colors from the Colors file
export { Colors, default as ColorsDefault } from './Colors';
export type { ColorTheme, ColorKey, SpacingKey } from './Colors';

// Don't re-export from src/constants to avoid conflicts
// Import specific items if needed
