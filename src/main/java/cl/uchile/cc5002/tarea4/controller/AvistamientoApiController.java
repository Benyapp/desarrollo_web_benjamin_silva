package cl.uchile.cc5002.tarea4.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.fasterxml.jackson.databind.JsonNode;

import cl.uchile.cc5002.tarea4.repository.ResumenNotas;
import cl.uchile.cc5002.tarea4.service.AvistamientoNoEncontradoException;
import cl.uchile.cc5002.tarea4.service.AvistamientoService;
import cl.uchile.cc5002.tarea4.service.NotaInvalidaException;
import cl.uchile.cc5002.tarea4.service.ResultadoBusqueda;

/** URLs que el JavaScript del buscador llama con fetch. Todas responden JSON. */
@RestController
@RequestMapping("/api/avistamientos")
public class AvistamientoApiController {

    private final AvistamientoService servicio;

    public AvistamientoApiController(AvistamientoService servicio) {
        this.servicio = servicio;
    }

    /** GET /api/avistamientos/buscar?q=texto */
    @GetMapping("/buscar")
    public List<ResultadoBusqueda> buscar(@RequestParam(name = "q", defaultValue = "") String q) {
        return servicio.buscar(q);
    }

    /**
     * POST /api/avistamientos/{id}/notas con cuerpo JSON {"nota": 5}.
     * Se recibe el JSON "crudo" (JsonNode) para poder rechazar valores que Jackson convertiría
     * solo, como "5" (texto), 5.0 o 5.7 (decimales) o true.
     */
    @PostMapping("/{id}/notas")
    public ResponseEntity<Map<String, Object>> agregarNota(@PathVariable Integer id, @RequestBody JsonNode cuerpo) {
        JsonNode nota = cuerpo == null ? null : cuerpo.get("nota");
        if (nota == null || !nota.isInt()) {
            throw new NotaInvalidaException("La nota debe ser un número entero entre 1 y 7.");
        }
        ResumenNotas resumen = servicio.agregarNota(id, nota.intValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "avistamientoId", id,
                "promedio", resumen.promedio(),
                "cantidad", resumen.cantidad()));
    }

    @ExceptionHandler(NotaInvalidaException.class)
    public ResponseEntity<Map<String, String>> notaInvalida(NotaInvalidaException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> cuerpoInvalido() {
        return ResponseEntity.badRequest().body(Map.of("error", "La solicitud no tiene el formato esperado."));
    }

    @ExceptionHandler({AvistamientoNoEncontradoException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> noEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "El avistamiento no existe."));
    }
}
