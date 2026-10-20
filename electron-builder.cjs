'use strict';
module.exports = {
  appId: 'io.xingyue.desktop',
  productName: 'Xingyue',
  copyright: 'Copyright © 2026 Xingyue contributors',
  directories: { output: 'installers', buildResources: 'assets' },
  artifactName: 'Xingyue-Setup-${version}-${arch}.${ext}',
  publish: null,
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.ico',
    // The prepackaged EXE already contains our icon/version metadata.
    // No signing identity is configured; do not pretend the installer is signed.
    signAndEditExecutable: false,
    executableName: 'Xingyue'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    packElevateHelper: false,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    shortcutName: 'Xingyue',
    uninstallDisplayName: 'Xingyue ${version}',
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    displayLanguageSelector: false,
    installerLanguages: ['zh_CN', 'en_US'],
    language: '2052',
    runAfterFinish: true,
    deleteAppDataOnUninstall: false,
    license: 'LICENSE',
    warningsAsErrors: true
  }
};
