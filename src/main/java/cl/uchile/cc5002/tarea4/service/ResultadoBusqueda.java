package cl.uchile.cc5002.tarea4.service;

/** Lo que se envía al navegador (JSON) por cada avistamiento encontrado. */
public record ResultadoBusqueda(
        Integer id,
        String voluntario,
        String dia,
        String ave,
        String comuna,
        Double promedio,
        long cantidadNotas) {
}
