'use strict';
// Keep the generated character icon consistent in development and releases.
const fs=require('node:fs'),path=require('node:path');
function makeIcon(file){
  const source=path.join(__dirname,'../assets/icon.png');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  if(path.resolve(file)!==path.resolve(source))fs.copyFileSync(source,file);
  const ico=file.replace(/\.png$/,'.ico'),sourceIco=path.join(__dirname,'../assets/icon.ico');
  if(path.resolve(ico)!==path.resolve(sourceIco))fs.copyFileSync(sourceIco,ico);
}
if(require.main===module)makeIcon(path.join(__dirname,'../assets/icon.png'));
module.exports={makeIcon};
