import {FALLACIES,SOURCES,requestTurn,detectFallacies,simulateArgument} from './engine.js?v=20261112-2';
const $=s=>document.querySelector(s);
const KEY='contraluz.session.v1';
const PROFILES_KEY='contraluz.profiles.v1';
const ACTIVE_KEY='contraluz.active.v1';
let session=null,mode='debate',busy=false,controller=null,storageOK=true,viewingModes=false;
let profiles=[],activeId='';
let detectResult=null,simResult=null;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function sessionKey(){const p=activeProfile();return p?KEY+'.'+p.id:KEY;}
function activeProfile(){return profiles.find(p=>p.id===activeId)||null;}
function saveProfiles(){try{localStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));localStorage.setItem(ACTIVE_KEY,activeId);}catch{storageOK=false;}}
function loadProfiles(){try{const raw=JSON.parse(localStorage.getItem(PROFILES_KEY)||'[]');if(Array.isArray(raw))profiles=raw.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string').map(x=>({id:x.id,name:String(x.name).slice(0,60),email:typeof x.email==='string'?x.email.slice(0,120):'',createdAt:typeof x.createdAt==='string'?x.createdAt:new Date().toISOString(),stats:{debates:Math.max(0,Math.floor(Number(x.stats&&x.stats.debates))||0),points:Math.max(0,Math.floor(Number(x.stats&&x.stats.points))||0)}}));}catch{profiles=[];storageOK=false;}
try{activeId=localStorage.getItem(ACTIVE_KEY)||'';}catch{activeId='';}
if(activeId&&!profiles.some(p=>p.id===activeId))activeId='';}
function save(){try{if(session)localStorage.setItem(sessionKey(),JSON.stringify(session));else localStorage.removeItem(sessionKey());}catch{storageOK=false;} storageNote();}
function storageNote(){const p=activeProfile();$('#storage').textContent=storageOK?('Historial local en este navegador'+(p?' (registro: '+p.name+')':'')+'. No se sincroniza. Puedes descargarlo o borrarlo.'):'No se ha podido guardar el historial en este navegador. Descarga la conversación para conservarla.';}
function loadSession(){session=null;try{const s=JSON.parse(localStorage.getItem(sessionKey())||'null');if(s&&typeof s.topic==='string'&&Array.isArray(s.messages)&&s.messages.length<=100&&s.messages.every(m=>['user','model','point'].includes(m.role)&&typeof m.text==='string'))session=s;}catch{storageOK=false;}}
loadProfiles();loadSession();
function paint(){
 const showArena=!!session&&!viewingModes;
 $('.intro').hidden=showArena;$('#setup').hidden=showArena;$('#arena').hidden=!showArena;
 $('#resume-debate').hidden=!(session&&viewingModes);
 if(session&&viewingModes)$('#resume-debate').textContent='← Volver al debate en curso: '+session.topic.slice(0,80);
 const prof=activeProfile();$('#profile-open').textContent=prof?prof.name:'Entrar / registro';
 $('#restart').hidden=!session||!!session.ended;
 if(!session){storageNote();return;}
 $('#session-topic').textContent=session.topic;
 $('#difficulty-label').textContent=`SIMULACIÓN · NIVEL ${session.difficulty.toUpperCase()}${session.ended?' · CERRADA':''}`;
 $('#score').textContent=String(session.messages.filter(m=>m.role==='point').length);
 const root=$('#messages');root.replaceChildren();
 session.messages.forEach(m=>{const card=el('article',undefined,'message '+m.role);card.append(el('div',m.role==='user'?'Tú':m.role==='point'?'Fuera de personaje':'Interlocutor','speaker'),el('p',m.text));root.append(card);});
 $('#composer').hidden=!!session.ended;$('#end').hidden=!!session.ended;$('#new').hidden=!session.ended;$('#review').hidden=!session.ended;
 if(session.ended)review();paintTree();storageNote();
}
function review(){const root=$('#review-list');root.replaceChildren();let num=0;session.messages.filter(m=>m.role==='model').forEach(m=>{num++;const block=el('article',undefined,'review-card');block.append(el('h3',`Turno ${num}${m.caught?' · Detectado':''}`));(m.traps||[]).forEach(t=>{const f=FALLACIES.find(f=>f.id===t.id);block.append(el('strong',f?.name||'Trampa'),el('blockquote',t.quote),el('p',t.why));});root.append(block);});if(!num)root.append(el('p','No se llegó a generar ningún turno. No hay trampas que revisar.'));}
function setMode(value){mode=value;$('#name-wrap').hidden=value!=='accuse';$('#fallacy-name').required=value==='accuse';$('#debate-mode').setAttribute('aria-pressed',String(value==='debate'));$('#accuse-mode').setAttribute('aria-pressed',String(value==='accuse'));$('#reply-label').textContent=value==='accuse'?'Explica dónde falla el razonamiento':'Tu respuesta';$('#reply').placeholder=value==='accuse'?'Cita la idea y explica por qué la conclusión no se sigue de las razones…':'Responde al argumento o explica una trampa que hayas detectado…';}
function setExercise(value){
 $('#panel-debate').hidden=value!=='debate';$('#panel-detect').hidden=value!=='detect';$('#panel-simulate').hidden=value!=='simulate';
 $('#tab-debate').setAttribute('aria-pressed',String(value==='debate'));$('#tab-detect').setAttribute('aria-pressed',String(value==='detect'));$('#tab-simulate').setAttribute('aria-pressed',String(value==='simulate'));
}
function setBusy(value,activity){
 busy=value;['start','send','detect-go','sim-go','end','export','erase','restart','profile-open','debate-mode','accuse-mode','tab-debate','tab-detect','tab-simulate','modes-open','resume-debate'].forEach(id=>{const n=document.getElementById(id);if(n)n.disabled=value;});
 $('#reply').disabled=value;$('#fallacy-name').disabled=value;$('#detect-text').disabled=value;$('#sim-topic').disabled=value;$('#sim-stance').disabled=value;$('#sim-fallacy').disabled=value;
 $('#cancel').hidden=!value;$('#detect-cancel').hidden=!value;$('#sim-cancel').hidden=!value;
 $('#send').textContent=value?'Pensando…':'Enviar';$('#detect-go').textContent=value?'Analizando…':'Analizar texto';$('#sim-go').textContent=value?'Escribiendo…':'Generar simulación';
 $('#status').textContent=value?(activity||'La IA gratuita puede tardar hasta 120 segundos…'):'';
}
async function run(label,work){
 if(busy)return;
 $('#error').hidden=true;setBusy(true,label);controller=new AbortController();let timeout=false;
 const timer=setTimeout(()=>{timeout=true;controller?.abort();},120000);
 try{await work(controller.signal);}
 catch(e){$('#error').hidden=false;$('#error').textContent=e.name==='AbortError'?(timeout?'La IA no respondió en 120 segundos. No se ha añadido ni mostrado nada. Tu texto se conserva; puedes volver a intentarlo más tarde.':'Petición cancelada. La solicitud ya podría haber consumido cuota gratuita.'):e.message;}
 finally{clearTimeout(timer);controller=null;setBusy(false);}
}
async function turn(input,name=''){
 if(busy||!session||session.ended)return;
 if(session.messages.length>=90){$('#error').hidden=false;$('#error').textContent='Esta sesión ha llegado a su límite. Ciérrala y descarga la revisión antes de empezar otra.';return;}
 const active=session;
 await run('Preparando un argumento. La IA gratuita puede tardar hasta 120 segundos…',async signal=>{
  const result=await requestTurn(active,input,mode,name,signal);
  if(session!==active)return;
  const previous=[...active.messages].reverse().find(m=>m.role==='model');
  active.messages.push({role:'user',text:result.user});
  const adequateExplanation=mode!=='accuse'||(input.trim().length>=8&&input.trim().split(/\s+/).length>=2);
  if(result.assessment&&adequateExplanation&&previous&&!previous.caught){previous.caught=true;const f=FALLACIES.find(f=>f.id===result.assessment.id);active.messages.push({role:'point',text:`[¡Punto para ti!] ${f.name}. ${result.assessment.why}`,evidence:result.assessment});const prof=activeProfile();if(prof){prof.stats.points++;saveProfiles();}}
  active.messages.push({role:'model',text:result.reply,traps:result.traps,graph:result.graph,caught:false});save();paint();$('#reply').value='';$('#fallacy-name').value='';setMode('debate');$('#composer').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
}
function paintDetect(){
 const root=$('#detect-results');root.replaceChildren();
 if(!detectResult){root.hidden=true;return;}
 root.hidden=false;
 const head=el('article',undefined,'review-card');head.append(el('h3','Análisis del texto'),el('p',detectResult.summary));root.append(head);
 if(!detectResult.findings.length)root.append(el('p','No se han encontrado falacias ni razonamientos erróneos claros. Esto tampoco es una garantía: la revisión es automática y puede omitir fallos.','privacy'));
 detectResult.findings.forEach(f=>{
  const card=el('article',undefined,'review-card');
  card.append(el('h3',f.name));
  if(!f.catalog)card.append(el('span','Fuera del catálogo de las 22','badge'));
  card.append(el('blockquote',f.quote),el('p',f.why));root.append(card);
 });
 (detectResult.rejected||[]).forEach(f=>{const card=el('article',undefined,'review-card rejected');card.append(el('h3','Descartado en la revisión: '+f.name),el('blockquote',f.quote),el('p','La segunda lectura automática no confirmó este hallazgo'+(f.reviewNote?': '+f.reviewNote:'.')));root.append(card);});
 const notes=[];
 if(detectResult.overflow)notes.push(`Se limitaron ${detectResult.overflow} hallazgos adicionales para no gastar más cuota gratuita.`);
 if(detectResult.dropped)notes.push(`Se descartaron ${detectResult.dropped} menciones sin cita literal verificable dentro del texto.`);
 notes.push('Análisis generado por IA: puede equivocarse, omitir fallos o señalar algo legítimo. Las citas son literales; compruébalas antes de usarlas. Este resultado no se guarda.');
 root.append(el('p',notes.join(' '),'privacy'));
}
function paintSim(){
 const root=$('#simulate-results');root.replaceChildren();
 if(!simResult){root.hidden=true;return;}
 root.hidden=false;
 const card=el('article',undefined,'sim-card');
 card.append(el('div','SIMULACIÓN · Este texto contiene una falacia escrita a propósito. No es información fiable ni debe presentarse como real.','sim-warning'));
 card.append(el('p',simResult.reply,'sim-text'));
 const f=FALLACIES.find(x=>x.id===simResult.traps[0].id);
 const reveal=el('details',undefined,'tree-notes');reveal.append(el('summary','Revelar la trampa y el mapa del argumento'));
 reveal.append(el('h3',f?.name||'Trampa'),el('blockquote',simResult.traps[0].quote),el('p',simResult.traps[0].why));
 (simResult.graph?.nodes||[]).forEach(n=>{
  const d=el('details',undefined,'tree-node '+n.kind);const summary=el('summary');summary.append(el('span',n.kind==='conclusion'?'Conclusión':n.kind==='premisa'?'Premisa':'Afirmación','node-kind'),el('span',n.quote,'node-quote'),el('span',n.status==='supuesto'?'Supuesto':'No verificado','node-status'));d.append(summary,el('p',n.comment));
  (simResult.graph.edges||[]).filter(e=>e.to===n.id).forEach(e=>{const from=simResult.graph.nodes.find(p=>p.id===e.from);const connection=el('div',undefined,'tree-edge');connection.append(el('strong','↑ Se apoya en: '),el('span',from.quote),el('p',e.comment));d.append(connection);});reveal.append(d);
 });
 card.append(reveal);
 card.append(el('p','Texto y análisis generados por IA y revisados por un control automático del mismo modelo: puede equivocarse. Este resultado no se guarda.','privacy'));
 root.append(card);
}
$('#start-form').addEventListener('submit',e=>{e.preventDefault();const topic=$('#topic').value.trim();if(!topic)return;if(session&&!confirm('Ya hay un debate guardado y se sustituirá. Descárgalo primero si quieres conservarlo. ¿Empezar otro?'))return;session={topic,difficulty:document.querySelector('[name=difficulty]:checked').value,messages:[],ended:false,createdAt:new Date().toISOString()};viewingModes=false;save();paint();$('#reply').value=`Quiero debatir sobre: ${topic}`;void turn($('#reply').value);});
$('#detect-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#detect-text').value.trim();if(text.length<40||text.split(/\s+/).length<8){$('#error').hidden=false;$('#error').textContent='Pega un texto algo más largo: hace falta un razonamiento que examinar.';return;}void run('Analizando el texto y revisando cada hallazgo. La IA gratuita puede tardar hasta 120 segundos…',async signal=>{detectResult=await detectFallacies(text,signal);paintDetect();$('#detect-results').scrollIntoView({behavior:'smooth',block:'nearest'});});});
$('#simulate-form').addEventListener('submit',e=>{e.preventDefault();const topic=$('#sim-topic').value.trim();if(topic.length<8){$('#error').hidden=false;$('#error').textContent='Describe un tema algo más concreto para la simulación.';return;}const stance=$('#sim-stance').value.trim();const chosen=$('#sim-fallacy').value;const target=chosen||FALLACIES[Math.floor(Math.random()*FALLACIES.length)].id;const difficulty=document.querySelector('[name=sim-difficulty]:checked').value;void run('Escribiendo el argumento con trampa y revisándolo. La IA gratuita puede tardar hasta 120 segundos…',async signal=>{simResult=await simulateArgument(topic,stance,difficulty,target,signal);paintSim();$('#simulate-results').scrollIntoView({behavior:'smooth',block:'nearest'});});});
$('#reply-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#reply').value.trim();const name=$('#fallacy-name').value.trim();if(!input)return;if(mode==='accuse'&&(name.length<3||input.length<8||input.split(/\s+/).length<2)){$('#error').hidden=false;$('#error').textContent='Nombra o describe la trampa y explica el fallo con tus propias palabras. El nombre por sí solo no basta.';return;}void turn(input,name);});
$('#cancel').addEventListener('click',()=>controller?.abort());
$('#detect-cancel').addEventListener('click',()=>controller?.abort());
$('#sim-cancel').addEventListener('click',()=>controller?.abort());
$('#debate-mode').addEventListener('click',()=>setMode('debate'));$('#accuse-mode').addEventListener('click',()=>setMode('accuse'));
$('#tab-debate').addEventListener('click',()=>setExercise('debate'));$('#tab-detect').addEventListener('click',()=>setExercise('detect'));$('#tab-simulate').addEventListener('click',()=>setExercise('simulate'));
$('#modes-open').addEventListener('click',()=>{if(busy)return;viewingModes=true;paint();$('#setup').scrollIntoView({behavior:'smooth',block:'start'});});
$('#resume-debate').addEventListener('click',()=>{viewingModes=false;paint();});
$('#end').addEventListener('click',()=>{if(busy||!session)return;if(!confirm('Esto termina el ejercicio y revela las trampas previstas. ¿Cerrar y revisar?'))return;session.ended=true;{const prof=activeProfile();if(prof){prof.stats.debates++;saveProfiles();}}session.treeUntil=session.messages.filter(m=>m.role==='model').length;$('#error').hidden=true;save();paint();$('#review').scrollIntoView({behavior:'smooth',block:'start'});});
$('#new').addEventListener('click',()=>{if(!confirm('La sesión guardada se sustituirá. Descárgala primero si quieres conservarla. ¿Empezar otra?'))return;session=null;viewingModes=false;save();paint();$('#error').hidden=true;$('#topic').focus();});
function download(){if(!session)return;let text=`# Contraluz\n\nTema: ${session.topic}\nNivel: ${session.difficulty}\nFecha: ${session.createdAt}\nEstado: ${session.ended?'Cerrada':'En curso, soluciones ocultas'}\n\n`;session.messages.forEach(m=>{text+=`## ${m.role==='user'?'Tú':m.role==='point'?'Fuera de personaje':'Interlocutor'}\n\n${m.text}\n\n`;if(session.ended)(m.traps||[]).forEach(t=>{text+=`Trampa: ${FALLACIES.find(f=>f.id===t.id)?.name||t.id}\n> ${t.quote}\n\n${t.why}\n\n`;});});if(session.ended||session.treeUntil){text+='## Mapa lógico revisado\n\n';session.messages.filter(m=>m.role==='model').slice(0,session.ended?undefined:session.treeUntil).forEach((m,i)=>{text+=`### Turno ${i+1}\n\n`;if(!m.graph){text+='Análisis no disponible.\n\n';return;}m.graph.nodes.forEach(n=>{text+=`- ${n.id} (${n.kind}, ${n.status}): ${n.quote}\n  ${n.comment}\n`;});m.graph.edges.forEach(e=>{text+=`- ${e.from} → ${e.to}: ${e.comment}\n`;});text+='\n';});}text+='\nLa evaluación es generada por IA y puede equivocarse.\n';const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=el('a');a.href=url;a.download='contraluz-debate.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('#export').addEventListener('click',download);
function paintProfile(){
 const p=activeProfile();
 $('#profile-active').hidden=!p;$('#profile-entry').hidden=!!p;
 if(p){
  $('#profile-who').textContent='Registro activo: '+p.name+(p.email?' · '+p.email:'');
  $('#profile-stats').textContent='Debates cerrados: '+p.stats.debates+' · Puntos: '+p.stats.points+'. Guardado solo en este navegador.';
  $('#profile-restart').disabled=!session;
  $('#profile-clear').disabled=!session&&!p.stats.debates&&!p.stats.points;
 }else{
  const root=$('#profile-list');root.replaceChildren();
  profiles.forEach(x=>{
   const wrap=el('div',undefined,'profile-row');
   const b=el('button','Entrar como '+x.name,'profile-pick');b.type='button';
   b.addEventListener('click',()=>{activeId=x.id;saveProfiles();loadSession();viewingModes=false;save();paint();paintProfile();$('#error').hidden=true;$('#status').textContent='Sesión iniciada como '+x.name+'.';});
   wrap.append(b,el('span',x.stats.debates+' debates · '+x.stats.points+' puntos'+(x.email?' · '+x.email:''),'profile-meta'));
   root.append(wrap);
  });
  if(profiles.length)root.append(el('p','Los registros anteriores ya están en este navegador. Entrar con uno recupera su debate guardado.','privacy'));
 }
}
function restartSession(){
 if(busy)return;
 if(!session){$('#status').textContent='No hay ningún debate guardado que reiniciar.';return;}
 if(!confirm('Se descartará el debate actual y empezarás de cero'+(activeProfile()?' con el mismo registro':'')+'. Descárgalo primero si quieres conservarlo. ¿Reiniciar la sesión?'))return;
 session=null;viewingModes=false;save();paint();$('#error').hidden=true;$('#topic').value='';$('#status').textContent='Sesión reiniciada. Elige un nuevo ejercicio.';
}
$('#restart').addEventListener('click',restartSession);
$('#profile-restart').addEventListener('click',()=>{restartSession();paintProfile();});
$('#profile-open').addEventListener('click',()=>{if(busy)return;paintProfile();$('#profile').showModal();});
$('#profile-close').addEventListener('click',()=>$('#profile').close());
$('#profile-form').addEventListener('submit',e=>{
 e.preventDefault();if(busy)return;
 const name=$('#profile-name').value.trim();
 const email=$('#profile-email').value.trim();
 if(name.length<2){$('#error').hidden=false;$('#error').textContent='El registro necesita un nombre o alias de al menos dos letras.';return;}
 if(profiles.some(x=>x.name.toLowerCase()===name.toLowerCase())){$('#error').hidden=false;$('#error').textContent='Ya existe un registro con ese nombre en este navegador. Entra con él o elige otro nombre.';return;}
 const p={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),name,email,createdAt:new Date().toISOString(),stats:{debates:0,points:0}};
 profiles.push(p);activeId=p.id;saveProfiles();loadSession();viewingModes=false;save();paint();paintProfile();
 $('#profile-name').value='';$('#profile-email').value='';$('#error').hidden=true;$('#status').textContent='Registro creado. Sesión iniciada como '+name+'.';
});
$('#profile-signout').addEventListener('click',()=>{
 if(busy)return;activeId='';saveProfiles();loadSession();viewingModes=false;save();paint();paintProfile();$('#error').hidden=true;$('#status').textContent='Has cerrado la sesión del registro. Juegas como invitado.';
});
$('#profile-clear').addEventListener('click',()=>{
 const p=activeProfile();if(busy||!p)return;
 if(!confirm('Se borrará el debate guardado y la actividad acumulada de «'+p.name+'», pero se conservará el registro'+(p.email?' (nombre y correo)':' (nombre)')+'. ¿Continuar?'))return;
 session=null;p.stats={debates:0,points:0};saveProfiles();save();viewingModes=false;paint();paintProfile();$('#error').hidden=true;$('#topic').value='';$('#status').textContent='Se ha borrado la actividad de '+p.name+'. El registro se conserva.';
});
$('#profile-delete').addEventListener('click',()=>{
 const p=activeProfile();if(busy||!p)return;
 if(!confirm('Se eliminará el registro de «'+p.name+'» y toda su actividad guardada en este navegador. ¿Eliminarlo?'))return;
 profiles=profiles.filter(x=>x.id!==p.id);activeId='';saveProfiles();
 try{localStorage.removeItem(KEY+'.'+p.id);}catch{}
 session=null;viewingModes=false;paint();paintProfile();$('#error').hidden=true;$('#status').textContent='Registro eliminado. Juegas como invitado.';
});
$('#erase').addEventListener('click',()=>{if(busy||!confirm('¿Borrar de este navegador la sesión guardada, la puntuación y todos los registros? Esta acción no borra datos que haya recibido el proveedor de IA.'))return;const ids=profiles.map(p=>p.id);profiles=[];activeId='';saveProfiles();try{ids.forEach(id=>localStorage.removeItem(KEY+'.'+id));}catch{}session=null;save();paint();$('#error').hidden=true;$('#topic').value='';$('#reply').value='';$('#status').textContent='Se han borrado los datos locales, incluidos los registros.';});
$('#guide-open').addEventListener('click',()=>$('#guide').showModal());$('#guide-close').addEventListener('click',()=>$('#guide').close());
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{$('#topic').value=b.dataset.topic;$('#topic').focus();}));
function catalog(query=''){const root=$('#catalog');root.replaceChildren();const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const fs=FALLACIES.filter(f=>norm(f.name+' '+f.definition).includes(norm(query)));fs.forEach(f=>{const card=el('article',undefined,'definition');card.append(el('h3',f.name),el('p',f.definition));const a=el('a','Fuente');a.href=SOURCES[f.source][1];a.target='_blank';a.rel='noopener noreferrer';card.append(a);root.append(card);});if(!fs.length)root.append(el('p','No hay coincidencias. Prueba con otra palabra.'));}
$('#catalog-search').addEventListener('input',e=>catalog(e.target.value));SOURCES.forEach(([name,url])=>{const li=el('li'),a=el('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('#sources').append(li);});
FALLACIES.forEach(f=>{const o=el('option',f.name);o.value=f.id;$('#sim-fallacy').append(o);});
paint();catalog();setExercise('debate');

function paintTree(){
 const count=session?.treeUntil||0;$('#tree').hidden=!count;
 if(!count)return;
 const turns=session.messages.filter(m=>m.role==='model').slice(0,count);
 $('#tree-count').textContent=`Mostrando ${turns.length} turnos revisados. Los argumentos posteriores no se revelan sin que abras otra vez el árbol.`;
 const root=$('#tree-list');root.replaceChildren();
 turns.forEach((m,i)=>{
  const section=el('section',undefined,'tree-turn');section.append(el('h3',`Turno ${i+1}`));
  if(!m.graph){section.append(el('p','Análisis no disponible para este turno. No se ha reconstruido un árbol sin evidencia.'));root.append(section);return;}
  const graph=m.graph;
  graph.nodes.forEach(n=>{
   const d=el('details',undefined,'tree-node '+n.kind);const summary=el('summary');summary.append(el('span',n.kind==='conclusion'?'Conclusión':n.kind==='premisa'?'Premisa':'Afirmación','node-kind'),el('span',n.quote,'node-quote'),el('span',n.status==='supuesto'?'Supuesto':'No verificado','node-status'));d.append(summary,el('p',n.comment));
   graph.edges.filter(e=>e.to===n.id).forEach(e=>{const from=graph.nodes.find(p=>p.id===e.from);const connection=el('div',undefined,'tree-edge');connection.append(el('strong','↑ Se apoya en: '),el('span',from.quote),el('p',e.comment));d.append(connection);});section.append(d);
  });
  const notes=el('details',undefined,'tree-notes');notes.append(el('summary','Falacias y saltos de este turno'));(m.traps||[]).forEach(t=>{notes.append(el('h3',FALLACIES.find(f=>f.id===t.id)?.name||t.id),el('blockquote',t.quote),el('p',t.why));});section.append(notes);root.append(section);
 });
}
$('#tree-open').addEventListener('click',()=>{
 if(!session||busy)return;const count=session.messages.filter(m=>m.role==='model').length;
 if(!count){$('#status').textContent='Todavía no hay un argumento generado que analizar.';return;}
 if(!session.ended&&!confirm('El árbol revela las premisas, los saltos y las falacias de los turnos actuales. Puedes seguir jugando, pero ya conocerás sus trampas. ¿Abrirlo?'))return;
 session.treeUntil=count;save();paintTree();$('#tree').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#tree-close').addEventListener('click',()=>{$('#tree').hidden=true;});
