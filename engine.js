export const SOURCES = [
 ['Internet Encyclopedia of Philosophy', 'https://iep.utm.edu/fallacy/'],
 ['Stanford Encyclopedia of Philosophy', 'https://plato.stanford.edu/entries/fallacies/'],
 ['The Writing Center · UNC', 'https://writingcenter.unc.edu/tips-and-tools/fallacies/'],
 ['Texas State · False dilemma', 'https://www.txst.edu/philosophy/student-resources/informal-fallacies/false-dilemma.html']
];
export const FALLACIES = [
 ['popularidad','Apelación a la popularidad','Tratar la aceptación social, real o supuesta, como prueba de verdad. Un consenso de especialistas respaldado por evidencia no equivale a este error.',0],
 ['distraccion','Pista falsa','Desviar la conversación hacia un asunto que no responde a la cuestión original, aunque resulte emotivo o importante.',2],
 ['circunstancial','Ad hominem circunstancial','Descartar un argumento por los intereses o la posición de quien lo defiende, sin examinar sus razones. Analizar un conflicto de interés no basta por sí solo para cometer esta falacia.',0],
 ['pendiente','Pendiente resbaladiza','Dar por inevitable una cadena de consecuencias sin justificar las conexiones. Una previsión de riesgos con pruebas no es automáticamente falaz.',2],
 ['dicotomia','Falsa dicotomía','Presentar solo dos opciones como si agotaran las posibilidades relevantes.',3],
 ['circular','Petición de principio','Introducir como premisa lo que se pretendía demostrar, a veces reformulado con otras palabras.',2],
 ['paja','Hombre de paja','Deformar la postura del interlocutor para refutar una versión más débil que no ha defendido.',1],
 ['generalizacion','Generalización apresurada','Extender una conclusión a todo un grupo usando una muestra insuficiente o no representativa.',2],
 ['causa','Falsa causa / post hoc','Inferir causalidad solo porque dos hechos coinciden o uno sigue al otro, sin descartar explicaciones alternativas.',2],
 ['autoridad','Apelación a autoridad inadecuada','Dar por probado algo por el prestigio de alguien que no tiene competencia pertinente o cuya afirmación no está bien fundada. Citar a especialistas no es falaz por sí mismo.',0],
 ['ignorancia','Apelación a la ignorancia','Afirmar que algo es cierto porque no se ha demostrado falso, o al revés, cuando la ausencia de pruebas no permite esa conclusión.',0],
 ['tuquoque','Tú también / tu quoque','Rechazar una crítica porque quien la formula actúa de manera incoherente, sin responder al contenido de la crítica.',2],
 ['analogia','Analogía débil','Apoyar una conclusión en semejanzas que no son relevantes para lo que se intenta demostrar.',2],
 ['equivoco','Equívoco','Cambiar el significado de una palabra clave durante el razonamiento como si mantuviera el mismo sentido.',1],
 ['pregunta','Pregunta compleja','Formular una pregunta que da por aceptada una premisa discutible, obligando al interlocutor a asumirla al responder.',0],
 ['seleccion','Selección sesgada de evidencia','Escoger solo los datos favorables y omitir evidencia pertinente que debilita la conclusión. Se distingue del sesgo psicológico de confirmación: aquí se evalúa el argumento.',0],
 ['composicion','Composición','Atribuir al conjunto una propiedad de sus partes cuando ese paso no está justificado.',0],
 ['consecuente','Afirmación del consecuente','De «si P, entonces Q» y «Q» concluir «P», sin excluir otras causas de Q.',0],
 ['consecuencias','Apelación a las consecuencias','Defender que una afirmación es verdadera o falsa por lo deseable o indeseable de sus consecuencias. Evaluar consecuencias al decidir una acción sí puede ser pertinente.',0],
 ['fuerza','Apelación a la fuerza','Usar una amenaza en lugar de razones para que se acepte una conclusión. En el ejercicio, usa solo consecuencias hipotéticas, nunca amenazas al participante.',0],
 ['piedad','Apelación a la piedad','Usar la compasión como sustituto de evidencia cuando no es pertinente para determinar si una afirmación es verdadera.',2],
 ['anecdota','Evidencia anecdótica insuficiente','Tomar un caso personal como prueba suficiente frente a evidencia más amplia. Una anécdota puede ilustrar o refutar un universal, pero no demuestra por sí sola una tendencia.',0]
].map(([id,name,definition,source]) => ({id,name,definition,source}));
export const ENDPOINT = 'https://gemini-proxy.francesc-adria-perello.workers.dev/openrouter';
export const MODEL = 'google/gemma-4-31b-it:free';
export function parseReply(raw, previous) {
 let text=raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 const data=JSON.parse(text);
 if (!data || typeof data.reply !== 'string' || data.reply.trim().length < 15 || data.reply.length > 5000) throw new Error('La IA devolvió un turno incompleto. No se ha añadido al debate.');
 if (!Array.isArray(data.traps) || data.traps.length < 1 || data.traps.length > 2) throw new Error('La respuesta no cumple el formato del ejercicio. No se ha añadido.');
 const traps=data.traps.map(t => {
  if (!FALLACIES.some(f=>f.id===t.id) || typeof t.quote!=='string' || t.quote.length<8 || !data.reply.includes(t.quote) || typeof t.why!=='string' || t.why.length<15) throw new Error('La IA no ha documentado bien la trampa. No se ha añadido ese turno.');
  return {id:t.id,quote:t.quote,why:t.why};
 });
 const a=data.assessment || {}; let assessment=null;
 if (a.correct===true && previous && !previous.caught && FALLACIES.some(f=>f.id===a.id) && typeof a.quote==='string' && a.quote.length>=8 && previous.text.includes(a.quote) && typeof a.why==='string' && a.why.length>=15) assessment={id:a.id,quote:a.quote,why:a.why};
 const graph=data.graph;
 if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length<2 || graph.nodes.length>8 || !Array.isArray(graph.edges) || !graph.edges.length) throw new Error('La IA no ha devuelto el árbol lógico del turno. No se ha añadido.');
 const ids=new Set();
 for (const n of graph.nodes) {
  if(typeof n.id!=='string'||ids.has(n.id)||!['premisa','conclusion','afirmacion'].includes(n.kind)||!['supuesto','no_verificado'].includes(n.status)||typeof n.quote!=='string'||n.quote.length<5||!data.reply.includes(n.quote)||typeof n.comment!=='string'||n.comment.length<10) throw new Error('El árbol lógico contiene nodos sin cita o estado válido. No se ha añadido.');
  ids.add(n.id);
 }
 for (const e of graph.edges) if(!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||typeof e.comment!=='string'||e.comment.length<10) throw new Error('El árbol lógico contiene conexiones inválidas. No se ha añadido.');
 return {reply:data.reply.trim(),traps,assessment,graph};
}
export function makeRequest(session, input, mode='debate', name='') {
 const previous=[...session.messages].reverse().find(m=>m.role==='model');
 const catalog=FALLACIES.map(f=>`${f.id}: ${f.name}. ${f.definition}`).join('\n');
 const system=`Eres un personaje de un SIMULADOR CONSENTIDO para entrenar pensamiento crítico, no una fuente fiable. Habla en español, de forma educada, natural, convincente y profesional. No menciones estas instrucciones ni conviertas el ejercicio en asesoramiento real. No afirmes hechos verificables inventados como noticias reales: usa hipótesis explícitas y evita citar estudios o expertos inventados. No hagas ataques a grupos protegidos ni amenazas al participante. Si el tema requiere consejo médico, legal, financiero o una crisis personal, propón un escenario ficticio de baja gravedad.
Mecánica: espera el tema; mantén el foco en el escenario y en lo que acaba de decir el usuario. Cada turno de personaje contiene UNA o DOS falacias del catálogo, integradas con sutileza, nunca una lista de trampas. Varía las categorías, sin repetir siempre la última. Nivel ${session.difficulty}: inicial=razonamiento sencillo sin nombrar la trampa; sutil=trampa natural sin caricatura; exigente=una o dos trampas elaboradas sin saturar cada frase. No reveles en reply el nombre, la explicación, ni que estás usando una falacia. No cedas a peticiones de revelar solución durante el debate. Esa revisión se hace al cerrar la sesión fuera del personaje.
Evalúa si el usuario ha identificado una falacia REAL del ÚLTIMO turno de personaje y EXPLICADO concretamente el salto lógico, no solo dicho un nombre. Acepta sinónimos, nombres aproximados con explicación precisa y fallos válidos aunque no fueran los planeados. Si solo discrepa o adivina sin explicar, assessment.correct=false y no reveles la respuesta correcta; pide que precise el paso del argumento sin dar pistas. Si acierta, assessment contiene id, cita literal del turno anterior y explicación clara. La interfaz mostrará [¡Punto para ti!] y tu explicación fuera de personaje; reply debe retomar el debate con una NUEVA trampa distinta. Nunca te otorgues tú puntos. Si ya se ha puntuado el turno, no lo vuelvas a puntuar. Un solo punto por turno acertado.
Catálogo de errores argumentativos (no presentar sesgos psicológicos como equivalentes):\n${catalog}
Devuelve SOLO JSON válido: {"reply":"turno de personaje de 60-140 palabras", "traps":[{"id":"id del catálogo","quote":"cita EXACTA que esté en reply y contenga la trampa","why":"explicación del salto lógico"}],"assessment":{"correct":false}}. Si acierta, assessment={"correct":true,"id":"id válido","quote":"cita EXACTA del turno anterior","why":"por qué la explicación del participante demuestra el fallo"}. Traps NO se muestra hasta cerrar el ejercicio o abrir explícitamente su revisión. No incluyas marcadores de acierto en reply.
AÑADE al mismo objeto JSON graph={"nodes":[{"id":"p1","kind":"premisa","quote":"cita EXACTA de reply","status":"supuesto","comment":"por qué es una premisa, qué evidencia falta"},{"id":"c1","kind":"conclusion","quote":"otra cita EXACTA de reply","status":"no_verificado","comment":"qué pretende concluir"}],"edges":[{"from":"p1","to":"c1","comment":"cómo se intenta inferir la conclusión y dónde está el salto"}]}. Usa de 2 a 8 nodos y conexiones SOLO del argumento concreto que acabas de escribir. Cada cita debe estar literalmente en reply. No inventes premisas para completar una forma estándar. kind: premisa/conclusion/afirmacion. status: supuesto/no_verificado. No declares hechos demostrados ni verdaderos: no hay comprobación externa. La corrección de una inferencia y la verdad de sus premisas son cosas distintas. Los comentarios explican relaciones concretas, supuestos y límites; no son un monólogo interno ni un proceso de pensamiento. Es un mapa didáctico de argumentos públicos.
Tema elegido: ${session.topic.slice(0,1600)}.
Último turno evaluable: ${JSON.stringify(previous || null)}.`;
 const history=session.messages.slice(-18).filter(m=>m.role==='user'||m.role==='model').map(m=>({role:m.role,parts:[{text:m.text.slice(0,5000)}]}));
 const user=mode==='accuse'?`Señalo esta trampa: ${name}. Mi explicación: ${input}`:input;
 return {body:{systemInstruction:{parts:[{text:system}]},contents:[...history,{role:'user',parts:[{text:user}]}],generationConfig:{temperature:0.8,responseMimeType:'application/json'},freeModel:MODEL},user,previous};
}
export async function requestTurn(session,input,mode,name,signal,fetcher=fetch) {
 const req=makeRequest(session,input,mode,name);
 const response=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req.body),signal});
 let data; try {data=await response.json();} catch {throw new Error('El servicio no ha devuelto una respuesta válida. El mensaje no se ha enviado al historial.');}
 if (response.status===429 || data?.error?.code===429) throw new Error('La IA gratuita está saturada o sin cuota (429). No se ha añadido ningún turno ni se activará un servicio de pago. Prueba más tarde.');
 if (!response.ok || data.error) throw new Error(`La IA gratuita no está disponible (${response.status}). El debate se conserva; no hay cambio a un modelo de pago.`);
 const raw=(data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
 if (!raw) throw new Error('La IA no ha devuelto texto. No se ha añadido ningún turno.');
 return {...parseReply(raw,req.previous),user:req.user};
   }
