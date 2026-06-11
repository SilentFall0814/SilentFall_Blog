const fs = require('node:fs');
const path = require('node:path');

function hasProjectMarker(targetPath) {
  return fs.existsSync(path.join(targetPath, 'package.json'));
}

function normalizeCandidatePath(rawPath, baseDir) {
  if (!rawPath || typeof rawPath !== 'string') {
    return '';
  }

  const trimmedPath = rawPath.trim();
  if (!trimmedPath) {
    return '';
  }

  if (path.isAbsolute(trimmedPath)) {
    return path.resolve(trimmedPath);
  }

  return path.resolve(baseDir, trimmedPath);
}

function stripStandaloneSuffix(targetPath) {
  const normalizedPath = path.resolve(targetPath);
  const standaloneMarker = `${path.sep}.next${path.sep}standalone`;
  const markerIndex = normalizedPath.lastIndexOf(standaloneMarker);

  if (markerIndex === -1) {
    return '';
  }

  return normalizedPath.slice(0, markerIndex);
}

function readConfiguredRoot(env, baseDir) {
  const envKeys = ['BLOG_CONTENT_ROOT', 'BLOG_FRONTEND_PATH', 'SFBLOGS_PATH'];

  for (const envKey of envKeys) {
    const configuredPath = normalizeCandidatePath(env[envKey], baseDir);
    if (configuredPath && hasProjectMarker(configuredPath)) {
      return configuredPath;
    }
  }

  return '';
}

function resolveContentRoot(options = {}) {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const env = options.env || process.env;
  const runtimeDir = options.runtimeDir ? path.resolve(options.runtimeDir) : __dirname;

  const candidates = [
    readConfiguredRoot(env, cwd),
    stripStandaloneSuffix(cwd),
    stripStandaloneSuffix(runtimeDir),
    path.resolve(runtimeDir, '..'),
    cwd,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (hasProjectMarker(candidate)) {
      return candidate;
    }
  }

  throw new Error(`未能解析博客内容根目录，当前工作目录=${cwd}`);
}

function getPostsDirectory(options = {}) {
  return path.join(resolveContentRoot(options), 'posts');
}

function getMomentsDirectory(options = {}) {
  return path.join(resolveContentRoot(options), 'moments');
}

function getMomentContentDirectories(options = {}) {
  const postsDirectory = getPostsDirectory(options);
  const momentsDirectory = getMomentsDirectory(options);
  return [
    path.join(postsDirectory, 'moments'),
    momentsDirectory,
  ];
}

function getAboutMarkdownPath(options = {}) {
  return path.join(resolveContentRoot(options), 'app', 'about', 'about.md');
}

module.exports = {
  resolveContentRoot,
  getPostsDirectory,
  getMomentsDirectory,
  getMomentContentDirectories,
  getAboutMarkdownPath,
};
