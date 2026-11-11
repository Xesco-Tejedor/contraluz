# Contraluz

Simulador consentido de debate para entrenar el pensamiento crítico. Interfaz en español, identidad ámbar, sin registro adicional ni claves en el navegador.

## Estado de verificación · 11 de noviembre de 2026

La interfaz, el guardado local, la exportación y la mecánica se han probado en un navegador con respuestas de IA controladas. **Eso no equivale a una conversación real validada.** La comprobación real de la conexión gratuita devolvió un error 429 del proveedor. La conversación depende de que esa conexión esté disponible; no debe considerarse operativa mientras no se complete una prueba real satisfactoria. No se han activado pagos ni un proveedor alternativo para evitar la cuota.

El catálogo y la guía se pueden consultar sin usar IA. No hay respuestas prefabricadas que se hagan pasar por conversación generada.

## Uso

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

- El tema y el contexto reciente se envían a la conexión de IA ya existente, con un modelo identificado como gratuito. No se guarda ninguna clave en esta aplicación.
- No hay cambio automático a modelos de pago ni llamadas en segundo plano. Cada turno requiere una acción del participante. Una petición cancelada puede haber consumido cuota gratuita.
- La sesión se guarda en `localStorage`, solo en el navegador actual, sin cifrado ni sincronización. La opción de borrar elimina esa copia local, no los datos que pudiera haber recibido el proveedor.
- No uses datos sensibles ni tomes los argumentos del personaje como información fiable o asesoramiento.
- La IA puede equivocarse al generar o evaluar falacias. La puntuación no es una evaluación académica.
- El modelo recibe hasta 18 mensajes recientes y el último turno evaluable. Las sesiones largas pueden perder parte del contexto anterior. El límite de una sesión es de 90 mensajes.
- Las respuestas vacías, mal formadas, sin anotaciones válidas o sin un mapa con citas verificables dentro del turno no se añaden al historial. Los fallos de conexión conservan el texto para intentarlo más tarde.
- Las anotaciones de trampas están ocultas en la interfaz durante el ejercicio, no son un secreto de seguridad: el dueño del navegador puede inspeccionar el almacenamiento o las solicitudes.

## Archivos

- `index.html`: estructura y controles accesibles.
- `styles.css`: diseño adaptable para móvil y escritorio.
- `engine.js`: catálogo, instrucciones del simulador, conexión y validación de respuestas.
- `app.js`: sesión, mensajes, puntuación, revisión y exportación.
- `icon.svg`: icono local.

Sirve esta carpeta mediante HTTP para desarrollo (`python3 -m http.server`). La conexión de IA está limitada a los orígenes admitidos por su servidor; abrir el HTML como archivo local o desde otro origen no la habilita. No se ha modificado esa configuración.
