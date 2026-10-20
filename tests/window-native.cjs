const{app,BrowserWindow}=require('electron'),{execFile}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const{PET_WINDOW_FLAGS,applyPetWindowPolicy}=require('../app/window-policy.cjs');
app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'xy-nonactivate-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({...PET_WINDOW_FLAGS,width:120,height:100,show:false,frame:false,transparent:true,webPreferences:{sandbox:true,contextIsolation:true}});
 await win.loadURL('data:text/html,<html style="background:transparent"><body></body></html>');
 win.setIgnoreMouseEvents(false,{forward:true});applyPetWindowPolicy(win);win.showInactive();
 const h=win.getNativeWindowHandle().readBigUInt64LE().toString();
 const ps=`Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class XYNativeTest { [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] public static extern IntPtr GetWindowLongPtr(IntPtr h,int n); [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l); }'
$h=[IntPtr]::new([long]${h})
$before=[XYNativeTest]::GetForegroundWindow()
$style=[XYNativeTest]::GetWindowLongPtr($h,-20).ToInt64()
$result=[XYNativeTest]::SendMessage($h,0x21,$h,[IntPtr]::new(0x02010001)).ToInt64()
$after=[XYNativeTest]::GetForegroundWindow()
@{noActivate=(($style -band 0x08000000) -ne 0);topmost=(($style -band 8) -ne 0);mouseActivateResult=$result;foregroundUnchanged=($before -eq $after)} | ConvertTo-Json -Compress`;
 const report=await new Promise((resolve,reject)=>execFile(path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(ps,'utf16le').toString('base64')],{windowsHide:true,timeout:20000},(e,out,err)=>{if(e)reject(new Error(err||e.message));else resolve(JSON.parse(out.trim()));}));
 assert.equal(win.isFocusable(),false);assert.equal(win.isAlwaysOnTop(),true);assert.equal(report.noActivate,true);assert.equal(report.topmost,true);assert.equal(report.mouseActivateResult,3);assert.equal(report.foregroundUnchanged,true);
 fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../artifacts/window-native.json'),JSON.stringify({ok:true,...report},null,2));console.log(JSON.stringify(report));win.destroy();app.exit(0);
}).catch(e=>{console.error(e.stack);app.exit(1);});
