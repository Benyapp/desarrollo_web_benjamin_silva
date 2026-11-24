package cl.uchile.cc5002.tarea4.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.uchile.cc5002.tarea4.model.Nota;

public interface NotaRepository extends JpaRepository<Nota, Integer> {

    /** Promedio y cantidad de notas de varios avistamientos (los que no tienen notas no aparecen). */
    @Query("""
            select new cl.uchile.cc5002.tarea4.repository.ResumenNotas(n.avistamiento.id, avg(n.nota), count(n))
            from Nota n
            where n.avistamiento.id in :ids
            group by n.avistamiento.id
            """)
    List<ResumenNotas> resumenPorAvistamiento(@Param("ids") Collection<Integer> ids);
}
