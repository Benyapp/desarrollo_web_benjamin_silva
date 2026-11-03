llenarSelectRegiones("region");
restaurarSeleccion("region", "comuna", REGION_SELECCIONADA, COMUNA_SELECCIONADA);

function validarCampoNombres() {
  var mensaje = validarTexto(document.getElementById("nombres").value, "El nombre", 2);
  return mostrarError("nombres", mensaje);
}

function validarCampoApellidos() {
  var mensaje = validarTexto(document.getElementById("apellidos").value, "El apellido", 2);
  return mostrarError("apellidos", mensaje);
}

function validarCampoEmail() {
  var mensaje = validarEmail(document.getElementById("email").value);
  return mostrarError("email", mensaje);
}

function validarCampoCelular() {
  var mensaje = validarCelularChile(document.getElementById("celular").value, true);
  return mostrarError("celular", mensaje);
}

function validarCampoRegion() {
  var mensaje = validarSeleccion(document.getElementById("region").value, "una región");
  return mostrarError("region", mensaje);
}

function validarCampoComuna() {
  var mensaje = validarSeleccion(document.getElementById("comuna").value, "una comuna");
  return mostrarError("comuna", mensaje);
}

function validarRegistro() {
  var valido1 = validarCampoNombres();
  var valido2 = validarCampoApellidos();
  var valido3 = validarCampoEmail();
  var valido4 = validarCampoCelular();
  var valido5 = validarCampoRegion();
  var valido6 = validarCampoComuna();

  return valido1 && valido2 && valido3 && valido4 && valido5 && valido6;
}
