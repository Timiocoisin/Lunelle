'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const env = { ...process.env };
// Optional locally verified official tools for networks where Node downloads
// are blocked. No tool is copied from another application's source/build.
const seven = path.join(root, '.local/installer-tools/7zip/7zip/bin/7za.exe');
const nsis = path.join(root, '.local/installer-tools/nsis/nsis-bundle');
if (fs.existsSync(seven)) env.ELECTRON_BUILDER_7ZIP_PATH = seven;
if (fs.existsSync(path.join(nsis, 'makensis.cmd'))) {
  env.ELECTRON_BUILDER_NSIS_DIR = nsis;
  env.ELECTRON_BUILDER_NSIS_RESOURCES_DIR = nsis;
}
const result = spawnSync(process.execPath, [require.resolve('electron-builder/cli.js'),
  '--config', 'electron-builder.cjs', '--prepackaged', 'dist/Xingyue-win32-x64',
  '--win', 'nsis', '--x64'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
