'use strict';
const { spawn } = require('node:child_process');
// Only button-down edges are observed while the panel is open. No keyboard,
// coordinates, or click history are recorded by the helper.
const script = `Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class XYMouse { [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key); }'
$previous = 0
foreach ($key in @(1,2,4)) { if (([XYMouse]::GetAsyncKeyState($key) -band 32768) -ne 0) { $previous = $previous -bor $key } }
while ($true) {
  $current = 0
  foreach ($key in @(1,2,4)) { if (([XYMouse]::GetAsyncKeyState($key) -band 32768) -ne 0) { $current = $current -bor $key } }
  if (($current -band (-bnot $previous)) -ne 0) { [Console]::WriteLine('down') }
  $previous = $current
  Start-Sleep -Milliseconds 20
}`;
function contains(rect, point) {
  return point.x >= rect.x && point.y >= rect.y && point.x <= rect.x + rect.width && point.y <= rect.y + rect.height;
}
class OutsideClick {
  constructor(onDown) { this.onDown = onDown; this.child = null; }
  start() {
    if (this.child || process.platform !== 'win32') return;
    const executable = require('node:path').join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
    const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    this.child = child;
    let buffer = '';
    child.stdout.on('data', data => { buffer += data.toString(); const lines = buffer.split(/\r?\n/); buffer = lines.pop(); for (const line of lines) if (line === 'down' && this.child === child) this.onDown(); });
    child.on('error', () => { if (this.child === child) this.child = null; });
    child.on('exit', () => { if (this.child === child) this.child = null; });
  }
  stop() { const child = this.child; this.child = null; child?.kill(); }
}
module.exports = { OutsideClick, contains };
