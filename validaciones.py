# Validaciones del lado del servidor (mismas reglas que static/js/validaciones.js).
# Cada función retorna el mensaje de error, o "" si el valor es válido.
from datetime import date, datetime

import filetype

EXT_FOTO = {"jpg", "jpeg", "png", "gif", "webp"}
EXT_VIDEO = {"mp4", "webm", "mov"}
MAX_ARCHIVOS_POR_TIPO = 5
MAX_BYTES_FOTO = 5 * 1024 * 1024
MAX_BYTES_VIDEO = 30 * 1024 * 1024
ANIOS_MAX_ATRAS = 5


def validar_texto(valor, etiqueta, minimo=2, maximo=100):
    valor = (valor or "").strip()
    if len(valor) == 0:
        return etiqueta + " es obligatorio."
    if len(valor) < minimo:
        return etiqueta + " debe tener al menos " + str(minimo) + " caracteres."
    if len(valor) > maximo:
        return etiqueta + " no puede tener más de " + str(maximo) + " caracteres."
    for c in valor:
        if not (c.isalpha() or c in " '-"):
            return etiqueta + " solo puede contener letras, espacios y guiones."
    return ""


def validar_email(valor):
    valor = (valor or "").strip()
    if len(valor) == 0:
        return "El correo electrónico es obligatorio."
    if len(valor) > 80:
        return "El correo electrónico no puede tener más de 80 caracteres."
    if " " in valor:
        return "El correo electrónico no puede tener espacios."
    arroba = valor.find("@")
    ultimo_punto = valor.rfind(".")
    if arroba <= 0:
        return "El correo electrónico debe tener un @ precedido de texto."
    if arroba != valor.rfind("@"):
        return "El correo electrónico solo puede tener un @."
    if ultimo_punto < arroba + 2:
        return "El correo electrónico debe tener un dominio con punto, ej: correo.cl."
    if len(valor) - 1 - ultimo_punto < 2:
        return "La terminación del dominio debe tener al menos 2 letras."
    return ""


def normalizar_celular(valor):
    # retorna +569XXXXXXXX, o None si el formato no es válido
    limpio = "".join((valor or "").split())
    if limpio.startswith("+56"):
        limpio = limpio[3:]
    elif limpio.startswith("56"):
        limpio = limpio[2:]
    if len(limpio) != 9 or limpio[0] != "9" or not (limpio.isascii() and limpio.isdigit()):
        return None
    return "+56" + limpio


def validar_celular(valor):
    if not (valor or "").strip():
        return "El celular es obligatorio."
    if normalizar_celular(valor) is None:
        return "El celular debe tener formato chileno válido, ej: +56 9 1234 5678."
    return ""


def validar_fecha_hora(fecha_txt, hora_txt):
    # retorna (datetime o None, mensaje de fecha, mensaje de hora)
    msg_fecha = msg_hora = ""
    fecha = None
    hora = None

    if not fecha_txt:
        msg_fecha = "La fecha del avistamiento es obligatoria."
    else:
        try:
            fecha = datetime.strptime(fecha_txt, "%Y-%m-%d").date()
        except ValueError:
            msg_fecha = "La fecha del avistamiento no es válida."

    if not hora_txt:
        msg_hora = "La hora del avistamiento es obligatoria."
    elif len(hora_txt) != 5 or hora_txt[2] != ":":
        msg_hora = "La hora debe tener formato HH:MM."
    else:
        try:
            hora = datetime.strptime(hora_txt, "%H:%M").time()
        except ValueError:
            msg_hora = "La hora ingresada no es válida."

    if fecha and hora:
        momento = datetime.combine(fecha, hora)
        ahora = datetime.now()
        if momento > ahora:
            msg_fecha = "El avistamiento no puede estar en el futuro."
        elif fecha < date(ahora.year - ANIOS_MAX_ATRAS, ahora.month, min(ahora.day, 28)):
            msg_fecha = "La fecha del avistamiento no puede ser anterior a " + str(ANIOS_MAX_ATRAS) + " años atrás."
        else:
            return momento, "", ""
    return None, msg_fecha, msg_hora


def validar_descripcion(valor):
    if len((valor or "").strip()) > 500:
        return "La descripción no puede tener más de 500 caracteres."
    return ""


def _extension(nombre):
    return nombre.rsplit(".", 1)[1].lower() if "." in nombre else ""


def validar_archivo(archivo, tipo):
    # tipo es "foto" o "video"
    if tipo == "foto":
        permitidas, prefijo, limite = EXT_FOTO, "image/", MAX_BYTES_FOTO
    else:
        permitidas, prefijo, limite = EXT_VIDEO, "video/", MAX_BYTES_VIDEO

    nombre = archivo.filename
    if _extension(nombre) not in permitidas:
        return "«" + nombre + "»: extensión no permitida (use " + ", ".join(sorted(permitidas)) + ")."

    cabecera = archivo.stream.read(8192)
    archivo.stream.seek(0, 2)
    tamano = archivo.stream.tell()
    archivo.stream.seek(0)

    if tamano == 0:
        return "«" + nombre + "»: el archivo está vacío."
    if tamano > limite:
        return "«" + nombre + "»: supera el tamaño máximo de " + str(limite // (1024 * 1024)) + " MB."
    real = filetype.guess(cabecera)
    if real is None or not real.mime.startswith(prefijo):
        return "«" + nombre + "»: el contenido no corresponde a un archivo de " + tipo + " válido."
    return ""


def validar_evidencia(fotos, videos):
    # retorna la lista de mensajes de error
    errores = []
    if not fotos and not videos:
        return ["Debe adjuntar al menos una foto o un video como evidencia."]
    if len(fotos) > MAX_ARCHIVOS_POR_TIPO:
        errores.append("Puede adjuntar como máximo " + str(MAX_ARCHIVOS_POR_TIPO) + " fotos.")
    if len(videos) > MAX_ARCHIVOS_POR_TIPO:
        errores.append("Puede adjuntar como máximo " + str(MAX_ARCHIVOS_POR_TIPO) + " videos.")
    if errores:
        return errores
    for f in fotos:
        msg = validar_archivo(f, "foto")
        if msg:
            errores.append(msg)
    for v in videos:
        msg = validar_archivo(v, "video")
        if msg:
            errores.append(msg)
    return errores
