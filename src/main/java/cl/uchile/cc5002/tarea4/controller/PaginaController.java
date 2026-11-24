package cl.uchile.cc5002.tarea4.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Entrega la página HTML del buscador (los datos se piden después con fetch). */
@Controller
public class PaginaController {

    @GetMapping("/")
    public String buscador() {
        return "buscador";
    }
}
