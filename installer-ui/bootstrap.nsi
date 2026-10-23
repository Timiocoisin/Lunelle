Unicode true
!include FileFunc.nsh
!include LogicLib.nsh
Name "Lunelle 安装手账"
OutFile "${OUTPUT}"
Icon "${PROJECT}\assets\icon.ico"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
SetCompressor zlib
VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=2052 "ProductName" "Lunelle 安装手账"
VIAddVersionKey /LANG=2052 "FileDescription" "Lunelle 定制安装器"
VIAddVersionKey /LANG=2052 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=2052 "LegalCopyright" "Lunelle contributors"
Section
 System::Call 'kernel32::GetTickCount64() l .r3'
 System::Call 'kernel32::SetEnvironmentVariable(t "LUNELLE_SETUP_ENTRY_TICK", t "$3")'
 ${GetParameters} $R0
 ClearErrors
 ${GetOptions} $R0 "/ENGINEONLY" $R1
 ${IfNot} ${Errors}
   ReadEnvStr $R2 "LUNELLE_SETUP_ENGINE_DIRECTORY"
   StrCmp $R2 "" 0 +3
   SetErrorLevel 2
   Quit
   SetOutPath "$R2"
   File /oname=Lunelle-Engine.exe "${WIZARD}\resources\engine\Lunelle-Engine.exe"
   SetErrorLevel 0
   Quit
 ${EndIf}
 StrCpy $R4 "$LOCALAPPDATA\LunelleSetupCache\${VERSION}-${CACHE_ID}"
 System::Call 'kernel32::CreateMutex(p 0, i 0, t "Local\LunelleSetupUnpack-${CACHE_ID}") p .R7'
 System::Call 'kernel32::WaitForSingleObject(p R7, i 30000) i .R8'
 StrCmp $R8 0 +4
 StrCmp $R8 128 +3
 SetErrorLevel 2
 Quit
 System::Call 'kernel32::SetEnvironmentVariable(t "LUNELLE_SETUP_CACHE_HIT", t "0")'
 IfFileExists "$R4\.ready" 0 unpackUi
 FileOpen $R5 "$R4\.ready" r
 FileRead $R5 $R6
 FileClose $R5
 StrCmp $R6 "${CACHE_ID}" 0 unpackUi
 System::Call 'kernel32::SetEnvironmentVariable(t "LUNELLE_SETUP_CACHE_HIT", t "1")'
 Goto startUi
 unpackUi:
 SetOutPath "$R4"
 ClearErrors
 File /r /x Lunelle-Engine.exe "${WIZARD}\*.*"
 IfErrors 0 +3
 SetErrorLevel 2
 Quit
 FileOpen $R5 "$R4\.ready" w
 FileWrite $R5 "${CACHE_ID}"
 FileClose $R5
 startUi:
 System::Call 'kernel32::ReleaseMutex(p R7)'
 System::Call 'kernel32::CloseHandle(p R7)'
 SetOutPath "$R4"
 System::Call 'kernel32::SetEnvironmentVariable(t "LUNELLE_SETUP_SOURCE", t "$EXEPATH")'
 ExecWait '"$R4\Lunelle-Installer.exe"' $0
 SetErrorLevel $0
SectionEnd
