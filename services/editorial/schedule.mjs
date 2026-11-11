export function shanghai(now=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now).map(x=>[x.type,x.value]))
 return {day:p.year+'-'+p.month+'-'+p.day,hour:Number(p.hour),minute:Number(p.minute),weekday:p.weekday}
}
export function collectionDecision(state,policy,now=new Date()){
 const local=shanghai(now),p=policy.collection
 if(p.weekdaysOnly&&['Sat','Sun'].includes(local.weekday))return {run:false,reason:'weekend'}
 if(local.hour*60+local.minute<p.hour*60+p.minute)return {run:false,reason:'before-schedule'}
 if(state.successDay===local.day)return {run:false,reason:'already-completed'}
 const attempts=state.attemptDay===local.day?(state.attempts||1):0
 if(state.state==='running'&&Date.parse(state.startedAt||'')>now.getTime()-p.staleRunMinutes*60000)return {run:false,reason:'already-running'}
 if(attempts>=p.retryMinutes.length+1)return {run:false,reason:'retry-budget-exhausted'}
 if(attempts){const last=Date.parse(state.finishedAt||state.startedAt||'');if(Number.isFinite(last)&&now.getTime()-last<p.retryMinutes[attempts-1]*60000)return {run:false,reason:'retry-wait'}}
 return {run:true,day:local.day,attempts:attempts+1,reason:attempts?'retry':'scheduled'}
}
