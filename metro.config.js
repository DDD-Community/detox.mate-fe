const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const utilPath = path.resolve(__dirname, 'node_modules/util/util.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Metro doesn't understand Node.js-style trailing-slash module paths like 'util/'
  if (moduleName === 'util/') {
    return { filePath: utilPath, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
