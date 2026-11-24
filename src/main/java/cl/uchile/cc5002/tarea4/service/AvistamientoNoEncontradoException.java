package cl.uchile.cc5002.tarea4.service;

public class AvistamientoNoEncontradoException extends RuntimeException {

    public AvistamientoNoEncontradoException(Integer id) {
        super("No existe el avistamiento " + id + ".");
    }
}
