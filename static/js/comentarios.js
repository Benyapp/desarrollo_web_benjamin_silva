var NOMBRE_MIN = 3;
var NOMBRE_MAX = 50;
var TEXTO_MIN = 5;
var TEXTO_MAX = 300;

function mostrarErrorComentario(campo, mensaje) {
  document.getElementById(campo + "-error").textContent = mensaje;
  return mensaje == "";
}

function mostrarMensajeComentario(mensaje, esError) {
  var p = document.getElementById("comentario-mensaje");
  p.textContent = mensaje;
  p.className = "mensaje-resultado " + (esError ? "mensaje-error-formulario" : "mensaje-exito");
  if (mensaje == "") { p.className += " oculto"; }
}

function validarNombreComentario() {
  var nombre = document.getElementById("nombre").value.trim();
  var mensaje = "";
  if (nombre.length == 0) {
    mensaje = "El nombre es obligatorio.";
  } else if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) {
    mensaje = "El nombre debe tener entre 3 y 50 caracteres.";
  }
  return mostrarErrorComentario("nombre", mensaje);
}

function validarTextoComentario() {
  var texto = document.getElementById("texto").value.trim();
  var mensaje = "";
  if (texto.length == 0) {
    mensaje = "El comentario es obligatorio.";
  } else if (texto.length < TEXTO_MIN) {
    mensaje = "El comentario debe tener al menos 5 caracteres.";
  } else if (texto.length > TEXTO_MAX) {
    mensaje = "El comentario no puede tener más de 300 caracteres.";
  }
  return mostrarErrorComentario("texto", mensaje);
}

function crearItemComentario(c) {
  var li = document.createElement("li");

  var cabecera = document.createElement("p");
  cabecera.className = "comentario-cabecera";
  var autor = document.createElement("strong");
  autor.textContent = c.nombre;
  cabecera.appendChild(autor);
  cabecera.appendChild(document.createTextNode(" - " + c.fecha));

  var texto = document.createElement("p");
  texto.className = "comentario-texto";
  texto.textContent = c.texto;

  li.appendChild(cabecera);
  li.appendChild(texto);
  return li;
}

function mostrarComentarios(comentarios) {
  var lista = document.getElementById("lista-comentarios");
  lista.innerHTML = "";
  if (comentarios.length == 0) {
    var vacio = document.createElement("li");
    vacio.className = "texto-ayuda";
    vacio.textContent = "Aún no hay comentarios. ¡Sé el primero en comentar!";
    lista.appendChild(vacio);
    return;
  }
  for (var i = 0; i < comentarios.length; i++) {
    lista.appendChild(crearItemComentario(comentarios[i]));
  }
}

function cargarComentarios() {
  var url = document.getElementById("comentarios").dataset.url;
  fetch(url)
    .then(function (respuesta) {
      if (!respuesta.ok) { throw new Error("HTTP " + respuesta.status); }
      return respuesta.json();
    })
    .then(mostrarComentarios)
    .catch(function () {
      var lista = document.getElementById("lista-comentarios");
      lista.innerHTML = "";
      var li = document.createElement("li");
      li.className = "mensaje-error";
      li.textContent = "No se pudieron cargar los comentarios.";
      lista.appendChild(li);
    });
}

function enviarComentario(evento) {
  evento.preventDefault();
  mostrarMensajeComentario("", false);

  var nombreOk = validarNombreComentario();
  var textoOk = validarTextoComentario();
  if (!nombreOk || !textoOk) {
    mostrarMensajeComentario("Hay errores en el comentario. Revisa los campos marcados en rojo.", true);
    return;
  }

  var form = document.getElementById("form-comentario");
  var boton = document.getElementById("boton-comentario");
  boton.disabled = true;

  fetch(form.action, { method: "POST", body: new FormData(form) })
    .then(function (respuesta) {
      return respuesta.json().then(function (datos) {
        return { ok: respuesta.ok, datos: datos };
      });
    })
    .then(function (r) {
      if (r.ok) {
        form.reset();
        mostrarMensajeComentario("¡Comentario agregado!", false);
        cargarComentarios();
      } else if (r.datos.errores) {
        mostrarErrorComentario("nombre", r.datos.errores.nombre || "");
        mostrarErrorComentario("texto", r.datos.errores.texto || "");
        mostrarMensajeComentario("Hay errores en el comentario. Revisa los campos marcados en rojo.", true);
      } else {
        mostrarMensajeComentario(r.datos.error || "No se pudo agregar el comentario.", true);
      }
    })
    .catch(function () {
      mostrarMensajeComentario("No se pudo conectar con el servidor. Intente nuevamente.", true);
    })
    .finally(function () {
      boton.disabled = false;
    });
}

document.getElementById("form-comentario").addEventListener("submit", enviarComentario);
document.getElementById("nombre").addEventListener("blur", validarNombreComentario);
document.getElementById("texto").addEventListener("blur", validarTextoComentario);
cargarComentarios();
