package cl.uchile.cc5002.tarea4.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.uchile.cc5002.tarea4.model.Avistamiento;

public interface AvistamientoRepository extends JpaRepository<Avistamiento, Integer> {

    /**
     * Avistamientos cuyo nombre de ave, nombre de voluntario o nombre de comuna (del voluntario)
     * contiene el patrón. El patrón debe venir con los comodines de LIKE ya escapados con '!'.
     * Se usa "join fetch" para traer ave, voluntario y comuna en la misma consulta.
     */
    @Query("""
            select a from Avistamiento a
              join fetch a.ave av
              join fetch a.voluntario v
              join fetch v.comuna c
            where lower(av.nombre) like lower(concat('%', :patron, '%')) escape '!'
               or lower(v.nombre) like lower(concat('%', :patron, '%')) escape '!'
               or lower(c.nombre) like lower(concat('%', :patron, '%')) escape '!'
            order by a.fechaHora desc, a.id desc
            """)
    List<Avistamiento> buscar(@Param("patron") String patron, Pageable pagina);
}
