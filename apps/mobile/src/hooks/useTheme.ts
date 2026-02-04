import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/Colors';

interface ThemeHook {
  isDark: boolean;
  colors: ThemeColors;
}

export function useTheme(): ThemeHook {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
  };
}
