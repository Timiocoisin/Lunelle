'use strict';
const path=require('node:path');
function validateDirectory(value,env=process.env){
 if(typeof value!=='string'||value.length>180||!/^\s*[a-z]:\\/i.test(value)||/["<>|?*\x00-\x1f]/.test(value))throw Error('请选择有效的本地安装文件夹。');
 const dir=path.win32.resolve(value.trim());
 if(dir===path.win32.parse(dir).root||dir.slice(2).includes(':'))throw Error('请在磁盘内新建或选择一个 Lunelle 文件夹。');
 const windows=env.SystemRoot||'C:\\Windows';
 if(dir.toLowerCase()===windows.toLowerCase()||dir.toLowerCase().startsWith(windows.toLowerCase()+'\\'))throw Error('请选择 Windows 系统目录以外的安装位置。');
 return dir;
}
module.exports={validateDirectory};
