# Windows installer validation · 2026-10-19

- Builder: electron-builder 26.15.3, NSIS 3.12 (official bundle 1.2.1).
- Target: Windows x64, per-user guided install, app ID `io.xingyue.desktop`.
- 27 unit tests passed, including installer identity and preservation settings.
- Silent installation to the dedicated `.local/install-check` directory exited 0.
- Installed application EXE SHA-256 matched the packaged EXE.
- Installed application passed isolated UI regression: all four actual custom
  fonts, four layout sizes, pet/panel ordering, no portrait collision, hover,
  settings single-click opening and settings persistence.
- Generated uninstaller exited 0 and removed the installed test application.
- `%APPDATA%/XingyueDesktop` remained present after test uninstall.
- Test output: `artifacts/installer/ui-report.json` (test data, no credentials).
- Installer is unsigned. Successful build output mentioning the signing phase
  does not mean a signing certificate was applied. Windows may show an unknown
  publisher or SmartScreen warning.

The former companion was a portable runtime, not a registered installed app.
Its exact processes were stopped and the runtime was moved to a recoverable
backup under its own source directory. Its source and user data were preserved.
Neither the Codex application nor its account/configuration was uninstalled.
