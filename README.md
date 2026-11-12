# Contraluz

Simulador consentido de debate para entrenar el pensamiento crítico. Interfaz en español, identidad ámbar, sin registro adicional ni claves en el navegador.

## Estado de verificación · 12 de noviembre de 2026

Ampliación con dos modos nuevos junto al debate:

- **Detectar en un texto**: pega cualquier texto y la aplicación señala directamente cada falacia o razonamiento erróneo con nombre, cita literal y explicación. Cada hallazgo pasa una segunda revisión automática (operación `audit`) y las citas que no son literales se descartan antes de mostrarlas. Un texto sin argumentos defectuosos devuelve «sin fallos claros». Prueba real superada: texto con apelación a la popularidad y evidencia anecdótica (hallazgos señalados con cita literal), texto neutro de horarios (cero hallazgos; el falso positivo de la primera pasada quedó descartado por la revisión).
- **Simular un argumento**: ejercicio inverso. Genera a petición un razonamiento erróneo con apariencia de verdad coherente sobre el tema elegido (postura y falacia opcionales, 22 categorías, tres dificultades). El resultado se muestra siempre con la etiqueta visible «SIMULACIÓN · Este texto contiene una falacia escrita a propósito» y la trampa solo se revela al abrirla, con cita, explicación y mapa. El control didáctico (`audit`) valida el texto antes de mostrarlo; si lo rechaza, no se muestra ni se repite automáticamente.
- El servicio de IA incorpora la operación `detect` (versión 3). Debate intacto: regresión real superada (primer turno, sesión conservada, cambio entre modos). Interfaz comprobada a 390 px sin desbordamiento. Los análisis y simulaciones no se guardan en el navegador; solo el debate conserva historial local.
- Límites conocidos: la detección usa el mismo modelo pequeño y puede omitir fallos o, incluso tras la segunda revisión, señalar algo legítimo; la interfaz muestra los hallazgos descartados para que la decisión final sea del usuario.

## Estado de verificación · 11 de noviembre de 2026

Prueba real acotada superada con Cloudflare Workers AI y el modelo fijo GLM 4.7 Flash: primer argumento, detección explicada, punto, nuevo argumento de otra categoría y árbol lógico. También se comprobaron un nombre aproximado con explicación correcta, un nombre sin explicación y una mera discrepancia. Se inspeccionaron los textos generados y las capturas reales, además de los controles automáticos. La interfaz integrada se comprobó a 320, 390 y 1280 píxeles, sin desbordamiento horizontal; cierre y recarga conservaron la puntuación.

**Alcance:** las muestras reales cubrieron falsa dicotomía y popularidad sobre museos. No prueban todas las categorías, dificultades ni temas. La IA puede equivocarse; una segunda revisión del mismo modelo es un filtro, no una garantía independiente. Si falla el control, se rechaza el turno sin inventar una respuesta ni repetir automáticamente.

El catálogo y la guía se pueden consultar sin usar IA. No hay respuestas prefabricadas que se hagan pasar por conversación generada.

## Uso

0. Elige el ejercicio: **Debate**, **Detectar en un texto** o **Simular un argumento**.
1. Propón un tema o escenario y elige nivel: Inicial, Sutil o Exigente.
2. Lee el aviso de simulación y privacidad antes de empezar.
3. Debate normalmente, o usa **Señalar trampa** para nombrar o describir la falacia y explicar el salto lógico. También puedes hacerlo dentro de un mensaje normal.
4. Si la IA valida el razonamiento, aparece **[¡Punto para ti!]**, una explicación breve y un nuevo argumento. Un nombre suelto no da puntos.
5. **Abrir árbol lógico** muestra premisas y conclusiones con citas, conexiones y comentarios desplegables de los turnos existentes. Revela sus trampas: se pide confirmación. No realiza otra llamada a la IA y no incorpora turnos futuros sin una nueva apertura. Todos los hechos se marcan como supuestos o no verificados: coherencia lógica no prueba verdad.
6. **Cerrar ejercicio y revisar** termina la simulación y muestra las trampas previstas por la IA.
7. Descarga la conversación en Markdown si quieres guardarla fuera de este navegador.

En Android puedes usar Chrome → Añadir a pantalla de inicio. Es un acceso directo web, no un APK.

## Catálogo

22 categorías, incluidas las seis iniciales: apelación a la popularidad/supuesto consenso, pista falsa, ad hominem circunstancial, pendiente resbaladiza, falsa dicotomía y petición de principio. Se añaden hombre de paja, generalización apresurada, falsa causa, autoridad inadecuada, ignorancia, tu quoque, analogía débil, equívoco, pregunta compleja, selección sesgada, composición, afirmación del consecuente, apelaciones a consecuencias, fuerza y piedad, y evidencia anecdótica insuficiente.

La aplicación distingue errores argumentativos de sesgos psicológicos y explica por qué una etiqueta no basta para refutar un argumento. Fuentes consultadas:

- https://iep.utm.edu/fallacy/
- https://plato.stanford.edu/entries/fallacies/
- https://writingcenter.unc.edu/tips-and-tools/fallacies/
- https://www.txst.edu/philosophy/student-resources/informal-fallacies/false-dilemma.html

## Privacidad y límites

- El tema, el contexto reciente y las explicaciones se envían a un servicio separado de Contraluz en Cloudflare Workers AI, modelo fijo `@cf/zai-org/glm-4.7-flash`. No se guarda ninguna clave en esta aplicación.
- No hay cambio automático a modelos de pago ni llamadas en segundo plano. Cada turno requiere una acción del participante. Una petición cancelada puede haber consumido cuota gratuita.
- La sesión se guarda en `localStorage`, solo en el navegador actual, sin cifrado ni sincronización. La opción de borrar elimina esa copia local, no los datos que pudiera haber recibido el proveedor.
- No uses datos sensibles ni tomes los argumentos del personaje como información fiable o asesoramiento.
- La IA puede equivocarse al generar o evaluar falacias. La puntuación no es una evaluación académica.
- La generación recibe hasta 8 mensajes recientes; la evaluación recibe el último argumento y la respuesta del participante. Las sesiones largas pueden perder parte del contexto anterior. El límite de una sesión es de 90 mensajes.
- Las respuestas vacías, mal formadas, sin anotaciones válidas o sin un mapa con citas verificables dentro del turno no se añaden al historial. Los fallos de conexión conservan el texto para intentarlo más tarde.
- Las anotaciones de trampas están ocultas en la interfaz durante el ejercicio, no son un secreto de seguridad: el dueño del navegador puede inspeccionar el almacenamiento o las solicitudes.

## Archivos

- `index.html`: estructura y controles accesibles.
- `styles.css`: diseño adaptable para móvil y escritorio.
- `engine.js`: catálogo, instrucciones del simulador, conexión y validación de respuestas.
- `app.js`: sesión, mensajes, puntuación, revisión y exportación.
- `icon.svg`: icono local.

Sirve esta carpeta mediante HTTP para desarrollo (`python3 -m http.server`). La conexión de IA está limitada a los orígenes admitidos por su servidor; abrir el HTML como archivo local o desde otro origen no la habilita. El servicio separado admite el origen de esta página, no localhost.


## Lógica y límites de la conexión

- La evaluación de la explicación se hace por separado de la generación. No basta con que el argumento tenga una falacia: el participante debe explicar su fallo.
- La generación entrega oraciones completas; el texto visible y las citas del árbol se construyen con esas mismas oraciones. Se rechazan citas incompletas, nodos duplicados y conexiones inválidas. La categoría procede del ejercicio asignado y se revisa contra el argumento real. Una afirmación usada como apoyo en una conexión se presenta como premisa.
- Un control didáctico adicional examina el argumento, la falacia y sus conexiones antes de mostrarlo. No comprueba hechos externos. Los nodos conservan las etiquetas de supuesto o no verificado.
- Hasta tres llamadas por turno: evaluación, generación y revisión. El primer turno usa dos. No hay llamadas automáticas en segundo plano ni reintentos automáticos. La espera máxima visible es de 120 segundos.
- Cuenta comprobada en Workers Free, sin método de pago guardado. El cupo gratuito compartido es de 10.000 neuronas diarias; la documentación indica que el exceso en Free se detiene con error. No se activa un plan pagado ni se cambia automáticamente de proveedor.
- Fuentes de coste y tratamiento de datos: https://developers.cloudflare.com/workers-ai/platform/pricing/ y https://developers.cloudflare.com/workers-ai/platform/data-usage/
- El historial Git conserva la conexión anterior para una reversión manual. No se usa como alternativa automática. El servicio de otras aplicaciones no se modifica.
