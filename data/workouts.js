"use strict";

const workoutTemplates={
"S-1 Upper Strength":{
 duration:60,location:"Home or Work Gym",
 exercises:[
  {name:"Bench Press",sets:5,reps:"5",rest:150,cue:"Leave 1–2 reps in reserve."},
  {name:"Weighted Pull-up",sets:4,reps:"5–8",rest:120,cue:"Full hang. Chest toward bar."},
  {name:"Incline Dumbbell Press",sets:3,reps:"8–12",rest:90,cue:"Controlled lowering."},
  {name:"Chest-Supported Row",sets:4,reps:"8–12",rest:90,cue:"Pause at the top."},
  {name:"Farmer Carry",sets:4,reps:"40 yd",rest:60,cue:"Tall posture and hard brace."}
 ]},
"S-2 Lower Strength":{
 duration:60,location:"Home Gym",
 exercises:[
  {name:"Back Squat",sets:5,reps:"5",rest:180,cue:"Smooth reps. No grinders."},
  {name:"Romanian Deadlift",sets:4,reps:"6–8",rest:120,cue:"Hinge and keep lats tight."},
  {name:"Reverse Lunge",sets:3,reps:"8/leg",rest:90,cue:"Control knee and pelvis."},
  {name:"Standing Calf Raise",sets:3,reps:"12–15",rest:60,cue:"Full stretch and pause."},
  {name:"Farmer Carry",sets:5,reps:"40 yd",rest:60,cue:"Strong posture."}
 ]},
"S-3 Athletic Upper":{
 duration:45,location:"Home or Work Gym",
 exercises:[
  {name:"Push Press",sets:5,reps:"3",rest:120,cue:"Fast bar speed."},
  {name:"Chin-up",sets:4,reps:"AMRAP -2",rest:90,cue:"Stop before form breaks."},
  {name:"Single-Arm Dumbbell Row",sets:3,reps:"10/side",rest:75,cue:"Drive elbow toward hip."},
  {name:"Push-up",sets:3,reps:"15–20",rest:60,cue:"Rigid plank position."},
  {name:"Battle Rope or Med-Ball Throw",sets:8,reps:"15 sec",rest:45,cue:"Explosive effort."}
 ]},
"S-4 Athletic Lower":{
 duration:50,location:"Home Gym or Outdoors",
 exercises:[
  {name:"Box Jump",sets:5,reps:"3",rest:60,cue:"Land quietly."},
  {name:"Trap-Bar Deadlift",sets:5,reps:"3",rest:150,cue:"Fast, clean reps."},
  {name:"Bulgarian Split Squat",sets:3,reps:"8/leg",rest:90,cue:"Stable trunk."},
  {name:"Kettlebell Swing",sets:4,reps:"15",rest:60,cue:"Snap the hips."},
  {name:"Short Sprint",sets:6,reps:"15–20 sec",rest:90,cue:"Full quality each rep."}
 ]},
"R-1 Recovery Run":{duration:20,location:"Outdoors",exercises:[{name:"Recovery Run",sets:1,reps:"20 min easy",rest:0,cue:"Very easy pace. Nasal breathing when possible."}]},
"R-2 Easy Run":{duration:30,location:"Outdoors",exercises:[{name:"Easy Run",sets:1,reps:"2–3 miles",rest:0,cue:"Conversational pace."}]},
"R-3 Tempo Run":{duration:30,location:"Outdoors",exercises:[{name:"Warm-up Walk/Jog",sets:1,reps:"8 min",rest:0,cue:"Start easy."},{name:"Tempo Run",sets:3,reps:"5 min",rest:120,cue:"Controlled hard pace."},{name:"Cool-down",sets:1,reps:"5 min",rest:0,cue:"Easy jog or walk."}]},
"R-4 Intervals":{duration:30,location:"Outdoors",exercises:[{name:"Warm-up",sets:1,reps:"10 min",rest:0,cue:"Easy jog plus drills."},{name:"Fast Interval",sets:6,reps:"1 min",rest:120,cue:"Fast, not all-out."},{name:"Cool-down",sets:1,reps:"5 min",rest:0,cue:"Walk or jog."}]},
"R-5 Long Run":{duration:45,location:"Outdoors",exercises:[{name:"Long Easy Run",sets:1,reps:"3–5 miles",rest:0,cue:"Keep effort easy and steady."}]},
"M-1 Daily Reset":{duration:10,location:"Anywhere",exercises:[{name:"Deep Squat Hold",sets:1,reps:"60 sec",rest:0,cue:"Use support if needed."},{name:"World's Greatest Stretch",sets:1,reps:"5/side",rest:0,cue:"Slow rotation."},{name:"Couch Stretch",sets:1,reps:"45 sec/side",rest:0,cue:"Keep ribs down."},{name:"90/90 Hip Rotations",sets:1,reps:"10",rest:0,cue:"Stay tall."},{name:"Dead Hang",sets:1,reps:"30–45 sec",rest:0,cue:"Relax shoulders."}]}
};

const motivationalQuotes=[
 {text:"Discipline is choosing between what you want now and what you want most.",author:"Abraham Lincoln"},
 {text:"Success is the sum of small efforts repeated day in and day out.",author:"Robert Collier"},
 {text:"You do not rise to the level of your goals. You fall to the level of your systems.",author:"James Clear"},
 {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
 {text:"Strength does not come from what you can do. It comes from overcoming what you once thought you could not.",author:"Rikki Rogers"},
 {text:"The man who moves a mountain begins by carrying away small stones.",author:"Confucius"},
 {text:"Hard work beats talent when talent does not work hard.",author:"Tim Notke"},
 {text:"The only bad workout is the one that did not happen.",author:"Unknown"},
 {text:"Do today what others will not, so tomorrow you can do what others cannot.",author:"Jerry Rice"},
 {text:"Motivation gets you started. Habit keeps you going.",author:"Jim Ryun"},
 {text:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.",author:"Often attributed to Aristotle"},
 {text:"You will never always be motivated, so you must learn to be disciplined.",author:"Unknown"},
 {text:"The pain of discipline is far less than the pain of regret.",author:"Sarah Bombell"},
 {text:"A year from now, you may wish you had started today.",author:"Karen Lamb"},
 {text:"It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.",author:"Socrates"},
 {text:"Fall seven times, stand up eight.",author:"Japanese proverb"},
 {text:"Courage is not having the strength to go on; it is going on when you do not have the strength.",author:"Often attributed to Napoleon"},
 {text:"Your body can stand almost anything. It is your mind you have to convince.",author:"Unknown"},
 {text:"The work you do when no one is watching is what makes the difference when everyone is watching.",author:"Unknown"},
 {text:"Do not count the days. Make the days count.",author:"Muhammad Ali"},
 {text:"If you are tired of starting over, stop giving up.",author:"Unknown"},
 {text:"You cannot improve what you do not consistently practice.",author:"Unknown"},
 {text:"Little by little, a little becomes a lot.",author:"Tanzanian proverb"},
 {text:"The future depends on what you do today.",author:"Mahatma Gandhi"},
 {text:"Train hard, recover well, and show up again.",author:"Bell Performance"},
 {text:"Earn the confidence you want through the work you do today.",author:"Bell Performance"},
 {text:"Strong enough for the task. Fit enough for the mission. Ready for the life.",author:"Bell Performance"},
 {text:"Today is not about proving everything. It is about moving one step forward.",author:"Bell Performance"},
 {text:"Consistency is a form of courage.",author:"Bell Performance"},
 {text:"Build the body that can carry the life you want to live.",author:"Bell Performance"},
 {text:"Stay ready so you do not have to get ready.",author:"Traditional saying"}
];

function getDailyQuote(){
 const now=new Date();
 const start=new Date(now.getFullYear(),0,0);
 const day=Math.floor((now-start)/86400000);
 return motivationalQuotes[day % motivationalQuotes.length];
}
