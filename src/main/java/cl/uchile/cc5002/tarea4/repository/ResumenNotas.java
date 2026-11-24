package cl.uchile.cc5002.tarea4.repository;

/** Promedio y cantidad de notas de un avistamiento (resultado de una consulta agregada). */
public record ResumenNotas(Integer avistamientoId, Double promedio, Long cantidad) {
}
