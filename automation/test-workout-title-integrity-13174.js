"use strict";
const fs=require("fs"),vm=require("vm");
let checks=0;
function ok(value,message){checks++;if(!value)throw new Error(`FAIL: ${message}`);}
const window={data:{settings:{sex:"male"}},scaledTemplate:()=>null,premiumSessionType:(s)=>s.type||"strength"};
window.window=window;
vm.runInNewContext(fs.readFileSync(require("path").join(__dirname,"..","js","workout-display-names.js"),"utf8"),window);
const label=window.bellWorkoutDisplayLabel;
ok(label({label:"Strength Press",type:"strength"})==="Press","Strength Press preserves complete Press title");
ok(label({label:"Strength Pull",type:"strength"})==="Pull","Strength Pull preserves complete Pull title");
ok(label({label:"Strength A — Bench & Back",type:"strength"})==="Bench & Back","single-letter block marker is removed only before a delimiter");
ok(label({label:"Primary Upper Strength — Bench & Back",type:"strength"})==="Bench & Back","structured prefix still cleans correctly");
ok(label({label:"Press",type:"strength"})==="Press","already concise title is unchanged");
ok(label({label:"Easy Aerobic Support",type:"engine"})==="Aerobic Support","engine title normalization remains intact");
ok(!["ress","ngth","ine",""].includes(label({label:"Strength Press",type:"strength"})),"malformed title fragments are rejected");
console.log(`PASS: ${checks}/${checks} workout title integrity checks.`);
