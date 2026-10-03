import os
import uuid
from datetime import datetime

from flask import Flask, abort, flash, redirect, render_template, request, url_for
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, joinedload
from werkzeug.utils import secure_filename

import validaciones as val
from models import Ave, Avistamiento, Comuna, Region, Registro, Voluntario

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4"
)
POR_PAGINA = 5

app = Flask(__name__)
app.secret_key = "cc5002-tarea2-clave-de-desarrollo"
app.config["MAX_CONTENT_LENGTH"] = 120 * 1024 * 1024
UPLOAD_DIR = os.path.join(app.static_folder, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def regiones_para_js(db):
    # regiones con sus comunas, para armar los select en JavaScript
    regiones = db.scalars(select(Region).options(joinedload(Region.comunas)).order_by(Region.id)).unique()
    return [
        {"id": r.id, "nombre": r.nombre.strip(), "comunas": [{"id": c.id, "nombre": c.nombre} for c in r.comunas]}
        for r in regiones
    ]


def a_entero(texto):
    try:
        return int(texto)
    except (TypeError, ValueError):
        return None


@app.route("/")
def inicio():
    with Session(engine) as db:
        ultimos = db.scalars(
            select(Avistamiento)
            .options(joinedload(Avistamiento.ave), joinedload(Avistamiento.voluntario), joinedload(Avistamiento.registros))
            .order_by(Avistamiento.id.desc())
            .limit(2)
        ).unique().all()
        return render_template("inicio.html", ultimos=ultimos)


@app.route("/voluntario", methods=["GET", "POST"])
def registrar_voluntario():
    errores = {}
    form = {"nombres": "", "apellidos": "", "email": "", "celular": "", "region": "", "comuna": ""}

    with Session(engine) as db:
        if request.method == "POST":
            for campo in form:
                form[campo] = request.form.get(campo, "").strip()

            errores["nombres"] = val.validar_texto(form["nombres"], "El nombre", 2, 100)
            errores["apellidos"] = val.validar_texto(form["apellidos"], "El apellido", 2, 100)
            errores["email"] = val.validar_email(form["email"])
            errores["celular"] = val.validar_celular(form["celular"])

            region_id = a_entero(form["region"])
            comuna_id = a_entero(form["comuna"])
            comuna = db.get(Comuna, comuna_id) if comuna_id is not None else None
            if region_id is None or db.get(Region, region_id) is None:
                errores["region"] = "Debe seleccionar una región."
            if comuna is None:
                errores["comuna"] = "Debe seleccionar una comuna."
            elif comuna.region_id != region_id:
                errores["comuna"] = "La comuna no pertenece a la región seleccionada."

            errores = {k: v for k, v in errores.items() if v}

            if not errores:
                voluntario = Voluntario(
                    nombre=form["nombres"] + " " + form["apellidos"],
                    email=form["email"],
                    telefono=val.normalizar_celular(form["celular"]),
                    fecha_registro=datetime.now(),
                    comuna_id=comuna.id,
                )
                try:
                    db.add(voluntario)
                    db.commit()
                    return redirect(url_for("voluntario_registrado", id=voluntario.id))
                except Exception as e:
                    app.logger.error("Error con base de datos: %s", e)
                    db.rollback()
                    errores["general"] = "No se pudo guardar el registro. Intente nuevamente."

        return render_template("registro.html", form=form, errores=errores, regiones=regiones_para_js(db))


@app.route("/voluntario/<int:id>/registrado")
def voluntario_registrado(id):
    with Session(engine) as db:
        voluntario = db.get(Voluntario, id)
        if voluntario is None:
            abort(404)
        return render_template("voluntario_registrado.html", voluntario=voluntario)


def guardar_archivos(archivos):
    # guarda los archivos con nombre aleatorio y retorna (ruta, nombre original)
    guardados = []
    for archivo in archivos:
        extension = archivo.filename.rsplit(".", 1)[1].lower()
        nombre_disco = uuid.uuid4().hex + "." + extension
        archivo.save(os.path.join(UPLOAD_DIR, nombre_disco))
        guardados.append(("uploads/" + nombre_disco, secure_filename(archivo.filename) or nombre_disco))
    return guardados


@app.route("/avistamiento/nuevo", methods=["GET", "POST"])
def registrar_avistamiento():
    errores = {}
    form = {"voluntario": request.args.get("voluntario", ""), "ave": "", "lugar": "", "fecha": "", "hora": "", "descripcion": ""}

    with Session(engine) as db:
        if request.method == "POST":
            for campo in form:
                form[campo] = request.form.get(campo, "").strip()

            voluntario_id = a_entero(form["voluntario"])
            ave_id = a_entero(form["ave"])
            if voluntario_id is None or db.get(Voluntario, voluntario_id) is None:
                errores["voluntario"] = "Debe seleccionar un voluntario."
            if ave_id is None or db.get(Ave, ave_id) is None:
                errores["ave"] = "Debe seleccionar un ave."

            if len(form["lugar"]) == 0:
                errores["lugar"] = "El lugar es obligatorio."
            elif len(form["lugar"]) < 2 or len(form["lugar"]) > 200:
                errores["lugar"] = "El lugar debe tener entre 2 y 200 caracteres."

            momento, errores["fecha"], errores["hora"] = val.validar_fecha_hora(form["fecha"], form["hora"])
            errores["descripcion"] = val.validar_descripcion(form["descripcion"])

            fotos = [f for f in request.files.getlist("fotos") if f.filename]
            videos = [f for f in request.files.getlist("videos") if f.filename]
            msgs_evidencia = val.validar_evidencia(fotos, videos)
            if msgs_evidencia:
                errores["evidencia"] = " ".join(msgs_evidencia)

            errores = {k: v for k, v in errores.items() if v}

            if not errores:
                guardados = []
                try:
                    guardados = guardar_archivos(fotos + videos)
                    avistamiento = Avistamiento(
                        voluntario_id=voluntario_id,
                        ave_id=ave_id,
                        fecha_hora=momento,
                        lugar=form["lugar"],
                        descripcion=form["descripcion"] or None,
                    )
                    db.add(avistamiento)
                    db.flush()
                    for ruta, nombre in guardados:
                        db.add(Registro(ruta_archivo=ruta, nombre_archivo=nombre, avistamiento_id=avistamiento.id))
                    db.commit()
                    flash("¡Avistamiento registrado correctamente! Gracias por tu aporte.", "exito")
                    return redirect(url_for("inicio"))
                except Exception as e:
                    app.logger.error("Error al guardar avistamiento: %s", e)
                    db.rollback()
                    for ruta, _ in guardados:
                        try:
                            os.remove(os.path.join(app.static_folder, ruta))
                        except OSError:
                            pass
                    errores["general"] = "No se pudo guardar el avistamiento. Intente nuevamente."

        voluntarios = db.scalars(select(Voluntario).order_by(Voluntario.nombre)).all()
        aves = db.scalars(select(Ave).order_by(Ave.nombre)).all()
        return render_template("avistamiento_form.html", form=form, errores=errores, voluntarios=voluntarios, aves=aves)


@app.route("/avistamiento/<int:id>")
def detalle_avistamiento(id):
    with Session(engine) as db:
        avistamiento = db.scalars(
            select(Avistamiento)
            .options(
                joinedload(Avistamiento.ave),
                joinedload(Avistamiento.voluntario).joinedload(Voluntario.comuna).joinedload(Comuna.region),
                joinedload(Avistamiento.registros),
            )
            .where(Avistamiento.id == id)
        ).unique().first()
        if avistamiento is None:
            abort(404)
        fotos = [r for r in avistamiento.registros if r.ruta_archivo.rsplit(".", 1)[-1] in val.EXT_FOTO]
        videos = [r for r in avistamiento.registros if r.ruta_archivo.rsplit(".", 1)[-1] in val.EXT_VIDEO]
        return render_template("avistamiento_detalle.html", a=avistamiento, fotos=fotos, videos=videos)


@app.route("/avistamientos")
def listado_avistamientos():
    pagina = a_entero(request.args.get("pagina")) or 1
    with Session(engine) as db:
        total = db.scalar(select(func.count(Avistamiento.id)))
        total_paginas = max(1, -(-total // POR_PAGINA))
        pagina = min(max(pagina, 1), total_paginas)
        avistamientos = db.scalars(
            select(Avistamiento)
            .options(joinedload(Avistamiento.ave), joinedload(Avistamiento.voluntario), joinedload(Avistamiento.registros))
            .order_by(Avistamiento.fecha_hora.desc(), Avistamiento.id.desc())
            .offset((pagina - 1) * POR_PAGINA)
            .limit(POR_PAGINA)
        ).unique().all()
        return render_template(
            "listado.html", avistamientos=avistamientos, pagina=pagina, total_paginas=total_paginas, total=total
        )


@app.route("/estadisticas")
def estadisticas():
    return render_template("estadisticas.html")


@app.errorhandler(404)
def no_encontrado(e):
    return render_template("error.html", titulo="Página no encontrada", mensaje="El recurso solicitado no existe."), 404


@app.errorhandler(413)
def archivo_muy_grande(e):
    return render_template("error.html", titulo="Archivos demasiado grandes", mensaje="El tamaño total de los archivos supera el máximo permitido."), 413


if __name__ == "__main__":
    app.run(debug=True)
