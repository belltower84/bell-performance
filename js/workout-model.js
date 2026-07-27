/* Bell Performance 10.0 — canonical workout metadata model.
   Training data is normalized here; UI files only display the result. */
(function(){
  const clean = value => String(value == null ? '' : value).trim();
  const unique = values => [...new Set((values || []).filter(Boolean))];
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

  function isEngineWorkout(workout){
    return Boolean(workout?.cardioType) || clean(workout?.name).startsWith('R-');
  }

  function inferEquipment(exercises,isEngine){
    if(isEngine) return ['Watch or timer', 'Appropriate footwear'];
    const names=(exercises||[]).map(ex=>clean(ex.name).toLowerCase()).join(' ');
    const found=[];
    const add=(label,pattern)=>{if(pattern.test(names))found.push(label);};
    add('Barbell',/barbell|back squat|front squat|deadlift|bench press|overhead press|good morning/);
    add('Bench',/bench|incline|chest-supported/);
    add('Dumbbells',/dumbbell|db\b|farmer/);
    add('Cable station',/cable|pulldown|face pull|triceps pressdown/);
    add('Pull-up bar',/pull-up|chin-up|hanging/);
    add('Kettlebell',/kettlebell|kb\b/);
    add('Machine',/machine|leg extension|leg curl|hack squat/);
    add('Bands',/band/);
    return unique(found).slice(0,6).length ? unique(found).slice(0,6) : ['Training equipment listed in each exercise'];
  }

  function focusFor(workout,isEngine){
    const blocks=unique((workout.exercises||[]).map(ex=>clean(ex.block)));
    if(isEngine) return unique(['Aerobic capacity', clean(workout.label||workout.name), ...blocks]).slice(0,3);
    const title=clean(workout.label||workout.name).toLowerCase();
    const focus=[];
    if(/upper/.test(title)) focus.push('Upper-body strength');
    if(/lower|leg/.test(title)) focus.push('Lower-body strength');
    if(/athletic/.test(title)) focus.push('Power and athleticism');
    if(/hypertrophy|bodybuild/.test(title)) focus.push('Muscle development');
    blocks.forEach(block=>{if(block && !/warm/i.test(block))focus.push(block);});
    return unique(focus).slice(0,3);
  }

  function intensityFor(workout,isEngine){
    const status=clean(workout.readiness?.status || (typeof readinessStatus==='function' ? readinessStatus() : 'GREEN')).toUpperCase();
    if(status==='RED') return 'Recovery';
    if(status==='YELLOW') return 'Moderate';
    const phase=clean(typeof blockPhase==='function' ? blockPhase() : '').toLowerCase();
    if(/peak|race|specific/.test(phase)) return 'Peak';
    return isEngine ? 'Moderate' : 'Hard';
  }

  function nextWorkoutFor(workout){
    const appData=typeof data!=="undefined"?data:null;
    const plan=Array.isArray(appData?.plan)?appData.plan:[];
    if(!plan.length)return null;
    let index=workout.planId?plan.findIndex(item=>item.id===workout.planId):-1;
    if(index<0)index=plan.findIndex(item=>item.mission===workout.name && !item.done);
    const candidates=index>=0?plan.slice(index+1):plan;
    const next=candidates.find(item=>!item.done && !['skipped','replaced'].includes(item.status));
    if(!next)return null;
    return {
      title: next.label || next.mission || 'Next session',
      mission: next.mission || '',
      day: next.day || '',
      duration: Math.max(10,Number(next.prescribedDuration || next.duration || next.secondaryDuration)||30)
    };
  }

  function sectionLabel(block,isEngine){
    const value=clean(block);
    if(!value)return isEngine?'Conditioning':'Training';
    if(/primary/i.test(value))return 'Primary Work';
    if(/accessory|secondary|hypertrophy/i.test(value))return 'Accessory Work';
    if(/conditioning|engine|interval|run/i.test(value))return 'Engine';
    if(/mobility|cool|recovery/i.test(value))return 'Cooldown';
    return value;
  }

  function buildSections(workout,isEngine,duration){
    const groups=[];
    (workout.exercises||[]).forEach(ex=>{
      const label=sectionLabel(ex.block,isEngine);
      let group=groups.find(item=>item.title===label);
      if(!group){group={title:label,sets:0};groups.push(group);}
      group.sets += Array.isArray(ex.sets)?ex.sets.length:Number(ex.originalSets)||0;
    });
    const warmup=isEngine?5:10;
    const cooldown=isEngine?5:Math.min(5,Math.max(0,duration-15));
    const workMinutes=Math.max(5,duration-warmup-cooldown);
    const totalWeight=groups.reduce((sum,g)=>sum+Math.max(1,g.sets),0)||1;
    const sections=[{title:'Warm-up',minutes:warmup}];
    let allocated=0;
    groups.forEach((group,index)=>{
      const minutes=index===groups.length-1?workMinutes-allocated:Math.max(3,Math.round(workMinutes*Math.max(1,group.sets)/totalWeight));
      allocated+=minutes;
      sections.push({title:group.title,minutes});
    });
    if(cooldown>0)sections.push({title:'Cooldown',minutes:cooldown});
    const total=sections.reduce((sum,s)=>sum+s.minutes,0);
    if(total!==duration && sections.length>1)sections[sections.length-2].minutes=Math.max(1,sections[sections.length-2].minutes+(duration-total));
    return sections;
  }

  function coachBriefFor(workout,isEngine,intensity,next){
    const title=clean(workout.label||workout.name)||'today’s session';
    const nextText=next?` while preserving enough recovery for ${next.day?`${next.day}'s `:''}${next.title}`:'';
    if(isEngine)return `${title} develops sustainable work capacity${nextText}. Control the opening effort, settle into the prescribed pace, and finish with the same mechanics you started with.`;
    const effort=intensity==='Recovery'?'Keep every set smooth and well short of failure.':intensity==='Moderate'?'Use crisp technique and leave two reps in reserve.':'Own the working sets and leave one rep in reserve on the final compound sets.';
    return `${title} advances the current strength progression${nextText}. ${effort}`;
  }

  function normalizeWorkout(workout){
    if(!workout)return workout;
    const engine=isEngineWorkout(workout);
    const duration=Math.max(10,Number(workout.duration ?? workout.prescribedDuration ?? workout.estimatedDuration)||30);
    const workSets=(workout.exercises||[]).reduce((sum,ex)=>sum+(Array.isArray(ex.sets)?ex.sets.length:Number(ex.originalSets)||0),0);
    const next=nextWorkoutFor(workout);
    const intensity=intensityFor(workout,engine);
    const appData=typeof data!=="undefined"?data:null;
    const block=appData?.trainingBlock||{};
    workout.duration=duration;
    workout.prescribedDuration=duration; // backward compatibility for existing screens
    workout.workSets=workSets;
    workout.intensity=intensity;
    workout.equipment=inferEquipment(workout.exercises,engine);
    workout.focus=focusFor(workout,engine);
    workout.sections=buildSections(workout,engine,duration);
    workout.nextWorkout=next;
    workout.week=Math.max(1,Number(block.currentWeek)||1);
    workout.phase=clean(typeof blockPhase==='function'?blockPhase():appData?.settings?.phase)||'Training';
    workout.coachBrief=coachBriefFor(workout,engine,intensity,next);
    workout.successCriteria=engine
      ? ['Hold the prescribed effort','Keep breathing and mechanics controlled','Record the official result']
      : ['Complete every prescribed working set','Maintain clean technique','Stop before form breaks down'];
    return workout;
  }

  window.bpNormalizeWorkout=normalizeWorkout;
  window.bpWorkoutIsEngine=isEngineWorkout;
})();
