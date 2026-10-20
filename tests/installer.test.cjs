'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const config=require('../electron-builder.cjs');
test('installer uses the new application identity',()=>{
  assert.equal(config.appId,'io.xingyue.desktop');
  assert.equal(config.win.executableName,'Lunelle');
  assert.ok(!JSON.stringify(config).includes('Maid'));
});
test('installer provides wizard and registered uninstall without deleting user settings',()=>{
  assert.equal(config.nsis.oneClick,false);
  assert.equal(config.nsis.perMachine,false);
  assert.equal(config.nsis.allowToChangeInstallationDirectory,true);
  assert.equal(config.nsis.deleteAppDataOnUninstall,false);
  assert.equal(config.nsis.createStartMenuShortcut,true);
});
