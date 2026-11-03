var LETRAS_VALIDAS = "abcdefghijklmnopqrstuvwxyzáéíóúñü ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑÜ'-";
var DIGITOS_VALIDOS = "0123456789";

function contieneSoloCaracteres(texto, permitidos) {
  var i;
  for (i = 0; i < texto.length; i++) {
    if (permitidos.indexOf(texto.charAt(i)) == -1) {
      return false;
    }
  }
  return true;
}

function validarTexto(valor, etiqueta, minimo) {
  var limpio = valor;
  while (limpio.charAt(0) == " ") { limpio = limpio.substring(1); }
  while (limpio.charAt(limpio.length - 1) == " ") { limpio = limpio.substring(0, limpio.length - 1); }

  if (!minimo) { minimo = 2; }
  if (limpio.length == 0) { return etiqueta + " es obligatorio."; }
  if (limpio.length < minimo) { return etiqueta + " debe tener al menos " + minimo + " caracteres."; }
  if (!contieneSoloCaracteres(limpio, LETRAS_VALIDAS)) {
    return etiqueta + " solo puede contener letras, espacios y guiones.";
  }
  return "";
}

function validarEmail(valor) {
  var arroba = valor.indexOf("@");
  var ultimoPunto = valor.lastIndexOf(".");

  if (valor.length == 0) { return "El correo electrónico es obligatorio."; }
  if (valor.indexOf(" ") != -1) { return "El correo electrónico no puede tener espacios."; }
  if (arroba <= 0) { return "El correo electrónico debe tener un @ precedido de texto."; }
  if (arroba != valor.lastIndexOf("@")) { return "El correo electrónico solo puede tener un @."; }
  if (ultimoPunto < arroba + 2) { return "El correo electrónico debe tener un dominio con punto, ej: correo.cl."; }
  if (ultimoPunto == valor.length - 1) { return "El correo electrónico no puede terminar en punto."; }
  if (valor.length - 1 - ultimoPunto < 2) { return "La terminación del dominio debe tener al menos 2 letras."; }
  return "";
}

function validarCelularChile(valor, obligatorio) {
  var limpio = "";
  var i;
  var caracter;

  if (valor.length == 0) {
    return obligatorio ? "El celular es obligatorio." : "";
  }

  for (i = 0; i < valor.length; i++) {
    caracter = valor.charAt(i);
    if (caracter != " ") { limpio = limpio + caracter; }
  }

  if (limpio.substring(0, 3) == "+56") { limpio = limpio.substring(3); }
  else if (limpio.substring(0, 2) == "56") { limpio = limpio.substring(2); }

  if (limpio.length != 9 || limpio.charAt(0) != "9") {
    return "El celular debe tener formato chileno válido, ej: +56 9 1234 5678.";
  }
  if (!contieneSoloCaracteres(limpio, DIGITOS_VALIDOS)) {
    return "El celular solo puede contener números.";
  }
  return "";
}

function validarSeleccion(valor, etiqueta) {
  if (valor == "" || valor == null) { return "Debe seleccionar " + etiqueta + "."; }
  return "";
}

function validarFechaNacimiento(valor, obligatorio, edadMinima) {
  var fecha, hoy, edad;

  if (valor == "") {
    return obligatorio ? "La fecha de nacimiento es obligatoria." : "";
  }
  fecha = new Date(valor + "T00:00:00");
  hoy = new Date();

  if (fecha > hoy) { return "La fecha de nacimiento no puede estar en el futuro."; }

  edad = hoy.getFullYear() - fecha.getFullYear();
  if (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() == fecha.getMonth() && hoy.getDate() < fecha.getDate())) {
    edad = edad - 1;
  }

  if (edad < edadMinima) { return "Debe tener al menos " + edadMinima + " años para registrarse."; }
  if (edad > 120) { return "La fecha de nacimiento es demasiado antigua."; }
  return "";
}

function validarFechaAvistamiento(valor, maxAniosAtras) {
  var fecha, hoy, limite;

  if (valor == "") { return "La fecha del avistamiento es obligatoria."; }

  fecha = new Date(valor + "T00:00:00");
  hoy = new Date();
  hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  if (fecha > hoy) { return "La fecha del avistamiento no puede estar en el futuro."; }

  limite = new Date(hoy.getFullYear() - maxAniosAtras, hoy.getMonth(), hoy.getDate());
  if (fecha < limite) {
    return "La fecha del avistamiento no puede ser anterior a " + maxAniosAtras + " años atrás.";
  }
  return "";
}

function validarHora(valor) {
  var horas, minutos;

  if (valor.length == 0) { return "La hora del avistamiento es obligatoria."; }
  if (valor.length != 5 || valor.charAt(2) != ":") { return "La hora debe tener formato HH:MM."; }

  horas = valor.substring(0, 2);
  minutos = valor.substring(3, 5);

  if (!contieneSoloCaracteres(horas, DIGITOS_VALIDOS) || !contieneSoloCaracteres(minutos, DIGITOS_VALIDOS)) {
    return "La hora solo puede contener números.";
  }
  if (Number(horas) > 23 || Number(minutos) > 59) {
    return "La hora ingresada no es válida.";
  }
  return "";
}

function validarEnteroPositivo(valor, etiqueta, obligatorio) {
  if (valor == "") { return obligatorio ? etiqueta + " es obligatorio." : ""; }
  if (isNaN(Number(valor)) || !contieneSoloCaracteres(valor, DIGITOS_VALIDOS) || Number(valor) <= 0) {
    return etiqueta + " debe ser un número entero mayor que 0.";
  }
  return "";
}

function validarEvidenciaFotoVideo(idInputFoto, idInputVideo) {
  var inputFoto = document.getElementById(idInputFoto);
  var inputVideo = document.getElementById(idInputVideo);

  if (inputFoto.value == "" && inputVideo.value == "") {
    return "Debe adjuntar al menos una foto o un video como evidencia.";
  }
  return "";
}

function mostrarError(idInput, mensaje) {
  var input = document.getElementById(idInput);
  var contenedorError = document.getElementById(idInput + "-error");
  if (contenedorError != null) { contenedorError.innerHTML = mensaje; }
  return mensaje == "";
}
