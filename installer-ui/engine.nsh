; The themed front end supplies validated per-user choices to the stock engine.
!macro customInit
  ReadEnvStr $R1 "LUNELLE_INSTALL_DIRECTORY"
  ${If} $R1 != ""
    StrCpy $INSTDIR $R1
  ${EndIf}
!macroend
!macro customInstall
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "/LUNELLENODESKTOP" $R1
  ${IfNot} ${Errors}
    Delete "$newDesktopLink"
  ${EndIf}
  ClearErrors
  ${GetOptions} $R0 "/LUNELLENOMENU" $R1
  ${IfNot} ${Errors}
    Delete "$newStartMenuLink"
  ${EndIf}
!macroend
