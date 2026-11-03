function obtenerDatos(idContenedor) {
  var url = document.getElementById(idContenedor).dataset.url;
  return fetch(url).then(function (respuesta) {
    if (!respuesta.ok) { throw new Error("HTTP " + respuesta.status); }
    return respuesta.json();
  });
}

function mostrarMensajeGrafico(idContenedor, mensaje, esError) {
  var contenedor = document.getElementById(idContenedor);
  contenedor.innerHTML = "";
  var p = document.createElement("p");
  p.className = esError ? "mensaje-error" : "texto-ayuda";
  p.textContent = mensaje;
  contenedor.appendChild(p);
}

function cargarGrafico(idContenedor, dibujar) {
  obtenerDatos(idContenedor)
    .then(function (datos) {
      if (datos.length == 0) {
        mostrarMensajeGrafico(idContenedor, "Aún no hay datos para este gráfico.", false);
      } else {
        dibujar(idContenedor, datos);
      }
    })
    .catch(function () {
      mostrarMensajeGrafico(idContenedor, "No se pudieron cargar los datos del gráfico.", true);
    });
}

function dibujarAvistamientosPorDia(id, datos) {
  var puntos = datos.map(function (d) {
    var partes = d.dia.split("-");
    return [Date.UTC(+partes[0], +partes[1] - 1, +partes[2]), d.total];
  });
  Highcharts.chart(id, {
    chart: { type: "line" },
    title: { text: "Cantidad de avistamientos por día" },
    xAxis: { type: "datetime", title: { text: "Día" }, labels: { format: "{value:%d-%m-%Y}" } },
    yAxis: { title: { text: "Avistamientos" }, allowDecimals: false, min: 0 },
    tooltip: { xDateFormat: "%d-%m-%Y", pointFormat: "Avistamientos: <b>{point.y}</b>" },
    legend: { enabled: false },
    series: [{ name: "Avistamientos", data: puntos }],
    credits: { enabled: false }
  });
}

function dibujarAvistamientosPorAve(id, datos) {
  Highcharts.chart(id, {
    chart: { type: "pie" },
    title: { text: "Total de avistamientos por ave" },
    tooltip: { pointFormat: "Avistamientos: <b>{point.y}</b> ({point.percentage:.1f}%)" },
    plotOptions: {
      pie: { dataLabels: { enabled: true, format: "{point.name}: {point.y}" } }
    },
    series: [{
      name: "Avistamientos",
      data: datos.map(function (d) { return { name: d.ave, y: d.total }; })
    }],
    credits: { enabled: false }
  });
}

function dibujarVoluntariosPorComuna(id, datos) {
  Highcharts.chart(id, {
    chart: { type: "column" },
    title: { text: "Total de voluntarios por comuna" },
    xAxis: { categories: datos.map(function (d) { return d.comuna; }), title: { text: "Comuna" } },
    yAxis: { title: { text: "Voluntarios" }, allowDecimals: false, min: 0 },
    legend: { enabled: false },
    series: [{ name: "Voluntarios", data: datos.map(function (d) { return d.total; }) }],
    credits: { enabled: false }
  });
}

cargarGrafico("grafico-dias", dibujarAvistamientosPorDia);
cargarGrafico("grafico-aves", dibujarAvistamientosPorAve);
cargarGrafico("grafico-comunas", dibujarVoluntariosPorComuna);
