function validarCampoVoluntario() {
  var mensaje = validarSeleccion(document.getElementById("voluntario").value, "un voluntario");
  return mostrarError("voluntario", mensaje);
}

function validarCampoAve() {
  var mensaje = validarSeleccion(document.getElementById("ave").value, "un ave");
  return mostrarError("ave", mensaje);
}

function validarCampoLugar() {
  var lugar = document.getElementById("lugar").value;
  var mensaje = "";
  if (lugar.replace(" ", "").length == 0) {
    mensaje = "El lugar es obligatorio.";
  } else if (lugar.length < 2 || lugar.length > 200) {
    mensaje = "El lugar debe tener entre 2 y 200 caracteres.";
  }
  return mostrarError("lugar", mensaje);
}

function validarCampoFecha() {
  var mensaje = validarFechaAvistamiento(document.getElementById("fecha").value, 5);
  return mostrarError("fecha", mensaje);
}

function validarCampoHora() {
  var mensaje = validarHora(document.getElementById("hora").value);
  return mostrarError("hora", mensaje);
}

function validarCampoEvidencia() {
  var mensaje = validarEvidenciaFotoVideo("fotos", "videos");
  document.getElementById("evidencia-error").innerHTML = mensaje;
  return mensaje == "";
}

function validarCampoDescripcion() {
  var mensaje = "";
  if (document.getElementById("descripcion").value.length > 500) {
    mensaje = "La descripción no puede tener más de 500 caracteres.";
  }
  return mostrarError("descripcion", mensaje);
}

function validarAvistamiento() {
  var valido1 = validarCampoVoluntario();
  var valido2 = validarCampoAve();
  var valido3 = validarCampoLugar();
  var valido4 = validarCampoFecha();
  var valido5 = validarCampoHora();
  var valido6 = validarCampoEvidencia();
  var valido7 = validarCampoDescripcion();

  return valido1 && valido2 && valido3 && valido4 && valido5 && valido6 && valido7;
}
