'use strict';
const base=require('../electron-builder.cjs');
const isolated=process.env.LUNELLE_ENGINE_INTEGRATION==='1';
module.exports={...base,...(isolated?{appId:'io.xingyue.installer.integration',productName:'Lunelle Installer Test',win:{...base.win,executableName:'Lunelle-Integration-Test'}}:{}),directories:{...base.directories,output:isolated?'.local/installer-engine-test':'.local/installer-engine'},artifactName:'Lunelle-Engine.exe',nsis:{...base.nsis,...(isolated?{shortcutName:'Lunelle Installer Test',uninstallDisplayName:'Lunelle Installer Test'}:{}),include:'installer-ui/engine.nsh',runAfterFinish:false}};
