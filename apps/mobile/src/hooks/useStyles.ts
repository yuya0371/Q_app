import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { createCommonStyles, CommonStyles, spacing, fontSize, borderRadius } from '../styles/common';

interface StylesHook {
  styles: CommonStyles;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  borderRadius: typeof borderRadius;
}

export function useStyles(): StylesHook {
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => createCommonStyles(colors), [colors]);

  return {
    styles,
    colors,
    isDark,
    spacing,
    fontSize,
    borderRadius,
  };
}
