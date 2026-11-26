const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Migraciones de Drizzle (.sql) empaquetadas con la app.
config.resolver.sourceExts.push('sql');

module.exports = config;
