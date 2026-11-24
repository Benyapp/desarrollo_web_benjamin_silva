package cl.uchile.cc5002.tarea4.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cl.uchile.cc5002.tarea4.model.Avistamiento;
import cl.uchile.cc5002.tarea4.model.Nota;
import cl.uchile.cc5002.tarea4.repository.AvistamientoRepository;
import cl.uchile.cc5002.tarea4.repository.NotaRepository;
import cl.uchile.cc5002.tarea4.repository.ResumenNotas;

@Service
public class AvistamientoService {

    /** Largo máximo del texto a buscar (el nombre más largo de la base es de 255 caracteres). */
    public static final int LARGO_MAXIMO_BUSQUEDA = 100;
    /** Cantidad máxima de resultados que se devuelven por búsqueda. */
    public static final int MAXIMO_RESULTADOS = 50;

    private static final DateTimeFormatter FORMATO_DIA = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final AvistamientoRepository avistamientos;
    private final NotaRepository notas;

    public AvistamientoService(AvistamientoRepository avistamientos, NotaRepository notas) {
        this.avistamientos = avistamientos;
        this.notas = notas;
    }

    @Transactional(readOnly = true)
    public List<ResultadoBusqueda> buscar(String texto) {
        String limpio = texto == null ? "" : texto.strip();
        if (limpio.isEmpty()) {
            return List.of();
        }
        if (limpio.length() > LARGO_MAXIMO_BUSQUEDA) {
            limpio = limpio.substring(0, LARGO_MAXIMO_BUSQUEDA);
        }

        List<Avistamiento> encontrados =
                avistamientos.buscar(escaparLike(limpio), Pageable.ofSize(MAXIMO_RESULTADOS));
        if (encontrados.isEmpty()) {
            return List.of();
        }

        List<Integer> ids = encontrados.stream().map(Avistamiento::getId).toList();
        Map<Integer, ResumenNotas> resumenes = notas.resumenPorAvistamiento(ids).stream()
                .collect(Collectors.toMap(ResumenNotas::avistamientoId, Function.identity()));

        return encontrados.stream().map(a -> {
            ResumenNotas r = resumenes.get(a.getId());
            return new ResultadoBusqueda(
                    a.getId(),
                    a.getVoluntario().getNombre(),
                    a.getFechaHora().format(FORMATO_DIA),
                    a.getAve().getNombre(),
                    a.getVoluntario().getComuna().getNombre(),
                    r == null ? null : r.promedio(),
                    r == null ? 0 : r.cantidad());
        }).toList();
    }

    /**
     * Guarda una nueva nota para el avistamiento y devuelve el promedio recalculado.
     * La nota ya debe venir como entero; aquí se revisa que esté entre 1 y 7.
     */
    @Transactional
    public ResumenNotas agregarNota(Integer avistamientoId, int valor) {
        if (valor < Nota.MINIMA || valor > Nota.MAXIMA) {
            throw new NotaInvalidaException("La nota debe ser un número entero entre 1 y 7.");
        }
        Avistamiento avistamiento = avistamientos.findById(avistamientoId)
                .orElseThrow(() -> new AvistamientoNoEncontradoException(avistamientoId));

        notas.saveAndFlush(new Nota(avistamiento, valor));

        return notas.resumenPorAvistamiento(List.of(avistamientoId)).get(0);
    }

    /** Escapa los comodines de LIKE (% y _) para que se busquen como texto normal. */
    static String escaparLike(String texto) {
        return texto.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
