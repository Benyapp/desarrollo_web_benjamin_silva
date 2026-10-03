# Tarea 2 - CC5002: Avistamientos de Aves de Chile

Continuación de la Tarea 1: el prototipo ahora funciona con Python + Flask, SQLAlchemy y una
base de datos MySQL, para que voluntarios(as) de la Unión de Ornitólogos de Chile se registren
e informen avistamientos de aves con fotos y videos. Las estadísticas quedan pendientes para la
siguiente tarea.

## Cómo ejecutar la aplicación

1. Crear la base de datos cargando, en este orden, `tarea2.sql`, `region-comuna.sql` y `aves.sql`
   (host `localhost`, puerto `3306`, base `tarea2`, usuario `cc5002`, clave `programacionweb`).
2. Ejecutar `python app.py` y abrir `http://localhost:5000` en el navegador. Desde ahí se puede
   navegar a todas las demás páginas mediante el menú superior.

## Estructura

- `app.py` – rutas de Flask (portada, registro, avistamientos, listado y detalle).
- `models.py` – clases de SQLAlchemy que representan las tablas de `tarea2.sql`.
- `validaciones.py` – validaciones del lado del servidor.
- `templates/` – plantillas HTML (Jinja): `base.html` más una por página.
- `static/css/estilos.css` – hoja de estilos común a todas las páginas.
- `static/js/` – `regiones.js`, `validaciones.js`, `registro.js` y `avistamiento.js` (validaciones
  de la Tarea 1 y llenado de los `<select>` de región y comuna).
- `static/uploads/` – carpeta donde se guardan las fotos y videos subidos.

## Decisiones de diseño e implementación

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

- **Estadísticas**: la opción del menú lleva a una página que indica que estará disponible en
  la siguiente tarea.

- **HTML semántico y CSS simple**: se mantiene el mismo estilo de la Tarea 1 (`header`, `nav`,
  `main`, `section`, `article`, `table`, `footer`) y las mismas propiedades básicas de CSS.
  Las plantillas se validaron con el validador de HTML de W3C sin errores.
