// Local no-op config plugin for @react-native-voice/voice
// This prevents Expo from trying to load a package config plugin
// when the package does not ship an `app.plugin.js` or export a plugin.

module.exports = function withReactNativeVoice(config) {
  // if you need to apply native changes in future, add them here using
  // @expo/config-plugins helpers. For now, return unchanged config.
  return config;
};
