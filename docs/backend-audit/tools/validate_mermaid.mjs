// Parser validation only; dependencies installed in TEMP, never app directories.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
const modules=path.join(os.tmpdir(),'bakery-backend-audit-20261107-mermaid','node_modules');
const {JSDOM}=await import(pathToFileURL(path.join(modules,'jsdom/lib/api.js')).href);
const dom=new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window=dom.window;globalThis.document=dom.window.document;
const {default:mermaid}=await import(pathToFileURL(path.join(modules,'mermaid/dist/mermaid.esm.mjs')).href);
mermaid.initialize({startOnLoad:false,securityLevel:'strict'});
const dir=path.resolve('docs/backend-audit/diagrams');
const results=[];
for(const file of await fs.readdir(dir)){
  if(!file.endsWith('.mmd'))continue;
  try {const d=await mermaid.parse(await fs.readFile(path.join(dir,file),'utf8'));results.push({file,status:'PASS',diagramType:d.diagramType});}
  catch(e){results.push({file,status:'FAIL',error:String(e.message).slice(0,600)});}
}
const result={status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',diagrams:results};
await fs.writeFile('docs/backend-audit/evidence/mermaid-validation.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
if(result.status!=='PASS')process.exitCode=1;
