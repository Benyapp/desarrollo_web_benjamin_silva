function buscarIndiceRegion(idRegion) {
  var i;
  for (i = 0; i < REGIONES.length; i++) {
    if (String(REGIONES[i].id) == String(idRegion)) {
      return i;
    }
  }
  return -1;
}

function llenarSelectRegiones(idSelectRegion) {
  var selectRegion = document.getElementById(idSelectRegion);
  var opciones = "<option value=\"\" selected disabled>Seleccione región</option>";
  var i;
  for (i = 0; i < REGIONES.length; i++) {
    opciones = opciones + "<option value=\"" + REGIONES[i].id + "\">" + REGIONES[i].nombre + "</option>";
  }
  selectRegion.innerHTML = opciones;
}

function actualizarComunas(idSelectRegion, idSelectComuna) {
  var selectRegion = document.getElementById(idSelectRegion);
  var selectComuna = document.getElementById(idSelectComuna);
  var indice = buscarIndiceRegion(selectRegion.value);
  var opciones = "<option value=\"\" selected disabled>Seleccione comuna</option>";
  var i;

  if (indice == -1) {
    selectComuna.innerHTML = opciones;
    selectComuna.disabled = true;
    return;
  }

  for (i = 0; i < REGIONES[indice].comunas.length; i++) {
    opciones = opciones + "<option value=\"" + REGIONES[indice].comunas[i].id + "\">" + REGIONES[indice].comunas[i].nombre + "</option>";
  }
  selectComuna.innerHTML = opciones;
  selectComuna.disabled = false;
}

function restaurarSeleccion(idSelectRegion, idSelectComuna, idRegion, idComuna) {
  if (idRegion == "") { return; }
  document.getElementById(idSelectRegion).value = idRegion;
  actualizarComunas(idSelectRegion, idSelectComuna);
  document.getElementById(idSelectComuna).value = idComuna;
}
