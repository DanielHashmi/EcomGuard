// EcomGuard Design System
// Inspired by clean, modern mobile app design with warm neutrals and vibrant accents
export const theme = {
  colors: {
    // Light warm background palette
    background: '#F5F0EB',
    surface: '#FFFFFF',
    surfaceHighlight: '#FAF7F4',
    surfaceElevated: '#F0EBE5',
    surfaceCard: '#FFFFFF',

    // Text
    text: '#1A1410',
    textSecondary: '#4A3F35',
    textMuted: '#9A8F85',
    textInverse: '#FFFFFF',

    // Borders
    border: '#E8E0D8',
    borderLight: '#F0EAE2',

    // Brand accent — deep indigo/violet
    primary: '#5B4FE8',
    primaryLight: '#7B72F0',
    primaryMuted: 'rgba(91, 79, 232, 0.10)',
    primarySurface: 'rgba(91, 79, 232, 0.06)',

    // Semantic colors
    success: '#00A86B',
    successMuted: 'rgba(0, 168, 107, 0.10)',
    successSurface: 'rgba(0, 168, 107, 0.06)',

    warning: '#E8820C',
    warningMuted: 'rgba(232, 130, 12, 0.10)',
    warningSurface: 'rgba(232, 130, 12, 0.06)',

    danger: '#E83A3A',
    dangerMuted: 'rgba(232, 58, 58, 0.10)',
    dangerSurface: 'rgba(232, 58, 58, 0.06)',

    neutral: '#9A8F85',
    neutralMuted: 'rgba(154, 143, 133, 0.12)',

    // Gradient stops
    gradientStart: '#5B4FE8',
    gradientEnd: '#8B7FF5',

    // Shadow
    shadow: 'rgba(26, 20, 16, 0.08)',
    shadowMedium: 'rgba(26, 20, 16, 0.14)',
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 18,
      xl: 22,
      xxl: 28,
      hero: 36,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    round: 9999,
  },
  shadow: {
    sm: {
      shadowColor: 'rgba(26, 20, 16, 0.08)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(26, 20, 16, 0.12)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(26, 20, 16, 0.16)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
