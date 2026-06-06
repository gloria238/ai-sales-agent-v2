const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch all packages so Metro picks up changes
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, "packages"),
];

// Let Metro resolve workspace packages from the root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Ensure Metro resolves .ts/.tsx from workspace packages
config.resolver.sourceExts = ["ts", "tsx", "js", "jsx", "json"];

module.exports = config;
