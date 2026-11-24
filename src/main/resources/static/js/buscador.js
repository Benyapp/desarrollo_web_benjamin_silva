var URL_BUSCAR = "/api/avistamientos/buscar";
var ESPERA_MS = 250;      // se espera a que el usuario deje de escribir antes de consultar
var NOTA_MIN = 1;
var NOTA_MAX = 7;

var temporizador = null;
var consultaActual = null;  // AbortController de la última búsqueda enviada
var avistamientoEvaluado = null;

/* ---------- Utilidades ---------- */

// Quita tildes y pasa a minúsculas, carácter por carácter, para que el resaltado
// coincida con la búsqueda de MySQL (que no distingue mayúsculas ni tildes: "nandu" calza con "Ñandú").
function normalizarCaracter(c) {
  return c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Agrega a "elemento" el texto, envolviendo en <mark> cada parte que calza con "patron".
// Se construye con nodos de texto (nunca innerHTML), así un nombre con "<script>" se muestra como texto.
function agregarTextoResaltado(elemento, texto, patron) {
  var normalizado = "";
  var posiciones = [];  // posiciones[i] = índice en "texto" del carácter i de "normalizado"
  for (var i = 0; i < texto.length; i++) {
    var n = normalizarCaracter(texto[i]);
    for (var j = 0; j < n.length; j++) {
      normalizado += n[j];
      posiciones.push(i);
    }
  }
  posiciones.push(texto.length);

  var buscado = "";
  for (var k = 0; k < patron.length; k++) {
    buscado += normalizarCaracter(patron[k]);
  }

  var desde = 0;
  var encontrado = buscado.length > 0 ? normalizado.indexOf(buscado) : -1;
  while (encontrado != -1) {
    var inicio = posiciones[encontrado];
    var fin = posiciones[encontrado + buscado.length];
    if (inicio > desde) {
      elemento.appendChild(document.createTextNode(texto.substring(desde, inicio)));
    }
    var mark = document.createElement("mark");
    mark.textContent = texto.substring(inicio, fin);
    elemento.appendChild(mark);
    desde = fin;
    encontrado = normalizado.indexOf(buscado, encontrado + buscado.length);
  }
  if (desde < texto.length) {
    elemento.appendChild(document.createTextNode(texto.substring(desde)));
  }
}

function formatearPromedio(promedio) {
  return promedio.toFixed(1).replace(".", ",");
}

/* ---------- Buscador ---------- */

function mostrarEstado(mensaje, esError) {
  var estado = document.getElementById("estado-busqueda");
  estado.textContent = mensaje;
  estado.className = esError ? "mensaje-error" : "texto-ayuda";
  estado.classList.toggle("oculto", mensaje == "");
}

function ocultarTabla() {
  document.getElementById("tabla-resultados").classList.add("oculto");
  document.getElementById("cuerpo-resultados").innerHTML = "";
}

function escribirNota(celda, promedio, cantidad) {
  celda.innerHTML = "";
  if (cantidad == 0 || promedio === null) {
    celda.textContent = "-";
    return;
  }
  var valor = document.createElement("strong");
  valor.textContent = formatearPromedio(promedio);
  var detalle = document.createElement("span");
  detalle.className = "cantidad-notas";
  detalle.textContent = " (" + cantidad + (cantidad == 1 ? " nota)" : " notas)");
  celda.appendChild(valor);
  celda.appendChild(detalle);
}

function crearFila(a, patron) {
  var fila = document.createElement("tr");
  fila.id = "avistamiento-" + a.id;

  var columnas = [a.voluntario, a.dia, a.ave, a.comuna];
  var resaltar = [true, false, true, true];
  for (var i = 0; i < columnas.length; i++) {
    var td = document.createElement("td");
    if (resaltar[i]) {
      agregarTextoResaltado(td, columnas[i], patron);
    } else {
      td.textContent = columnas[i];
    }
    fila.appendChild(td);
  }

  var celdaNota = document.createElement("td");
  celdaNota.className = "celda-nota";
  escribirNota(celdaNota, a.promedio, a.cantidadNotas);
  fila.appendChild(celdaNota);

  var celdaBoton = document.createElement("td");
  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton-secundario boton-chico";
  boton.textContent = "Evaluar";
  boton.addEventListener("click", function () {
    abrirDialogoNota(a);
  });
  celdaBoton.appendChild(boton);
  fila.appendChild(celdaBoton);

  return fila;
}

function mostrarResultados(resultados, patron) {
  if (resultados.length == 0) {
    ocultarTabla();
    mostrarEstado("No se encontraron avistamientos cuyo ave, voluntario o comuna contenga \"" + patron + "\".", false);
    return;
  }
  mostrarEstado("", false);
  var cuerpo = document.getElementById("cuerpo-resultados");
  cuerpo.innerHTML = "";
  for (var i = 0; i < resultados.length; i++) {
    cuerpo.appendChild(crearFila(resultados[i], patron));
  }
  document.getElementById("titulo-tabla").textContent =
    resultados.length == 1 ? "1 avistamiento encontrado" : resultados.length + " avistamientos encontrados";
  document.getElementById("tabla-resultados").classList.remove("oculto");
}

function buscar() {
  var patron = document.getElementById("busqueda").value.trim();

  // Si había una búsqueda en curso, se cancela para que no llegue una respuesta vieja después.
  if (consultaActual) { consultaActual.abort(); }

  if (patron == "") {
    consultaActual = null;
    ocultarTabla();
    mostrarEstado("Escribe algo en el buscador para ver avistamientos.", false);
    return;
  }

  consultaActual = new AbortController();
  mostrarEstado("Buscando...", false);

  fetch(URL_BUSCAR + "?q=" + encodeURIComponent(patron), { signal: consultaActual.signal })
    .then(function (respuesta) {
      if (!respuesta.ok) { throw new Error("HTTP " + respuesta.status); }
      return respuesta.json();
    })
    .then(function (resultados) {
      mostrarResultados(resultados, patron);
    })
    .catch(function (error) {
      if (error.name == "AbortError") { return; }
      ocultarTabla();
      mostrarEstado("No se pudo realizar la búsqueda. Intente nuevamente.", true);
    });
}

function programarBusqueda() {
  clearTimeout(temporizador);
  temporizador = setTimeout(buscar, ESPERA_MS);
}

/* ---------- Evaluar (nota) ---------- */

function abrirDialogoNota(a) {
  avistamientoEvaluado = a;
  var form = document.getElementById("form-nota");
  form.reset();
  document.getElementById("error-nota").textContent = "";
  document.getElementById("detalle-dialogo").textContent =
    a.ave + " - visto por " + a.voluntario + " el " + a.dia + " (" + a.comuna + ")";
  document.getElementById("boton-guardar-nota").disabled = false;
  document.getElementById("dialogo-nota").showModal();
}

function cerrarDialogoNota() {
  document.getElementById("dialogo-nota").close();
  avistamientoEvaluado = null;
}

// Devuelve la nota elegida como número entero entre 1 y 7, o null si no es válida.
function leerNotaSeleccionada() {
  var elegida = document.querySelector("#form-nota input[name='nota']:checked");
  if (!elegida || !/^[1-7]$/.test(elegida.value)) { return null; }
  var nota = parseInt(elegida.value, 10);
  return (nota >= NOTA_MIN && nota <= NOTA_MAX) ? nota : null;
}

function enviarNota(evento) {
  evento.preventDefault();
  var error = document.getElementById("error-nota");
  var nota = leerNotaSeleccionada();
  if (nota === null) {
    error.textContent = "Debes seleccionar una nota entera entre 1 y 7.";
    return;
  }
  error.textContent = "";

  var a = avistamientoEvaluado;
  var boton = document.getElementById("boton-guardar-nota");
  boton.disabled = true;

  fetch("/api/avistamientos/" + a.id + "/notas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota: nota })
  })
    .then(function (respuesta) {
      return respuesta.json().then(function (datos) {
        return { ok: respuesta.ok, datos: datos };
      });
    })
    .then(function (r) {
      if (!r.ok) {
        error.textContent = r.datos.error || "No se pudo guardar la nota.";
        boton.disabled = false;
        return;
      }
      // Se actualiza el promedio en la fila con el valor recalculado por el servidor.
      a.promedio = r.datos.promedio;
      a.cantidadNotas = r.datos.cantidad;
      var fila = document.getElementById("avistamiento-" + a.id);
      if (fila) {
        escribirNota(fila.querySelector(".celda-nota"), a.promedio, a.cantidadNotas);
        fila.classList.add("fila-actualizada");
        setTimeout(function () { fila.classList.remove("fila-actualizada"); }, 1500);
      }
      cerrarDialogoNota();
    })
    .catch(function () {
      error.textContent = "No se pudo conectar con el servidor. Intente nuevamente.";
      boton.disabled = false;
    });
}

/* ---------- Eventos ---------- */

document.getElementById("busqueda").addEventListener("input", programarBusqueda);
document.getElementById("form-buscador").addEventListener("submit", function (evento) {
  evento.preventDefault();
  clearTimeout(temporizador);
  buscar();
});
document.getElementById("form-nota").addEventListener("submit", enviarNota);
document.getElementById("boton-cancelar-nota").addEventListener("click", cerrarDialogoNota);
