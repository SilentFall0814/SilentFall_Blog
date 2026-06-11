const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('普通运行目录下返回项目根目录', async () => {
  const { resolveContentRoot } = require('./contentRoot.js');
  const projectRoot = path.resolve(__dirname, '..');
  const root = resolveContentRoot({
    cwd: projectRoot,
    env: {},
  });

  assert.equal(root, projectRoot);
});

test('standalone 运行目录下跳出 .next/standalone 返回项目根目录', async () => {
  const { resolveContentRoot } = require('./contentRoot.js');
  const projectRoot = path.resolve(__dirname, '..');
  const root = resolveContentRoot({
    cwd: path.join(projectRoot, '.next', 'standalone'),
    env: {},
  });

  assert.equal(root, projectRoot);
  assert.notEqual(root, path.join(projectRoot, '.next', 'standalone'));
});
