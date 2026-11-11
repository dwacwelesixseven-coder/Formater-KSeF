import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const page=html.slice(html.indexOf('// ---- Page ----'),html.indexOf("var drop=$('drop')"));
const batch=html.slice(html.indexOf('async function downloadAll(){'),html.lastIndexOf('</script>'));
function setup(){
  const elements=new Map();
  const context=vm.createContext({console,setTimeout,clearTimeout,localStorage:{getItem:()=>null},window:{},
    document:{getElementById(id){if(!elements.has(id))elements.set(id,{setAttribute(){},textContent:''});return elements.get(id);}},
    JSZip:class{file(){}async generateAsync(options,progress){progress({percent:100});return {size:42};}}});
  vm.runInContext(page+'\n'+batch,context);
  context.render=()=>{};context.toast=()=>{};context.opts=()=>({});
  return context;
}
const report=id=>({id,filename:id+'.xlsx',blob:{size:10},infos:[{period:'2026-10'}],target:'Firma'});

// A failure and a missing destination must not prevent later documents from saving.
{
  const c=setup(),a=report('a'),b=report('b'),d=report('d'),e=report('e');d.target=null;
  c.rootDir={name:'FAKTURY'};c.outputs=[a,b,d,e];
  const seen=[];c.fileOut=async o=>{seen.push(o.id);if(o===b){o.fileErr='Dysk pełny';return false;}return true;};
  await c.downloadAll();
  assert.deepEqual(seen,['a','b','e']);assert.deepEqual(c.outputs.map(o=>o.downloadState),['ok','err','err','ok']);
  assert.equal(c.downloadBusy,false);
}
// Success must wait for close(), including a failed close or failed write.
for(const failure of [null,'write','close']){
  const c=setup(),o=report('a');c.outputs=[o];let resolveClose,aborted=false;
  c.window.showSaveFilePicker=async()=>({createWritable:async()=>({
    async write(){if(failure==='write')throw Error('write failed');},
    async close(){if(failure==='close')throw Error('close failed');await new Promise(r=>{resolveClose=r;});},
    async abort(){aborted=true;}
  })});
  const job=c.getOut(o);
  if(!failure){while(!resolveClose)await new Promise(r=>setTimeout(r,0));assert.equal(o.downloadState,'pending');resolveClose();}
  await job;assert.equal(o.downloadState,failure?'err':'ok');assert.equal(aborted,!!failure);
}
// One picker and one archive for the whole batch, with independent format errors.
{
  const c=setup();c.outputs=[report('a'),report('b'),{filename:'bad.xls',error:'Uszkodzony raport'}];let picks=0,writes=0;
  c.window.showSaveFilePicker=async()=>{picks++;return {createWritable:async()=>({async write(){writes++;},async close(){}})};};
  await c.downloadAll();assert.equal(picks,1);assert.equal(writes,1);
  assert.deepEqual(c.outputs.map(o=>o.downloadState),['ok','ok','err']);
}
// Cancellation and archive generation failure must never leave green checks or a busy UI.
for(const kind of ['cancel','zip']){
  const c=setup();c.outputs=[report('a'),report('b')];
  if(kind==='cancel')c.window.showSaveFilePicker=async()=>{throw Object.assign(Error(),{name:'AbortError'});};
  else c.JSZip=class{file(){}async generateAsync(){throw Error('Nie udało się utworzyć ZIP');}};
  await c.downloadAll();assert.deepEqual(c.outputs.map(o=>o.downloadState),['err','err']);assert.equal(c.downloadBusy,false);
}
// A browser handoff is not proof of a completed download.
{
  const c=setup(),o=report('a');c.outputs=[o];c.save=async()=> 'sent';
  await c.getOut(o);assert.equal(o.downloadState,'sent');
}
// A second click during an active batch must not start duplicate writes.
{
  const c=setup();c.rootDir={name:'FAKTURY'};c.outputs=[report('a')];let finish,count=0;
  c.fileOut=async()=>{count++;return await new Promise(r=>{finish=r;});};
  const active=c.downloadAll();await c.downloadAll();assert.equal(count,1);finish(true);await active;
}
console.log('Download checks passed: mixed results, close/write failures, archive, cancellation, fallback and duplicate clicks.');
