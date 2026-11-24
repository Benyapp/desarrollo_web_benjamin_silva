# Tarea 4 - CC5002: Avistamientos de Aves de Chile

**Autor:** Benjamín Silva

En esta entrega se agregan dos funcionalidades nuevas, implementadas con **Spring Boot 3.5**
(Java 17), **JPA** (Hibernate) para la base de datos y **JavaScript** con llamadas asíncronas
(`fetch`) en el cliente:

1. **Buscador de avistamientos** que muestra los resultados mientras se escribe.
2. **Evaluación con notas** (1 a 7) de cada avistamiento, mostrando el promedio.

La aplicación usa la misma base de datos `tarea2` de las tareas 2 y 3.

## Cómo ejecutar la aplicación

Requisitos: Java 17 o superior y MySQL. No es necesario instalar Maven: el proyecto trae el
Maven Wrapper (`mvnw` / `mvnw.cmd`), que lo descarga solo.

1. Crear la base de datos cargando, en este orden, `tarea2.sql`, `region-comuna.sql`,
   `aves.sql`, `tabla-comentario.sql` y `tabla-nota.sql` (host `localhost`, puerto `3306`,
   base `tarea2`, usuario `cc5002`, clave `programacionweb`). Si ya existe la base de la Tarea 3,
   basta con cargar `tabla-nota.sql`.
2. Ejecutar en la carpeta del proyecto:
   - Windows: `mvnw.cmd spring-boot:run`
   - Linux / macOS: `./mvnw spring-boot:run`
3. Abrir `http://localhost:8080` en el navegador.

Los datos de conexión están en `src/main/resources/application.properties`.

## Decisiones de diseño e implementación

- **Qué es "nombre de comuna"**: en el modelo de `tarea2.sql` el avistamiento no tiene comuna
  (desde la Tarea 2 el lugar es el campo de texto `lugar`). La única comuna relacionada con un
  avistamiento es la del **voluntario** que lo informó (`voluntario.comuna_id`), así que el
  buscador busca y muestra esa comuna.

- **Buscador** (`static/js/buscador.js`):
  - El formulario tiene un único `input` de tipo texto. Con el evento `input` se programa la
    búsqueda; se espera 250 ms desde la última tecla para no hacer una consulta por cada letra.
  - Si llega una búsqueda nueva antes de que responda la anterior, la anterior se cancela con
    `AbortController`, para que una respuesta vieja no reemplace a la nueva.
  - La consulta es `GET /api/avistamientos/buscar?q=texto`, que responde JSON con: id, nombre del
    voluntario, día del avistamiento (`dd-mm-aaaa`), nombre del ave, nombre de comuna, promedio de
    notas y cantidad de notas.
  - Si el texto queda vacío se limpia la tabla. Si no hay resultados se muestra un mensaje con el
    texto buscado. Si la consulta falla, se muestra un mensaje de error.
  - Se devuelven como máximo 50 resultados, ordenados del avistamiento más reciente al más antiguo.
    El texto buscado se limita a 100 caracteres.

- **Consulta en el servidor** (`AvistamientoRepository.buscar`): una consulta JPQL con
  `join fetch` de ave, voluntario y comuna (se obtiene todo en una sola consulta) y
  `LIKE '%texto%'` sobre los tres nombres. Los caracteres `%` y `_` que escriba el usuario se
  escapan, para que se busquen como texto y no como comodines. El texto va como parámetro de la
  consulta, nunca concatenado, así que no hay inyección SQL.

- **Resaltado del texto**: en JavaScript se envuelve en `<mark>` cada parte del ave, voluntario y
  comuna que calza con lo buscado. Como MySQL compara sin distinguir mayúsculas ni tildes (la base
  usa `utf8` con su collation por defecto), el resaltado hace lo mismo: buscar `nandu` resalta
  `Ñandú`. Las filas se arman con `createElement` y `textContent`, nunca con `innerHTML`, así que
  un nombre con HTML (por ejemplo `<script>`) se muestra como texto y no se ejecuta.

- **Notas**:
  - Cada fila muestra la columna **Nota**: `-` si el avistamiento no ha sido evaluado, o el
    promedio con un decimal y la cantidad de notas, por ejemplo `5,5 (2 notas)`.
  - El botón **Evaluar** abre una ventana (`<dialog>` de HTML) con 7 opciones (botones de radio
    del 1 al 7). Usar opciones fijas evita que el usuario escriba valores inválidos.
  - Al guardar, JavaScript revisa que se haya elegido una nota entera entre 1 y 7 y la envía con
    `fetch` a `POST /api/avistamientos/{id}/notas` con el cuerpo JSON `{"nota": 5}`.
  - El servidor **vuelve a validar** (el cliente no es confiable): recibe el JSON sin convertir
    (`JsonNode`) y solo acepta un número entero; se rechazan `"5"` (texto), `5.0` o `5.5`
    (decimales), `true`, valores fuera de 1 a 7 y JSON mal formado, respondiendo 400 con un
    mensaje. Si el avistamiento no existe responde 404.
  - Si la nota es válida se inserta en la tabla `nota` (`tabla-nota.sql`), se recalcula el promedio
    con `AVG` en la base de datos y se responde 201 con el promedio y la cantidad de notas. La
    página actualiza la celda de esa fila sin recargar.
  - Los promedios de los resultados de la búsqueda se calculan en una sola consulta agrupada
    (`GROUP BY avistamiento_id`) para todos los avistamientos encontrados.

- **JPA**: las entidades (`model/`) mapean solo las columnas que se usan de las tablas existentes.
  Se usa `spring.jpa.hibernate.ddl-auto=none` para que Hibernate no cree ni modifique tablas.

- **Bibliotecas externas**: ninguna en el cliente (JavaScript sin bibliotecas). En el servidor:
  Spring Boot (web, data-jpa y Thymeleaf para entregar la página) y el conector de MySQL.

- **Estilo**: se reutiliza la hoja de estilos de las tareas anteriores (mismos colores y clases),
  agregando solo los estilos del buscador y de la ventana de evaluación.

## Estructura

- `pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn/` – proyecto Maven y Maven Wrapper.
- `src/main/java/cl/uchile/cc5002/tarea4/`
  - `Tarea4Application.java` – clase principal de Spring Boot.
  - `model/` – entidades JPA: `Avistamiento`, `Ave`, `Voluntario`, `Comuna` y `Nota`.
  - `repository/` – repositorios de Spring Data JPA con las consultas de búsqueda y de promedios.
  - `service/AvistamientoService.java` – lógica de búsqueda y de agregar notas (validación y
    transacción).
  - `controller/` – `PaginaController` (entrega la página) y `AvistamientoApiController` (URLs
    JSON que llama el JavaScript).
- `src/main/resources/`
  - `application.properties` – conexión a la base de datos.
  - `templates/buscador.html` – página del buscador.
  - `static/css/estilos.css` y `static/js/buscador.js`.
- `*.sql` – scripts de la base de datos (los de las tareas anteriores más `tabla-nota.sql`).
