# Tarea 1 - CC5002: Avistamientos de Aves de Chile

Prototipo de interfaz (solo HTML5 + CSS3 + JavaScript, sin servidor ni backend) para un
sistema que permite a voluntarios(as) de la Unión de Ornitólogos de Chile registrarse,
informar avistamientos de aves y consultar la información recopilada.

## Cómo abrir el prototipo

No requiere servidor: basta con abrir `index.html` directamente en el navegador
(doble clic o `Ctrl+O` desde el navegador). Desde ahí se puede navegar a todas las
demás páginas mediante el menú superior.

## Estructura

- `index.html` – página de inicio con acceso a las 4 funcionalidades.
- `registro.html` / `js/registro.js` – registro de voluntario(a).
- `avistamiento.html` / `js/avistamiento.js` – formulario para informar un avistamiento.
- `listado.html` / `js/listado.js` – listado de avistamientos con filtro, orden y paginación.
- `metricas.html` / `js/metricas.js` – indicadores y gráficos de barras (hechos con `<div>`).
- `js/regiones.js` – datos de regiones/comunas de Chile y lógica de los `<select>` dependientes.
- `js/validaciones.js` – funciones de validación reutilizadas por los formularios.
- `js/datos-ejemplo.js` – datos de ejemplo (mock) para poblar listado y métricas.
- `css/estilos.css` – hoja de estilos común a todas las páginas.

## Decisiones de diseño e implementación

- **Nivel de JavaScript usado**: el código se escribió basándose en la materia y el
  material visto en clases (`var`, `function`, ciclos `for`, `if/else`, manejadores de
  evento como atributos HTML `onclick`/`onchange`/`onblur`/`onsubmit`,
  `document.getElementById`, `.value`, `.innerHTML`), siguiendo el mismo estilo de los
  ejemplos del curso (`credito.js`, `ej1.html`, `ej2.html`, `factorial.html`). Por
  ejemplo, el ordenamiento del listado se implementa con un algoritmo de burbuja
  usando dos ciclos `for` anidados, aplicando la misma lógica de ciclos vista en clases.

- **Validación de formato caracter por caracter**: todas las validaciones de formato
  (correo, celular, hora) se hacen revisando caracter por caracter con `charAt`,
  `indexOf`, `substring` y `length`, tal como se muestra en los ejemplos de clases
  (extracción de substrings, búsqueda de posición de un caracter, etc.).

- **Sin persistencia real**: tal como indica el enunciado, no se almacena la
  información ingresada por el usuario. Los formularios de registro y avistamiento
  solo validan los datos y muestran un mensaje de éxito simulado. El listado y las
  métricas usan datos de ejemplo (`js/datos-ejemplo.js`) para poder mostrar y probar
  filtro, orden, paginación y gráficos sin necesidad de backend.

- **Avistamientos solo para voluntarios registrados**: como no hay backend ni sesión
  real, `avistamiento.html` simplemente solicita nombre y correo del voluntario que
  informa (asumiendo que ya se registró previamente), en vez de implementar un login
  real, que está fuera del alcance de este prototipo.

- **Validaciones en JavaScript**: todas las reglas de validación (más allá del atributo
  `required`) están en `js/validaciones.js` y se ejecutan tanto al perder el foco de
  cada campo (`onblur`/`onchange`) como al enviar el formulario (`onsubmit`, que
  retorna `false` para evitar el envío real ya que no hay servidor). Reglas
  destacadas:
  - Nombres/apellidos: solo letras, espacios y guiones, mínimo 2 caracteres.
  - Correo electrónico: se revisa manualmente la presencia de un único `@`, que
    tenga texto antes, y un dominio con un punto seguido de al menos 2 letras.
  - Celular: se limpian espacios y el prefijo `+56`/`56`, y se exige que queden
    9 dígitos comenzando con `9` (formato chileno).
  - Fecha de nacimiento (opcional): no futura, edad mínima 12 años, máxima 120,
    calculada comparando año/mes/día con `Date`.
  - Fecha de avistamiento: no puede ser futura ni tener más de 5 años de antigüedad.
  - Hora de avistamiento (`input type="text"`, formato `HH:MM`): se valida longitud,
    posición de los `:` y rango de horas/minutos.
  - Cantidad de ejemplares (opcional): entero positivo si se informa, usando
    `isNaN(Number(valor))` como se vio en clases.
  - Evidencia: se exige al menos un archivo de foto **o** de video, revisando que
    el campo `value` del `input type="file"` no esté vacío.
  - Región/Comuna: se exige selección de ambas; la comuna se llena dinámicamente
    según la región elegida (`onchange` sobre el `<select>` de región) y permanece
    deshabilitada hasta que se elige una región.

- **HTML semántico**: se usa `header`, `nav`, `main`, `section`, `article`, `table`/
  `caption`/`thead`/`tbody`, y `footer` en vez de `div` genéricos, siguiendo la misma
  estructura mostrada en los ejemplos de clases (`header` + `nav` + `main` +
  `article` + `footer`).

- **Listado de avistamientos**: el filtro por tipo de ave, el ordenamiento (por
  fecha u orden alfabético de lugar, ascendente o descendente) y la paginación se
  calculan completamente en el cliente sobre el arreglo de datos de ejemplo, usando
  solo ciclos `for` y comparaciones simples.

- **Métricas**: los gráficos de barras (avistamientos por tipo de ave, voluntarios
  por región) se generan concatenando texto HTML y asignándolo con `.innerHTML`
  (igual que en los ejemplos de clases), usando `<div>`/`<span>` cuyo ancho en
  porcentaje representa el valor, en vez de dibujar con SVG.

- **CSS simple**: se usan solo propiedades básicas (color, márgenes, bordes,
  `border-radius`, `box-shadow`, `cursor`), el mismo estilo visto en clases, en línea
  también con la indicación del enunciado de no complicarse con el diseño gráfico.
  El diseño es fluido (anchos máximos y porcentuales) para adaptarse a distintas
  resoluciones sin necesidad de media queries.