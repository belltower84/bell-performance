"use strict";
const fs=require("fs"),path=require("path");
global.window=global;
require(path.join(__dirname,"..","js","prescription-application-13150.js"));

const strength=()=>({name:"Squat Focus",label:"Squat Focus",duration:60,exercises:[{name:"Back Squat",sets:4,reps:"5",recommendedWeight:300,cue:"Brace"},{name:"Barbell Row",sets:3,reps:"8",recommendedWeight:150,cue:"Control"}]});
const engine=()=>({name:"R-5 Long Run",label:"Long Run",duration:60,exercises:[{name:"Long Run",sets:1,reps:"60 minutes"}]});
const decision=(status="progress",channel="strength",factors={})=>({status,intensity_factor:factors.intensity??1.025,volume_factor:factors.volume??1.04,engine_duration_factor:factors.engine??1.05,longitudinal:{channel,global_exposure:2,channel_exposure:2},reason_codes:["TEST"],explanation:"Apply the stabilized response."});
const app=(status="progress",channel="strength",factors={},exercises=[])=>bellBuildPrescriptionApplication(decision(status,channel,factors),exercises,"source-1",channel);
const rows=[];
function check(id,title,fn){try{const detail=fn();rows.push({id,title,passed:true,detail:detail||"Passed"});}catch(error){rows.push({id,title,passed:false,detail:error.stack||String(error)});}}
const assert=(value,message)=>{if(!value)throw new Error(message);};

check("strength-progress","Strength progress changes the next dose",()=>{const out=bellApplyClosedLoopPrescription(strength(),app());assert(out.exercises[0].recommendedWeight>300,"load did not increase");assert(out.closedLoopApplicationId,"application id missing");});
check("strength-accelerate","Accelerated progression stays inside ceiling",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("accelerate","strength",{intensity:1.1,volume:1.15}));assert(out.exercises[0].recommendedWeight===330,"wrong load");assert(out.exercises[0].sets<=5,"volume exceeded");});
check("strength-hold","Hold caps effort without progressing movement",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("hold","strength",{intensity:.98,volume:.9}));assert(out.exercises[0].recommendedWeight<=300,"hold progressed load");assert(out.exercises[0].responseRpeCap===7.5,"hold cap missing");});
check("strength-regress","Regression reduces load and volume",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("regress","strength",{intensity:.95,volume:.8},[{exercise_key:"back-squat",exercise_name:"Back Squat",status:"regress",load_factor:.95}]));assert(out.exercises[0].recommendedWeight===285,"regression wrong");assert(out.exercises[0].sets===3,"volume wrong");});
check("strength-rebuild","Rebuild returns with reduced prescription",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("rebuild","strength",{intensity:.95,volume:.8}));assert(out.exercises[0].recommendedWeight===285,"rebuild load wrong");assert(out.exercises[0].responseRpeCap===7,"rebuild cap missing");});
check("strength-deload","Deload limits work sets and effort",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("deload","strength",{intensity:.95,volume:.75}));assert(out.exercises[0].sets<=2,"deload sets too high");assert(out.exercises[0].responseRpeCap===6.5,"deload cap missing");});
check("strength-reentry","Re-entry keeps the next exposure conservative",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("reentry","strength",{intensity:.98,volume:.9}));assert(out.exercises[0].recommendedWeight<=294,"reentry load too high");assert(out.exercises[0].responseRpeCap===7,"reentry cap missing");});
check("exercise-protect-squat","Pain protects only the affected squat",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("protect","strength",{intensity:.95,volume:.75},[{exercise_key:"back-squat",exercise_name:"Back Squat",status:"protect"}]));assert(out.exercises[0].protectedSubstitution,"squat not protected");assert(out.exercises[1].name==="Barbell Row","unaffected movement changed");});
check("exercise-protect-row","Technique concern protects only the affected pull",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("protect","strength",{intensity:.95,volume:.75},[{exercise_key:"barbell-row",exercise_name:"Barbell Row",status:"protect"}]));assert(out.exercises[1].name.includes("Pain-Free"),"row substitute missing");assert(out.exercises[0].name==="Back Squat","squat changed");});
check("safety-hold","Safety hold replaces hard training with recovery",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("safety_hold","strength",{intensity:.9,volume:.6,engine:.7}),{mission:"PL-1 Squat",eventRole:"primary_lift"});assert(out.label.includes("Safety Hold"),"safety label missing");assert(out.exercises.length===1,"hard exercises remained");assert(out.originalMission==="PL-1 Squat","identity not retained");});
check("engine-progress","Engine progress changes duration only",()=>{const out=bellApplyClosedLoopPrescription(engine(),app("progress","engine",{engine:1.05}),{mission:"R-5 Long Run",eventRole:"long"});assert(out.duration===63,"duration wrong");assert(out.name==="R-5 Long Run","mission changed");});
check("engine-accelerate","Engine acceleration respects ten-percent step",()=>{const out=bellApplyClosedLoopPrescription(engine(),app("accelerate","engine",{engine:1.1}));assert(out.duration===66,"accelerated duration wrong");});
check("engine-hold","Engine hold reduces next duration",()=>{const out=bellApplyClosedLoopPrescription(engine(),app("hold","engine",{engine:.92}));assert(out.duration===55,"hold duration wrong");});
check("engine-rebuild","Engine rebuild reduces next duration",()=>{const out=bellApplyClosedLoopPrescription(engine(),app("rebuild","engine",{engine:.85}));assert(out.duration===51,"rebuild duration wrong");});
check("channel-isolation","Engine decision cannot change strength prescription",()=>{const original=strength(),out=bellApplyClosedLoopPrescription(original,app("progress","engine"));assert(JSON.stringify(out)===JSON.stringify(original),"cross-channel change occurred");});
check("idempotency","The same application cannot compound twice",()=>{const application=app(),once=bellApplyClosedLoopPrescription(strength(),application),twice=bellApplyClosedLoopPrescription(once,application);assert(JSON.stringify(once)===JSON.stringify(twice),"application compounded");});
check("role-invariant","Event roles remain present after dose application",()=>{const meta={mission:"PL-1 Squat",eventRole:"primary_lift",sessionRole:"competition_squat"},out=bellApplyClosedLoopPrescription(strength(),app(),meta);assert(out.prescriptionApplication.identityInvariant===true,"identity invariant missing");assert(out.prescriptionApplication.rolesBefore.eventRole==="primary_lift","role lost");});
check("exercise-hold","Exercise hold blocks a movement-specific increase",()=>{const out=bellApplyClosedLoopPrescription(strength(),app("progress","strength",{intensity:1.05,volume:1.04},[{exercise_key:"back-squat",exercise_name:"Back Squat",status:"hold"}]));assert(out.exercises[0].recommendedWeight===300,"held exercise increased");assert(out.exercises[1].recommendedWeight>150,"other exercise did not follow session progression");});

// Local-plan routing and persistence controls.
global.data={plan:[
 {id:"p0",status:"completed",mission:"S-1",scheduledDate:"2026-08-01",done:true,sessionCompletions:{}},
 {id:"p1",status:"planned",mission:"R-2",scheduledDate:"2026-08-02",done:false,sessionCompletions:{}},
 {id:"p2",status:"planned",mission:"S-2",scheduledDate:"2026-08-03",done:false,sessionCompletions:{}},
],responseEngine:{prescriptionApplications:[]},trainingBlock:{}};
global.sessionsFromPlanItem=item=>[{mission:item.mission,sessionKey:`${item.id}:primary`,sessionType:/^R-/.test(item.mission)?"engine":"strength",scheduledDate:item.scheduledDate}];
global.bellPlannedSessionCompleted=item=>Boolean(item.done);
check("next-comparable-routing","Application targets the next same-channel session",()=>{const response={decision:decision("progress","strength"),exerciseDecisions:[]};const scheduled=bellScheduleClosedLoopApplication({planId:"p0",sessionType:"strength",completedAt:"2026-08-01T12:00:00Z",structuredCompletion:{session_id:"source-1"}},response);assert(scheduled.targetPlanId==="p2","wrong target plan");assert(!data.plan[1].prescriptionApplications,"engine session changed");assert(data.plan[2].prescriptionApplications["p2:primary"],"target metadata missing");});
check("application-consumption","Completing an adapted session consumes its application",()=>{const current=data.responseEngine.prescriptionApplications[0];bellConsumeClosedLoopApplication({prescriptionApplicationId:current.applicationId,completedAt:"2026-08-03T12:00:00Z",planSessionKey:"p2:primary"});assert(current.state==="consumed","application not consumed");});

const output={version:"13.15.0",total:rows.length,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,cases:rows};
const dir=path.join(__dirname,"prescription_application_reports","latest");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"js-results.json"),JSON.stringify(output,null,2));
console.log(`${output.passed}/${output.total} JavaScript closed-loop cases passed`);
if(output.failed)process.exit(1);
