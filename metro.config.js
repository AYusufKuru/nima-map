const { getDefaultConfig } = require('expo/metro-config');

/**
 * Leaflet paketleri Metro’nun `main` çözümlemesiyle (özellikle Windows’ta) uyumsuz olabiliyor.
 * Doğrudan `dist` kaynak dosyalarına yönlendiriyoruz.
 */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'leaflet') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('leaflet/dist/leaflet-src.js'),
    };
  }
  if (moduleName === 'leaflet.markercluster') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('leaflet.markercluster/dist/leaflet.markercluster-src.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
