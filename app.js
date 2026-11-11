import {FALLACIES,SOURCES,requestTurn} from './engine.js';
const $=s=>document.querySelector(s);
const KEY='contraluz.session.v1';
let session=null,mode='debate',busy=false,controller=null,storageOK=true;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function save(){try{if(session)localStorage.setItem(KEY,JSON.stringify(session));else localStorage.removeItem(KEY);}catch{storageOK=false;} storageNote();}
function storageNote(){$('#storage').textContent=storageOK?'Historial local en este navegador. No se sincroniza. Puedes descargarlo o borrarlo.':'No se ha podido guardar el historial en este navegador. Descarga la conversación para conservarla.';}
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.topic==='string'&&Array.isArray(s.messages)&&s.messages.length<=100&&s.messages.every(m=>['user','model','point'].includes(m.role)&&typeof m.text==='string'))session=s;}catch{storageOK=false;}
function paint(){
 $('.intro').hidden=!!session;$('#setup').hidden=!!session;$('#arena').hidden=!session;
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
function setBusy(value){busy=value;$('#start').disabled=value;$('#send').disabled=value;$('#reply').disabled=value;$('#fallacy-name').disabled=value;$('#end').disabled=value;$('#export').disabled=value;$('#erase').disabled=value;$('#debate-mode').disabled=value;$('#accuse-mode').disabled=value;$('#cancel').hidden=!value;$('#send').textContent=value?'Pensando…':'Enviar';$('#status').textContent=value?'Preparando un argumento. La IA gratuita puede tardar hasta 60 segundos…':'';}
async function turn(input,name=''){
 if(busy||!session||session.ended)return;
 if(session.messages.length>=90){$('#error').hidden=false;$('#error').textContent='Esta sesión ha llegado a su límite. Ciérrala y descarga la revisión antes de empezar otra.';return;}
 $('#error').hidden=true;setBusy(true);controller=new AbortController();const active=session;let timeout=false;
 const timer=setTimeout(()=>{timeout=true;controller?.abort();},60000);
 try{
  const result=await requestTurn(active,input,mode,name,controller.signal);
  if(session!==active)return;
  const previous=[...active.messages].reverse().find(m=>m.role==='model');
  active.messages.push({role:'user',text:result.user});
  const adequateExplanation=mode!=='accuse'||(input.trim().length>=8&&input.trim().split(/\s+/).length>=2);
  if(result.assessment&&adequateExplanation&&previous&&!previous.caught){previous.caught=true;const f=FALLACIES.find(f=>f.id===result.assessment.id);active.messages.push({role:'point',text:`[¡Punto para ti!] ${f.name}. ${result.assessment.why}`,evidence:result.assessment});}
  active.messages.push({role:'model',text:result.reply,traps:result.traps,graph:result.graph,caught:false});save();paint();$('#reply').value='';$('#fallacy-name').value='';setMode('debate');$('#composer').scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(e){$('#error').hidden=false;$('#error').textContent=e.name==='AbortError'?(timeout?'La IA no respondió en 60 segundos. No se ha añadido ningún turno. Tu texto se conserva; puedes volver a intentarlo más tarde.':'Petición cancelada. No se ha añadido ningún turno. La solicitud ya podría haber consumido cuota gratuita.'):e.message;}
 finally{clearTimeout(timer);controller=null;setBusy(false);}
}
$('#start-form').addEventListener('submit',e=>{e.preventDefault();const topic=$('#topic').value.trim();if(!topic)return;session={topic,difficulty:document.querySelector('[name=difficulty]:checked').value,messages:[],ended:false,createdAt:new Date().toISOString()};save();paint();$('#reply').value=`Quiero debatir sobre: ${topic}`;void turn($('#reply').value);});
$('#reply-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#reply').value.trim();const name=$('#fallacy-name').value.trim();if(!input)return;if(mode==='accuse'&&(name.length<3||input.length<8||input.split(/\s+/).length<2)){$('#error').hidden=false;$('#error').textContent='Nombra o describe la trampa y explica el fallo con tus propias palabras. El nombre por sí solo no basta.';return;}void turn(input,name);});
$('#cancel').addEventListener('click',()=>controller?.abort());
$('#debate-mode').addEventListener('click',()=>setMode('debate'));$('#accuse-mode').addEventListener('click',()=>setMode('accuse'));
$('#end').addEventListener('click',()=>{if(busy||!session)return;if(!confirm('Esto termina el ejercicio y revela las trampas previstas. ¿Cerrar y revisar?'))return;session.ended=true;session.treeUntil=session.messages.filter(m=>m.role==='model').length;$('#error').hidden=true;save();paint();$('#review').scrollIntoView({behavior:'smooth',block:'start'});});
$('#new').addEventListener('click',()=>{if(!confirm('La sesión guardada se sustituirá. Descárgala primero si quieres conservarla. ¿Empezar otra?'))return;session=null;save();paint();$('#error').hidden=true;$('#topic').focus();});
function download(){if(!session)return;let text=`# Contraluz\n\nTema: ${session.topic}\nNivel: ${session.difficulty}\nFecha: ${session.createdAt}\nEstado: ${session.ended?'Cerrada':'En curso, soluciones ocultas'}\n\n`;session.messages.forEach(m=>{text+=`## ${m.role==='user'?'Tú':m.role==='point'?'Fuera de personaje':'Interlocutor'}\n\n${m.text}\n\n`;if(session.ended)(m.traps||[]).forEach(t=>{text+=`Trampa: ${FALLACIES.find(f=>f.id===t.id)?.name||t.id}\n> ${t.quote}\n\n${t.why}\n\n`;});});if(session.ended||session.treeUntil){text+='## Mapa lógico revisado\n\n';session.messages.filter(m=>m.role==='model').slice(0,session.ended?undefined:session.treeUntil).forEach((m,i)=>{text+=`### Turno ${i+1}\n\n`;if(!m.graph){text+='Análisis no disponible.\n\n';return;}m.graph.nodes.forEach(n=>{text+=`- ${n.id} (${n.kind}, ${n.status}): ${n.quote}\n  ${n.comment}\n`;});m.graph.edges.forEach(e=>{text+=`- ${e.from} → ${e.to}: ${e.comment}\n`;});text+='\n';});}text+='\nLa evaluación es generada por IA y puede equivocarse.\n';const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=el('a');a.href=url;a.download='contraluz-debate.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('#export').addEventListener('click',download);
$('#erase').addEventListener('click',()=>{if(busy||!confirm('¿Borrar de este navegador la sesión guardada y su puntuación? Esta acción no borra datos que haya recibido el proveedor de IA.'))return;session=null;save();paint();$('#error').hidden=true;$('#topic').value='';$('#reply').value='';$('#status').textContent='Se han borrado los datos locales.';});
$('#guide-open').addEventListener('click',()=>$('#guide').showModal());$('#guide-close').addEventListener('click',()=>$('#guide').close());
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{$('#topic').value=b.dataset.topic;$('#topic').focus();}));
function catalog(query=''){const root=$('#catalog');root.replaceChildren();const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const fs=FALLACIES.filter(f=>norm(f.name+' '+f.definition).includes(norm(query)));fs.forEach(f=>{const card=el('article',undefined,'definition');card.append(el('h3',f.name),el('p',f.definition));const a=el('a','Fuente');a.href=SOURCES[f.source][1];a.target='_blank';a.rel='noopener noreferrer';card.append(a);root.append(card);});if(!fs.length)root.append(el('p','No hay coincidencias. Prueba con otra palabra.'));}
$('#catalog-search').addEventListener('input',e=>catalog(e.target.value));SOURCES.forEach(([name,url])=>{const li=el('li'),a=el('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('#sources').append(li);});
paint();catalog();

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
