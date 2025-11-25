// Primary tint colors for light/dark themes
const tintColorLight = '#0066FF';
const tintColorDark = '#66D9FF';

export default {
  light: {
    text: '#111827',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#B8C0CC',
    tabIconSelected: tintColorLight,
    primary: {
      '300': '#4F8EF9',
      '500': '#0066FF',
      '700': '#0047B3',
      '900': '#0F3D91',
    },
    accent: {
      '300': '#4CE0B3',
      '500': '#00C2A8',
    },
    secondary: {
      '300': '#8AA7FF',
      '500': '#6C5CE7',
    },
    neutral: {
      '100': '#F8FAFC',
      '300': '#D1D5DB',
      '500': '#6B7280',
      '700': '#374151',
      '900': '#0F172A',
    },
    surface: {
      default: '#FFFFFF',
      elevated: '#F3F4F6',
    },
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1220',
    tint: tintColorDark,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
    primary: {
      '300': '#5B9CFF',
      '500': '#66D9FF',
      '700': '#1EA6FF',
      '900': '#0F4A6F',
    },
    accent: {
      '300': '#2FE8C9',
      '500': '#1FD0B0',
    },
    secondary: {
      '300': '#9AA7FF',
      '500': '#7A63E6',
    },
    neutral: {
      '100': '#0B1220',
      '300': '#1F2937',
      '500': '#9CA3AF',
      '700': '#6B7280',
      '900': '#0B1220',
    },
    surface: {
      default: '#07101A',
      elevated: '#0F1720',
    },
  },
};
