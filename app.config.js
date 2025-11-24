/* eslint-disable no-undef */
export default ({ config }) => ({
  ...config,
  extra: {
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  },
});

