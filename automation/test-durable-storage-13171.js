'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../js/storage.js'),'utf8');
class QuotaStorage{
  constructor(limit=5_000_000){this.limit=limit;this.map=new Map();}
  getItem(k){return this.map.has(k)?this.map.get(k):null;}
  setItem(k,v){const text=String(v);let total=0;for(const [key,val] of this.map)if(key!==k)total+=Buffer.byteLength(val);total+=Buffer.byteLength(text);if(total>this.limit){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e;}this.map.set(k,text);}
  removeItem(k){this.map.delete(k);}
}
const context={
  console, setTimeout:(fn)=>{ /* archive flush intentionally deferred */ }, clearTimeout,
  localStorage:new QuotaStorage(), indexedDB:undefined,
  Blob:global.Blob, URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
  document:{createElement:()=>({click(){}})}, window:{}, confirm:()=>true,
  alert:()=>{}, FileReader:function(){}, renderApp:undefined,
  todayKey:()=> '2026-08-03'
};
vm.createContext(context);
vm.runInContext(source+`\n;globalThis.__test={data,saveData,storageDiagnostics,compactDataForPersistence,STORAGE_KEY};`,context);
const t=context.__test;
for(let i=0;i<900;i++){
  t.data.history.push({id:`h-${i}`,date:`2026-${String(1+(i%12)).padStart(2,'0')}-01`,sessionId:`s-${i}`,channel:i%2?'strength':'engine',status:'completed',exercise_results:Array.from({length:7},(_,j)=>({exercise:`Exercise ${j}`,sets:Array.from({length:5},(_,k)=>({reps:10,weight:225,rpe:7.5,notes:'x'.repeat(80)}))})),notes:'z'.repeat(500)});
  t.data.responseEngine.decisions.push({id:`d-${i}`,sessionId:`s-${i}`,decision:'observe',diagnostics:{payload:'d'.repeat(600)}});
  t.data.responseEngine.prescriptionApplications.push({applicationId:`a-${i}`,targetSessionId:`s-${i+1}`,decision:'progress',targetSnapshot:{payload:'a'.repeat(900)}});
  t.saveData({render:false});
}
const persisted=context.localStorage.getItem(t.STORAGE_KEY);
assert(persisted,'state persisted');
assert(Buffer.byteLength(persisted)<5_000_000,'persisted state stays below quota');
assert(t.data.history.length<=180,'recent history bounded');
assert(t.data.responseEngine.decisions.length<=180,'recent decisions bounded');
assert(t.data.responseEngine.prescriptionApplications.length<=180,'recent applications bounded');
assert(t.data.storageDurability.archiveCounts.history>0,'history archive count recorded');
assert(t.data.storageDurability.summaries.length>0,'compact summaries retained');
const before=t.data.history.length;t.saveData({render:false});assert.equal(t.data.history.length,before,'repeat save stable');
console.log('PASS: 8/8 durable storage and compaction checks.');
console.log(JSON.stringify(t.storageDiagnostics(),null,2));
