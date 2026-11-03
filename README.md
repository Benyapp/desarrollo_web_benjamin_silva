# Tarea 3 - CC5002: Avistamientos de Aves de Chile

**Autor:** Benjamín Silva

Continuación de la Tarea 2 (Python + Flask, SQLAlchemy y MySQL). En esta entrega se agregan:

- **Estadísticas** con 3 gráficos (líneas, torta y barras) generados en el cliente con
  Highcharts, a partir de datos que se piden con `fetch` a Flask.
- **Comentarios** en el detalle de cada avistamiento: formulario para agregar y listado, ambos
  con llamadas asíncronas (`fetch`), sin recargar la página.

Más abajo están las decisiones de la Tarea 2, que se mantienen.

## Cómo ejecutar la aplicación

1. Crear la base de datos cargando, en este orden, `tarea2.sql`, `region-comuna.sql`, `aves.sql`
   y `tabla-comentario.sql` (host `localhost`, puerto `3306`, base `tarea2`, usuario `cc5002`,
   clave `programacionweb`). Si ya existe la base de la Tarea 2, basta con cargar
   `tabla-comentario.sql`.
2. Ejecutar `python app.py` y abrir `http://localhost:5000` en el navegador. Desde ahí se puede
   navegar a todas las demás páginas mediante el menú superior.

## Tarea 3: decisiones de diseño e implementación

- **Biblioteca de gráficos**: [Highcharts](https://www.highcharts.com/) 11.4.8 (vista en clases),
  cargada desde su CDN oficial (`code.highcharts.com`). Su licencia permite el uso gratuito
  para fines personales y educativos sin fines de lucro, como esta tarea. Se requiere conexión
  a internet para ver los gráficos.

- **Datos de los gráficos**: la página `/estadisticas` solo tiene los contenedores; el archivo
  `static/js/estadisticas.js` pide cada serie con `fetch` a una URL que consulta la base de datos
  y responde JSON:
  - `/estadisticas/avistamientos-por-dia` → gráfico de **líneas**. Se agrupa por la fecha (día)
    de `avistamiento.fecha_hora`, que es el día en que se vio el ave (el modelo no guarda la fecha
    de inserción). El eje X es de tipo fecha, por lo que los días sin avistamientos quedan como
    espacios entre puntos.
  - `/estadisticas/avistamientos-por-ave` → gráfico de **torta**. El modelo de datos de la Tarea 2
    no tiene "tipo de ave", solo la tabla `ave`, así que se agrupa por ave.
  - `/estadisticas/voluntarios-por-comuna` → gráfico de **barras**. Solo aparecen las comunas con
    al menos un voluntario (por el `JOIN`).
  - Si un gráfico no tiene datos o la consulta falla, se muestra un mensaje en su lugar.
  - Al final de la página hay un enlace para volver a la portada.

- **Comentarios** (`static/js/comentarios.js`):
  - El detalle del avistamiento carga el listado con `GET /avistamiento/<id>/comentarios`
    (JSON), ordenado del más reciente al más antiguo, mostrando fecha, nombre y texto.
  - El botón "Agregar comentario" valida en JavaScript (nombre obligatorio de 3 a 50 caracteres,
    comentario obligatorio de al menos 5) y, si está correcto, envía el formulario con
    `POST /avistamiento/<id>/comentarios` usando `fetch`. Flask repite las validaciones
    (`validaciones.validar_comentario`) y, si hay errores, responde 400 con los mensajes por campo,
    que se muestran bajo cada campo dejando el formulario visible con lo escrito. Si todo está
    bien inserta en la tabla `comentario` (con `fecha` = fecha y hora actual), responde 201 y la
    página limpia el formulario y recarga el listado.
  - El texto del comentario tiene un máximo de 300 caracteres porque ese es el largo de la
    columna `texto` en `tabla-comentario.sql`. También se rechazan caracteres de control.
  - Si el avistamiento no existe se responde 404.

- **Entradas maliciosas en comentarios**: la inserción usa SQLAlchemy (consulta parametrizada) y
  en el navegador los comentarios se agregan con `textContent`, nunca con `innerHTML`, por lo que
  un nombre o texto como `<script>...</script>` se muestra como texto y no se ejecuta.

- **Validación W3C**: las páginas de estadísticas y de detalle (con comentarios) y la hoja de
  estilos se revisaron con los validadores de HTML y CSS de W3C sin errores.

## Estructura

- `app.py` – rutas de Flask (portada, registro, avistamientos, listado, detalle, comentarios y
  estadísticas con sus URLs de datos JSON).
- `models.py` – clases de SQLAlchemy que representan las tablas de `tarea2.sql`.
- `validaciones.py` – validaciones del lado del servidor.
- `templates/` – plantillas HTML (Jinja): `base.html` más una por página.
- `static/css/estilos.css` – hoja de estilos común a todas las páginas.
- `static/js/` – `regiones.js`, `validaciones.js`, `registro.js` y `avistamiento.js` (validaciones
  de la Tarea 1 y llenado de los `<select>` de región y comuna), más `estadisticas.js` y
  `comentarios.js` (Tarea 3).
- `static/uploads/` – carpeta donde se guardan las fotos y videos subidos.

## Decisiones de la Tarea 2 (se mantienen)

- **Modelo de datos**: se usó `tarea2.sql` sin modificarlo, por lo que los formularios de la
  Tarea 1 se ajustaron a lo que el modelo permite guardar. En el registro de voluntario se
  guarda nombre (nombres + apellidos), correo, celular, comuna y `fecha_registro` (fecha y hora
  del insert); se eliminaron fecha de nacimiento, dirección y motivación porque no tienen
  columna. En el avistamiento, el tipo y el nombre del ave se reemplazaron por un único
  `<select>` con la tabla `ave`, la región/comuna pasó a ser el campo de texto obligatorio
  "lugar" y se eliminó la cantidad de ejemplares. El voluntario se elige desde un `<select>`
  con los voluntarios registrados (al registrarse llega preseleccionado).

- **Doble validación**: las validaciones de JavaScript de la Tarea 1 se mantienen (el
  `onsubmit` ahora retorna `false` solo si hay errores, para que en caso contrario el
  formulario se envíe al servidor) y se vuelven a hacer en Python, ya que el cliente no es
  confiable. Si el servidor detecta errores, vuelve a mostrar el formulario con los datos
  ingresados y el mensaje bajo cada campo. Los archivos deben adjuntarse de nuevo porque el
  navegador no permite rellenarlos.

- **Región y comuna**: se leen desde la base de datos y se pasan a JavaScript, que llena el
  `<select>` de comuna según la región elegida (igual que en la Tarea 1). El servidor revisa
  que la comuna exista y pertenezca a la región.

- **Entradas maliciosas**: todas las consultas se hacen con SQLAlchemy (parametrizadas, sin
  armar SQL a mano), Jinja escapa automáticamente el texto que se muestra, los ids de las URL
  se reciben como `<int:id>`, el parámetro `pagina` del listado se corrige si es inválido o
  está fuera de rango, y se limita el largo de los textos.

- **Archivos**: se aceptan varias fotos (jpg, png, gif, webp, hasta 5 MB cada una) y varios
  videos (mp4, webm, mov, hasta 30 MB cada uno), con un máximo de 5 de cada tipo y al menos un
  archivo en total. Se revisa la extensión, el tamaño y el tipo real del contenido con la
  librería `filetype`, no solo el nombre. Cada archivo se guarda en `static/uploads/` con un
  nombre aleatorio (uuid) para evitar repetidos y nombres peligrosos; en `registro` se guarda
  la ruta y el nombre original limpiado con `secure_filename`, una fila por archivo.

- **Inserción en la base de datos**: el avistamiento y sus registros se insertan en una sola
  transacción; si algo falla se hace `rollback` y se borran los archivos ya guardados.

- **Fecha y hora del avistamiento**: se guardan juntas en `fecha_hora`. Además de las reglas de
  la Tarea 1, el servidor rechaza momentos futuros o con más de 5 años de antigüedad.

- **Portada**: muestra los 2 últimos avistamientos agregados (por id) con ave, lugar, fecha,
  voluntario y cantidad de archivos.

- **Listado de avistamientos**: se ordena por fecha del avistamiento (el más reciente primero)
  y se muestra de a 5 por página con botones Anterior y Siguiente. Al hacer clic en una fila
  se abre el detalle (`/avistamiento/<id>`), que obtiene los datos desde la base de datos y
  muestra las fotos y los videos. El filtro por tipo de ave de la Tarea 1 no se implementó
  porque el modelo de datos no tiene tipo de ave.

- **HTML semántico y CSS simple**: se mantiene el mismo estilo de la Tarea 1 (`header`, `nav`,
  `main`, `section`, `article`, `table`, `footer`) y las mismas propiedades básicas de CSS.
  Las plantillas se validaron con el validador de HTML de W3C sin errores.
