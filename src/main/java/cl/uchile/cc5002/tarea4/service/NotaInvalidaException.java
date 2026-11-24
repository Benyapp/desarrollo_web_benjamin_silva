package cl.uchile.cc5002.tarea4.service;

public class NotaInvalidaException extends RuntimeException {

    public NotaInvalidaException(String mensaje) {
        super(mensaje);
    }
}
