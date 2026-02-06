export const Colors = {
  // Light mode
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EEEEEE',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E5E5',
    accent: '#8B5CF6',
    accentHover: '#7C3AED',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: '#FFFFFF',
  },
  // Dark mode
  dark: {
    background: '#1A1A1A',
    backgroundSecondary: '#2A2A2A',
    backgroundTertiary: '#3A3A3A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6B7280',
    border: '#3A3A3A',
    accent: '#8B5CF6',
    accentHover: '#7C3AED',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: '#2A2A2A',
  },
};

// Theme type - common structure for both light and dark
export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  danger: string;
  success: string;
  warning: string;
  card: string;
}
