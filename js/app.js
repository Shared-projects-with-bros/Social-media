// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var selectEtiquetaPublicar = document.getElementById("etiquetaPublicar");
var btnDescartarBorrador = document.getElementById("btnDescartarBorrador");
var lista = document.getElementById("listaPublicaciones");
var inputBuscar = document.getElementById("buscar");
var selectOrden = document.getElementById("ordenar");
var selectFiltroEtiqueta = document.getElementById("filtroEtiqueta");
var checkSoloFavoritas = document.getElementById("soloFavoritas");
var btnBuscar = document.getElementById("btnBuscar");
var contenedorPaginacion = document.getElementById("controlesPaginacion");
var elementoResumenPublicaciones = document.getElementById("resumenPublicaciones");
var elementoResumenReacciones = document.getElementById("resumenReacciones");
var elementoResumenComentarios = document.getElementById("resumenComentarios");
var elementoContadorMensaje = document.getElementById("contadorMensaje");
var btnExportar = document.getElementById("btnExportar");
var btnImportar = document.getElementById("btnImportar");
var inputImportar = document.getElementById("inputImportar");
var listaModeracion = document.getElementById("listaModeracion");

var CLAVE_STORAGE = "publicaciones";
var CLAVE_LIKES_USUARIO = "likesUsuario";
var CLAVE_REACCIONES_USUARIO = "reaccionesUsuario";
var CLAVE_BORRADOR = "borrador";
var COLORES_AVATAR = ["#1877f2", "#e91e63", "#00a884", "#f5a623", "#8e44ad", "#e67e22", "#16a085", "#c0392b"];
var LIMITE_MENSAJE = 200;
var TAMANO_PAGINA = 5;
var ETIQUETAS = ["General", "Estudio", "Evento", "Ayuda"];
var COLORES_ETIQUETA = { General: "secondary", Estudio: "primary", Evento: "success", Ayuda: "warning" };
var MOTIVOS_REPORTE = ["Spam", "Ofensivo", "Otro"];
var TIPOS_REACCION = [
  { clave: "meGusta", emoji: "👍", etiqueta: "Me gusta", color: "primary" },
  { clave: "meEncanta", emoji: "🥰", etiqueta: "Me encanta", color: "danger" },
  { clave: "meDivierte", emoji: "😂", etiqueta: "Me divierte", color: "warning" }
];

var paginaActual = 1;

//Se genera un id único (marca de tiempo + número aleatorio) para publicaciones, comentarios y respuestas
function generarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

//Se lee, por publicación, qué reacción eligió este usuario (si eligió alguna)
function obtenerReaccionesUsuario() {
  var datos = localStorage.getItem(CLAVE_REACCIONES_USUARIO);
  if (datos) {
    return JSON.parse(datos);
  }

  //Se migran los "me gusta" del sistema anterior a la nueva estructura de reacciones
  var reaccionesUsuario = {};
  var datosAntiguos = localStorage.getItem(CLAVE_LIKES_USUARIO);
  if (datosAntiguos) {
    JSON.parse(datosAntiguos).forEach(function (idPublicacion) {
      reaccionesUsuario[idPublicacion] = "meGusta";
    });
    localStorage.removeItem(CLAVE_LIKES_USUARIO);
    guardarReaccionesUsuario(reaccionesUsuario);
  }

  return reaccionesUsuario;
}

//Se guarda, por publicación, qué reacción eligió este usuario
function guardarReaccionesUsuario(reaccionesUsuario) {
  localStorage.setItem(CLAVE_REACCIONES_USUARIO, JSON.stringify(reaccionesUsuario));
}

//Se leen las publicaciones guardadas en LocalStorage
function obtenerPublicaciones() {
  var datos = localStorage.getItem(CLAVE_STORAGE);
  var publicaciones = datos ? JSON.parse(datos) : [];
  var seMigraronDatos = false;

  publicaciones.forEach(function (publicacion) {
    //Las publicaciones antiguas todavía no tienen la propiedad "comentarios"
    if (!publicacion.comentarios) {
      publicacion.comentarios = [];
      seMigraronDatos = true;
    }

    //Los comentarios antiguos todavía no tienen un id único ni la propiedad "respuestas"
    publicacion.comentarios.forEach(function (comentario) {
      if (!comentario.id) {
        comentario.id = generarId();
        seMigraronDatos = true;
      }
      if (!comentario.respuestas) {
        comentario.respuestas = [];
        seMigraronDatos = true;
      }
      comentario.respuestas.forEach(function (respuesta) {
        if (!respuesta.id) {
          respuesta.id = generarId();
          seMigraronDatos = true;
        }
      });
    });

    //Las publicaciones antiguas solo tenían un contador simple de "likes"
    if (!publicacion.reacciones) {
      publicacion.reacciones = {
        meGusta: publicacion.likes || 0,
        meEncanta: 0,
        meDivierte: 0
      };
      delete publicacion.likes;
      seMigraronDatos = true;
    } else {
      TIPOS_REACCION.forEach(function (tipo) {
        if (typeof publicacion.reacciones[tipo.clave] !== "number") {
          publicacion.reacciones[tipo.clave] = 0;
          seMigraronDatos = true;
        }
      });
    }

    //Las publicaciones antiguas no tienen etiqueta: se consideran "General"
    if (!publicacion.etiqueta || ETIQUETAS.indexOf(publicacion.etiqueta) === -1) {
      publicacion.etiqueta = "General";
      seMigraronDatos = true;
    }

    //Las publicaciones antiguas no tienen estado de favorito: se consideran no favoritas
    if (typeof publicacion.favorito !== "boolean") {
      publicacion.favorito = false;
      seMigraronDatos = true;
    }

    //Las publicaciones antiguas no tienen estado de reporte: se consideran no reportadas
    if (typeof publicacion.reporte === "undefined") {
      publicacion.reporte = null;
      seMigraronDatos = true;
    }
  });

  //Se guarda la migración para que los ids, reacciones, etiquetas, favoritos y reportes queden estables entre recargas
  if (seMigraronDatos) {
    guardarPublicaciones(publicaciones);
  }

  return publicaciones;
}

//Se guarda el arreglo de publicaciones en LocalStorage
function guardarPublicaciones(publicaciones) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(publicaciones));
}

//Se completa con un cero a la izquierda si el número es menor a 10
function conCeroIzquierda(numero) {
  return String(numero).padStart(2, "0");
}

//Se arma el texto de fecha y hora a partir del momento en que se creó la publicación
function formatearFechaHora(marcaDeTiempo) {
  var fecha = new Date(marcaDeTiempo);
  var fechaTexto = conCeroIzquierda(fecha.getDate()) + "/" + conCeroIzquierda(fecha.getMonth() + 1) + "/" + fecha.getFullYear();
  var horaTexto = conCeroIzquierda(fecha.getHours()) + ":" + conCeroIzquierda(fecha.getMinutes());
  return fechaTexto + " " + horaTexto;
}

//Se actualiza el texto que indica cuántos caracteres quedan disponibles
function actualizarContadorCaracteres(elementoContador, longitudTexto) {
  var restantes = LIMITE_MENSAJE - longitudTexto;
  elementoContador.textContent = restantes + " caracteres restantes";
}

//Se obtiene la inicial del nombre para mostrarla en el avatar
function obtenerInicial(nombre) {
  return nombre.trim().charAt(0).toUpperCase();
}

//Se elige un color de avatar según el nombre, para que cada autor se vea distinto
function obtenerColorAvatar(nombre) {
  var suma = 0;
  for (var i = 0; i < nombre.length; i++) {
    suma += nombre.charCodeAt(i);
  }
  return COLORES_AVATAR[suma % COLORES_AVATAR.length];
}

//Se suman las tres reacciones de una publicación
function totalReaccionesPublicacion(publicacion) {
  var reacciones = publicacion.reacciones || { meGusta: 0, meEncanta: 0, meDivierte: 0 };
  return reacciones.meGusta + reacciones.meEncanta + reacciones.meDivierte;
}

//Se busca primero la publicación y luego, dentro de ella, el comentario (nunca por texto o posición)
function localizarComentario(publicaciones, idPublicacion, idComentario) {
  var publicacion = publicaciones.find(function (p) {
    return p.id === idPublicacion;
  });
  var comentario = publicacion && publicacion.comentarios.find(function (c) {
    return c.id === idComentario;
  });
  return { publicacion: publicacion, comentario: comentario };
}

//Se arma el HTML de los botones de reacción de una publicación
function crearHtmlReacciones(publicacion, reaccionElegida) {
  return TIPOS_REACCION.map(function (tipo) {
    var cantidad = publicacion.reacciones[tipo.clave];
    var claseColor = reaccionElegida === tipo.clave ? ("btn-" + tipo.color) : ("btn-outline-" + tipo.color);
    return '<button type="button" class="btn btn-sm ' + claseColor + ' btn-reaccion" data-tipo="' + tipo.clave + '">' +
      tipo.emoji + " " + tipo.etiqueta +
      ' <span class="badge rounded-pill text-bg-light">' + cantidad + "</span>" +
      "</button>";
  }).join(" ");
}

//Se arma el HTML de una respuesta a un comentario
function crearHtmlRespuesta(respuesta) {
  return '<div class="respuesta">' +
    '<strong class="respuesta-autor">' + respuesta.autor + "</strong> " +
    '<span class="respuesta-fecha">' + formatearFechaHora(respuesta.fecha) + "</span>" +
    '<p class="respuesta-texto">' + respuesta.texto + "</p>" +
    "</div>";
}

//Se arma el HTML con las respuestas de un comentario
function crearHtmlListaRespuestas(respuestas) {
  return respuestas.map(crearHtmlRespuesta).join("");
}

//Se arma el HTML de la vista (no edición) de un comentario
function construirVistaComentario(comentario) {
  return '<strong class="comentario-autor">' + comentario.autor + "</strong> " +
    '<span class="comentario-fecha">' + formatearFechaHora(comentario.fecha) + "</span>" +
    '<p class="comentario-texto">' + comentario.texto + "</p>" +
    '<div class="comentario-acciones">' +
    '<button type="button" class="btn btn-sm btn-link p-0 me-3 btn-editar-comentario">Editar</button>' +
    '<button type="button" class="btn btn-sm btn-link p-0 me-3 text-danger btn-eliminar-comentario">Eliminar</button>' +
    '<button type="button" class="btn btn-sm btn-link p-0 btn-responder-comentario">Responder</button>' +
    "</div>";
}

//Se arma el HTML de un comentario completo, incluidas sus respuestas
function crearHtmlComentario(comentario) {
  return '<div class="comentario" data-id="' + comentario.id + '">' +
    '<div class="comentario-vista">' + construirVistaComentario(comentario) + "</div>" +
    '<div class="respuestas-contenedor">' +
    '<div class="lista-respuestas">' + crearHtmlListaRespuestas(comentario.respuestas) + "</div>" +
    '<form class="form-respuesta d-none">' +
    '<div class="row g-2 mt-1">' +
    '<div class="col-12 col-sm-4">' +
    '<input type="text" class="form-control form-control-sm input-nombre-respuesta" placeholder="Tu nombre">' +
    "</div>" +
    '<div class="col-12 col-sm-6">' +
    '<input type="text" class="form-control form-control-sm input-texto-respuesta" placeholder="Escribe una respuesta">' +
    "</div>" +
    '<div class="col-12 col-sm-2 d-grid">' +
    '<button type="submit" class="btn btn-sm btn-outline-primary">Enviar</button>' +
    "</div>" +
    "</div>" +
    "</form>" +
    "</div>" +
    "</div>";
}

//Se arma el HTML con la lista de comentarios de una publicación
function crearHtmlListaComentarios(comentarios) {
  if (comentarios.length === 0) {
    return '<p class="sin-comentarios">Sin comentarios todavía.</p>';
  }
  return comentarios.map(crearHtmlComentario).join("");
}

//Se arma el HTML de una publicación reportada dentro de la vista de Moderación
function crearHtmlReporteModeracion(publicacion) {
  return '<div class="reporte-moderacion border rounded p-2 mb-2" data-id="' + publicacion.id + '">' +
    '<div><strong>' + publicacion.nombre + "</strong> " +
    '<span class="badge text-bg-dark">' + publicacion.reporte.motivo + "</span>" +
    '<p class="mb-1 small text-muted">' + publicacion.mensaje + "</p>" +
    '<span class="text-muted small">Reportada el ' + formatearFechaHora(publicacion.reporte.fecha) + "</span>" +
    "</div>" +
    '<div class="mt-2">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-descartar-reporte">Descartar reporte</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-desde-moderacion">Eliminar publicación</button>' +
    "</div>" +
    "</div>";
}

//Se muestra en el modal de Moderación la lista de publicaciones reportadas, a partir del arreglo completo
function renderizarModeracion(publicaciones) {
  var reportadas = publicaciones.filter(function (publicacion) {
    return publicacion.reporte;
  });

  if (reportadas.length === 0) {
    listaModeracion.innerHTML = '<p class="text-muted mb-0">No hay publicaciones reportadas.</p>';
    return;
  }

  listaModeracion.innerHTML = reportadas.map(crearHtmlReporteModeracion).join("");
}

//Se crea los elementos del HTML de una publicación
function crearElementoPublicacion(publicacion) {
  var elemento = document.createElement("div");
  elemento.className = "publicacion card shadow-sm border-0 mb-3";
  elemento.dataset.id = publicacion.id;
  var reaccionElegida = obtenerReaccionesUsuario()[publicacion.id];
  elemento.innerHTML =
    '<div class="card-body">' +
    '<div class="d-flex align-items-start justify-content-between mb-2">' +
    '<div class="d-flex align-items-center">' +
    '<div class="avatar-circulo me-2" style="background-color: ' + obtenerColorAvatar(publicacion.nombre) + ';">' + obtenerInicial(publicacion.nombre) + "</div>" +
    "<div>" +
    '<h2 class="h6 mb-0">' + publicacion.nombre +
    ' <span class="badge text-bg-' + (COLORES_ETIQUETA[publicacion.etiqueta] || "secondary") + ' etiqueta-badge">' + publicacion.etiqueta + "</span>" +
    (publicacion.reporte ? ' <span class="badge text-bg-dark reportada-badge">🚩 Reportada</span>' : "") +
    "</h2>" +
    '<span class="text-muted small fecha-hora">' + formatearFechaHora(publicacion.fecha || publicacion.id) + "</span>" +
    "</div>" +
    "</div>" +
    '<button type="button" class="btn btn-sm btn-link p-0 btn-favorito ' + (publicacion.favorito ? "text-warning" : "text-muted") + '" title="' + (publicacion.favorito ? "Quitar de favoritos" : "Marcar como favorita") + '">' + (publicacion.favorito ? "★" : "☆") + "</button>" +
    "</div>" +
    '<div class="mensaje-contenedor"><p class="texto-mensaje"><span class="mensaje-texto">' + publicacion.mensaje + "</span></p></div>" +
    '<div class="acciones d-flex flex-wrap align-items-center gap-2 border-top mt-3 pt-2">' +
    crearHtmlReacciones(publicacion, reaccionElegida) +
    ' <button type="button" class="btn btn-sm btn-outline-secondary btn-editar">Editar</button>' +
    ' <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>' +
    (publicacion.reporte ?
      ' <span class="btn btn-sm btn-outline-dark disabled">🚩 Reportada</span>' :
      ' <button type="button" class="btn btn-sm btn-outline-dark btn-reportar">🚩 Reportar</button>') +
    "</div>" +
    '<div class="reporte-contenedor">' +
    '<form class="form-reporte d-none row g-2 mt-2">' +
    '<div class="col-8 col-sm-6">' +
    '<select class="form-select form-select-sm select-motivo-reporte">' +
    MOTIVOS_REPORTE.map(function (motivo) { return '<option value="' + motivo + '">' + motivo + "</option>"; }).join("") +
    "</select>" +
    "</div>" +
    '<div class="col-4 col-sm-3 d-grid">' +
    '<button type="submit" class="btn btn-sm btn-dark">Enviar</button>' +
    "</div>" +
    '<div class="col-12 col-sm-3 d-grid">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-cancelar-reporte">Cancelar</button>' +
    "</div>" +
    "</form>" +
    "</div>" +
    '<div class="comentarios-contenedor">' +
    '<h3 class="h6 mt-3">Comentarios</h3>' +
    '<div class="lista-comentarios">' + crearHtmlListaComentarios(publicacion.comentarios) + "</div>" +
    '<form class="form-comentario mt-2 row g-2">' +
    '<div class="col-12 col-sm-4">' +
    '<input type="text" class="form-control form-control-sm input-nombre-comentario" placeholder="Tu nombre">' +
    "</div>" +
    '<div class="col-12 col-sm-6">' +
    '<input type="text" class="form-control form-control-sm input-texto-comentario" placeholder="Escribe un comentario">' +
    "</div>" +
    '<div class="col-12 col-sm-2 d-grid">' +
    '<button type="submit" class="btn btn-sm btn-outline-primary">Comentar</button>' +
    "</div>" +
    "</form>" +
    "</div>" +
    "</div>";
  return elemento;
}

//Se reemplaza el mensaje por un textarea para poder editarlo
function entrarModoEdicion(elementoPublicacion, publicacion) {
  var contenedorMensaje = elementoPublicacion.querySelector(".mensaje-contenedor");
  contenedorMensaje.innerHTML = "";

  var textarea = document.createElement("textarea");
  textarea.className = "form-control textarea-edicion";
  textarea.rows = 3;
  textarea.maxLength = LIMITE_MENSAJE;
  textarea.value = publicacion.mensaje;

  var contadorEdicion = document.createElement("div");
  contadorEdicion.className = "form-text text-end contador-edicion";
  actualizarContadorCaracteres(contadorEdicion, publicacion.mensaje.length);

  textarea.addEventListener("input", function () {
    actualizarContadorCaracteres(contadorEdicion, textarea.value.length);
  });

  var contenedorBotones = document.createElement("div");
  contenedorBotones.className = "mt-2";
  contenedorBotones.innerHTML =
    '<button type="button" class="btn btn-sm btn-primary btn-guardar-edicion">Guardar</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-cancelar-edicion">Cancelar</button>';

  contenedorMensaje.appendChild(textarea);
  contenedorMensaje.appendChild(contadorEdicion);
  contenedorMensaje.appendChild(contenedorBotones);
  elementoPublicacion.querySelector(".acciones").style.display = "none";
  textarea.focus();
}

//Se vuelve a mostrar el mensaje (guardado o el original si se cancela)
function salirModoEdicion(elementoPublicacion, publicacion) {
  var contenedorMensaje = elementoPublicacion.querySelector(".mensaje-contenedor");
  contenedorMensaje.innerHTML =
    '<p class="texto-mensaje"><span class="mensaje-texto">' + publicacion.mensaje + "</span></p>";
  elementoPublicacion.querySelector(".acciones").style.display = "";
}

//Se reemplaza el texto de un comentario por un textarea para poder editarlo
function entrarModoEdicionComentario(elementoComentario, comentario) {
  var vista = elementoComentario.querySelector(".comentario-vista");
  vista.innerHTML =
    '<textarea class="form-control form-control-sm textarea-edicion-comentario" rows="2">' + comentario.texto + "</textarea>" +
    '<div class="mt-2">' +
    '<button type="button" class="btn btn-sm btn-primary btn-guardar-comentario">Guardar</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-cancelar-comentario">Cancelar</button>' +
    "</div>";
  vista.querySelector("textarea").focus();
}

//Se vuelve a mostrar el comentario (guardado o el original si se cancela)
function salirModoEdicionComentario(elementoComentario, comentario) {
  elementoComentario.querySelector(".comentario-vista").innerHTML = construirVistaComentario(comentario);
}

//Se revisa si una publicación coincide con el texto buscado (nombre o mensaje, sin distinguir mayúsculas)
function coincideBusqueda(publicacion, texto) {
  return publicacion.nombre.toLowerCase().indexOf(texto) !== -1 ||
    publicacion.mensaje.toLowerCase().indexOf(texto) !== -1;
}

//Se filtran las publicaciones según el texto de búsqueda, sin modificar el arreglo original
function obtenerPublicacionesFiltradas(publicaciones) {
  var texto = inputBuscar.value.trim().toLowerCase();
  if (texto === "") {
    return publicaciones;
  }
  return publicaciones.filter(function (publicacion) {
    return coincideBusqueda(publicacion, texto);
  });
}

//Se filtran las publicaciones según la etiqueta elegida, sin modificar el arreglo original
function obtenerPublicacionesPorEtiqueta(publicaciones) {
  var etiqueta = selectFiltroEtiqueta.value;
  if (etiqueta === "todas") {
    return publicaciones;
  }
  return publicaciones.filter(function (publicacion) {
    return publicacion.etiqueta === etiqueta;
  });
}

//Se filtran las publicaciones favoritas si el usuario activó ese filtro
function obtenerPublicacionesFavoritas(publicaciones) {
  if (!checkSoloFavoritas.checked) {
    return publicaciones;
  }
  return publicaciones.filter(function (publicacion) {
    return publicacion.favorito;
  });
}

//Se ordena una copia de las publicaciones según el criterio elegido, sin alterar el arreglo original
function ordenarPublicaciones(publicaciones) {
  var copia = publicaciones.slice();
  var criterio = selectOrden.value;

  if (criterio === "antiguas") {
    copia.sort(function (a, b) {
      return (a.fecha || a.id) - (b.fecha || b.id);
    });
  } else if (criterio === "populares") {
    copia.sort(function (a, b) {
      return totalReaccionesPublicacion(b) - totalReaccionesPublicacion(a);
    });
  } else {
    copia.sort(function (a, b) {
      return (b.fecha || b.id) - (a.fecha || a.id);
    });
  }

  return copia;
}

//Se calcula y muestra el resumen de actividad a partir del arreglo completo de publicaciones
function actualizarResumen(publicaciones) {
  var totalReacciones = publicaciones.reduce(function (total, publicacion) {
    return total + totalReaccionesPublicacion(publicacion);
  }, 0);
  var totalComentarios = publicaciones.reduce(function (total, publicacion) {
    return total + publicacion.comentarios.length;
  }, 0);

  elementoResumenPublicaciones.textContent = publicaciones.length;
  elementoResumenReacciones.textContent = totalReacciones;
  elementoResumenComentarios.textContent = totalComentarios;
}

//Se dibujan los controles de "Anterior / Página X de Y / Siguiente"
function renderizarControlesPaginacion(totalPaginas) {
  contenedorPaginacion.innerHTML =
    '<button type="button" id="btnPaginaAnterior" class="btn btn-sm btn-outline-secondary"' + (paginaActual === 1 ? " disabled" : "") + '>« Anterior</button>' +
    '<span class="mx-3 text-muted small">Página ' + paginaActual + " de " + totalPaginas + "</span>" +
    '<button type="button" id="btnPaginaSiguiente" class="btn btn-sm btn-outline-secondary"' + (paginaActual === totalPaginas ? " disabled" : "") + ">Siguiente »</button>";
}

//Se muestra en pantalla la página actual de publicaciones, aplicando filtros, búsqueda y orden vigentes
function renderizarLista() {
  var publicaciones = obtenerPublicaciones();
  actualizarResumen(publicaciones);
  renderizarModeracion(publicaciones);

  lista.innerHTML = "";
  contenedorPaginacion.innerHTML = "";

  if (publicaciones.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mensaje-sin-resultados">Todavía no hay publicaciones. ¡Sé el primero en publicar algo!</p>';
    return;
  }

  var resultado = obtenerPublicacionesPorEtiqueta(publicaciones);
  resultado = obtenerPublicacionesFavoritas(resultado);
  resultado = obtenerPublicacionesFiltradas(resultado);
  resultado = ordenarPublicaciones(resultado);

  if (resultado.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mensaje-sin-resultados">No se encontraron publicaciones que coincidan con los filtros aplicados.</p>';
    return;
  }

  var totalPaginas = Math.max(1, Math.ceil(resultado.length / TAMANO_PAGINA));
  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
  }
  if (paginaActual < 1) {
    paginaActual = 1;
  }

  var inicio = (paginaActual - 1) * TAMANO_PAGINA;
  var publicacionesPagina = resultado.slice(inicio, inicio + TAMANO_PAGINA);

  publicacionesPagina.forEach(function (publicacion) {
    lista.appendChild(crearElementoPublicacion(publicacion));
  });

  renderizarControlesPaginacion(totalPaginas);
}

//Se vuelve a la primera página cuando cambia un filtro, la búsqueda o el orden
function reiniciarPaginaYRenderizar() {
  paginaActual = 1;
  renderizarLista();
}

//Se guarda automáticamente lo que el usuario está escribiendo, como borrador
function guardarBorrador() {
  var nombre = inputNombre.value;
  var mensaje = inputMensaje.value;

  if (nombre.trim() === "" && mensaje.trim() === "") {
    localStorage.removeItem(CLAVE_BORRADOR);
    return;
  }

  localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({
    nombre: nombre,
    mensaje: mensaje,
    etiqueta: selectEtiquetaPublicar.value
  }));
}

//Se recupera el borrador guardado (si existe) al cargar la página
function cargarBorrador() {
  var datos = localStorage.getItem(CLAVE_BORRADOR);
  if (!datos) {
    return;
  }

  var borrador = JSON.parse(datos);
  inputNombre.value = borrador.nombre || "";
  inputMensaje.value = borrador.mensaje || "";
  if (borrador.etiqueta && ETIQUETAS.indexOf(borrador.etiqueta) !== -1) {
    selectEtiquetaPublicar.value = borrador.etiqueta;
  }
  actualizarContadorCaracteres(elementoContadorMensaje, inputMensaje.value.length);
}

//Se descarta el borrador y se limpia el formulario
function descartarBorrador() {
  localStorage.removeItem(CLAVE_BORRADOR);
  inputNombre.value = "";
  inputMensaje.value = "";
  selectEtiquetaPublicar.value = "General";
  actualizarContadorCaracteres(elementoContadorMensaje, 0);
}

//Se valida que un archivo importado tenga la estructura mínima de un respaldo de publicaciones
function validarRespaldo(datos) {
  if (!Array.isArray(datos)) {
    return false;
  }
  return datos.every(function (publicacion) {
    return publicacion &&
      typeof publicacion.id !== "undefined" &&
      typeof publicacion.nombre === "string" &&
      typeof publicacion.mensaje === "string";
  });
}

//Al cargar la página, recuperamos el borrador (si hay) y mostramos las publicaciones guardadas
cargarBorrador();
renderizarLista();

//Se actualiza el contador de caracteres y se guarda el borrador mientras se escribe el mensaje
inputMensaje.addEventListener("input", function () {
  actualizarContadorCaracteres(elementoContadorMensaje, inputMensaje.value.length);
  guardarBorrador();
});

//Se guarda el borrador también al escribir el nombre o cambiar el tema
inputNombre.addEventListener("input", guardarBorrador);
selectEtiquetaPublicar.addEventListener("change", guardarBorrador);

//Se descarta el borrador al presionar el botón correspondiente
btnDescartarBorrador.addEventListener("click", descartarBorrador);

//Se escucha cuando el usuario presiona "Publicar"
formulario.addEventListener("submit", function (evento) {
  // Evitamos que la página se recargue
  evento.preventDefault();

  var nombre = inputNombre.value.trim();
  var mensaje = inputMensaje.value.trim();

  //El nombre y el mensaje son obligatorios
  if (nombre === "" || mensaje === "") {
    alert("El nombre y el mensaje son obligatorios.");
    return;
  }

  //El mensaje no puede superar el límite de caracteres
  if (mensaje.length > LIMITE_MENSAJE) {
    alert("El mensaje no puede superar los " + LIMITE_MENSAJE + " caracteres.");
    return;
  }

  var publicacion = {
    id: generarId(),
    nombre: nombre,
    mensaje: mensaje,
    etiqueta: selectEtiquetaPublicar.value,
    favorito: false,
    reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
    fecha: Date.now(),
    comentarios: []
  };

  //Las publicaciones nuevas aparecen primero
  var publicaciones = obtenerPublicaciones();
  publicaciones.unshift(publicacion);
  guardarPublicaciones(publicaciones);

  //Al publicar con éxito, el borrador ya no es necesario
  localStorage.removeItem(CLAVE_BORRADOR);

  reiniciarPaginaYRenderizar();

  //Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
  selectEtiquetaPublicar.value = "General";
  actualizarContadorCaracteres(elementoContadorMensaje, 0);
});

//Se escucha los clics en la lista: publicaciones (eliminar, editar, reaccionar, favorito) y comentarios (editar, eliminar, responder)
lista.addEventListener("click", function (evento) {
  if (evento.target.classList.contains("btn-eliminar")) {
    var elementoEliminar = evento.target.closest(".publicacion");
    var idEliminar = Number(elementoEliminar.dataset.id);

    var confirmado = confirm("¿Seguro que deseas eliminar esta publicación?");
    if (!confirmado) {
      return;
    }

    var publicaciones = obtenerPublicaciones().filter(function (publicacion) {
      return publicacion.id !== idEliminar;
    });
    guardarPublicaciones(publicaciones);

    renderizarLista();
    return;
  }

  if (evento.target.classList.contains("btn-editar")) {
    var elementoEditar = evento.target.closest(".publicacion");
    var idEditar = Number(elementoEditar.dataset.id);
    var publicacionEditar = obtenerPublicaciones().find(function (p) {
      return p.id === idEditar;
    });

    if (publicacionEditar) {
      entrarModoEdicion(elementoEditar, publicacionEditar);
    }
    return;
  }

  if (evento.target.classList.contains("btn-cancelar-edicion")) {
    var elementoCancelar = evento.target.closest(".publicacion");
    var idCancelar = Number(elementoCancelar.dataset.id);
    var publicacionCancelar = obtenerPublicaciones().find(function (p) {
      return p.id === idCancelar;
    });

    if (publicacionCancelar) {
      salirModoEdicion(elementoCancelar, publicacionCancelar);
    }
    return;
  }

  if (evento.target.classList.contains("btn-guardar-edicion")) {
    var elementoGuardar = evento.target.closest(".publicacion");
    var idGuardar = Number(elementoGuardar.dataset.id);
    var nuevoMensaje = elementoGuardar.querySelector(".textarea-edicion").value.trim();

    //El mensaje no puede quedar vacío
    if (nuevoMensaje === "") {
      alert("El mensaje no puede quedar vacío.");
      return;
    }

    //El mensaje no puede superar el límite de caracteres
    if (nuevoMensaje.length > LIMITE_MENSAJE) {
      alert("El mensaje no puede superar los " + LIMITE_MENSAJE + " caracteres.");
      return;
    }

    var publicacionesGuardar = obtenerPublicaciones();
    var publicacionGuardar = publicacionesGuardar.find(function (p) {
      return p.id === idGuardar;
    });

    if (publicacionGuardar) {
      publicacionGuardar.mensaje = nuevoMensaje;
      guardarPublicaciones(publicacionesGuardar);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-favorito")) {
    var elementoFavorito = evento.target.closest(".publicacion");
    var idFavorito = Number(elementoFavorito.dataset.id);

    var publicacionesFavorito = obtenerPublicaciones();
    var publicacionFavorito = publicacionesFavorito.find(function (p) {
      return p.id === idFavorito;
    });

    if (publicacionFavorito) {
      publicacionFavorito.favorito = !publicacionFavorito.favorito;
      guardarPublicaciones(publicacionesFavorito);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-reaccion")) {
    var elementoReaccion = evento.target.closest(".publicacion");
    var idReaccion = Number(elementoReaccion.dataset.id);
    var tipoReaccion = evento.target.dataset.tipo;

    var reaccionesUsuario = obtenerReaccionesUsuario();
    var reaccionActual = reaccionesUsuario[idReaccion];

    var publicacionesReaccion = obtenerPublicaciones();
    var publicacionReaccion = publicacionesReaccion.find(function (p) {
      return p.id === idReaccion;
    });

    if (publicacionReaccion) {
      if (reaccionActual === tipoReaccion) {
        //Se vuelve a hacer clic en la misma reacción: se quita
        publicacionReaccion.reacciones[tipoReaccion]--;
        delete reaccionesUsuario[idReaccion];
      } else {
        //Si ya tenía otra reacción, se le resta a esa y se suma a la nueva
        if (reaccionActual) {
          publicacionReaccion.reacciones[reaccionActual]--;
        }
        publicacionReaccion.reacciones[tipoReaccion]++;
        reaccionesUsuario[idReaccion] = tipoReaccion;
      }

      guardarPublicaciones(publicacionesReaccion);
      guardarReaccionesUsuario(reaccionesUsuario);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-editar-comentario")) {
    var elementoComentarioEditar = evento.target.closest(".comentario");
    var idPublicacionEditarComentario = Number(evento.target.closest(".publicacion").dataset.id);
    var idComentarioEditar = Number(elementoComentarioEditar.dataset.id);

    var resultadoEditar = localizarComentario(obtenerPublicaciones(), idPublicacionEditarComentario, idComentarioEditar);
    if (resultadoEditar.comentario) {
      entrarModoEdicionComentario(elementoComentarioEditar, resultadoEditar.comentario);
    }
    return;
  }

  if (evento.target.classList.contains("btn-cancelar-comentario")) {
    var elementoComentarioCancelar = evento.target.closest(".comentario");
    var idPublicacionCancelarComentario = Number(evento.target.closest(".publicacion").dataset.id);
    var idComentarioCancelar = Number(elementoComentarioCancelar.dataset.id);

    var resultadoCancelar = localizarComentario(obtenerPublicaciones(), idPublicacionCancelarComentario, idComentarioCancelar);
    if (resultadoCancelar.comentario) {
      salirModoEdicionComentario(elementoComentarioCancelar, resultadoCancelar.comentario);
    }
    return;
  }

  if (evento.target.classList.contains("btn-guardar-comentario")) {
    var elementoComentarioGuardar = evento.target.closest(".comentario");
    var idPublicacionGuardarComentario = Number(evento.target.closest(".publicacion").dataset.id);
    var idComentarioGuardar = Number(elementoComentarioGuardar.dataset.id);
    var nuevoTextoComentario = elementoComentarioGuardar.querySelector(".textarea-edicion-comentario").value.trim();

    //El comentario no puede quedar vacío ni contener solo espacios
    if (nuevoTextoComentario === "") {
      alert("El comentario no puede quedar vacío.");
      return;
    }

    var publicacionesGuardarComentario = obtenerPublicaciones();
    var resultadoGuardar = localizarComentario(publicacionesGuardarComentario, idPublicacionGuardarComentario, idComentarioGuardar);

    if (resultadoGuardar.comentario) {
      //Se conserva el autor y la fecha original; solo cambia el texto
      resultadoGuardar.comentario.texto = nuevoTextoComentario;
      guardarPublicaciones(publicacionesGuardarComentario);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-eliminar-comentario")) {
    var elementoComentarioEliminar = evento.target.closest(".comentario");
    var idPublicacionEliminarComentario = Number(evento.target.closest(".publicacion").dataset.id);
    var idComentarioEliminar = Number(elementoComentarioEliminar.dataset.id);

    var confirmadoComentario = confirm("¿Seguro que deseas eliminar este comentario?");
    if (!confirmadoComentario) {
      return;
    }

    var publicacionesEliminarComentario = obtenerPublicaciones();
    var publicacionEliminarComentario = publicacionesEliminarComentario.find(function (p) {
      return p.id === idPublicacionEliminarComentario;
    });

    if (publicacionEliminarComentario) {
      publicacionEliminarComentario.comentarios = publicacionEliminarComentario.comentarios.filter(function (c) {
        return c.id !== idComentarioEliminar;
      });
      guardarPublicaciones(publicacionesEliminarComentario);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-responder-comentario")) {
    var elementoComentarioResponder = evento.target.closest(".comentario");
    var formRespuesta = elementoComentarioResponder.querySelector(".form-respuesta");
    formRespuesta.classList.toggle("d-none");
    if (!formRespuesta.classList.contains("d-none")) {
      formRespuesta.querySelector(".input-nombre-respuesta").focus();
    }
    return;
  }

  if (evento.target.classList.contains("btn-reportar")) {
    var elementoReportar = evento.target.closest(".publicacion");
    elementoReportar.querySelector(".form-reporte").classList.toggle("d-none");
    return;
  }

  if (evento.target.classList.contains("btn-cancelar-reporte")) {
    evento.target.closest(".form-reporte").classList.add("d-none");
    return;
  }
});

//Se escucha el envío de los formularios de comentarios y de respuestas a comentarios
lista.addEventListener("submit", function (evento) {
  if (evento.target.classList.contains("form-comentario")) {
    evento.preventDefault();

    var formComentario = evento.target;
    var elementoPublicacion = formComentario.closest(".publicacion");
    var idPublicacion = Number(elementoPublicacion.dataset.id);

    var inputNombreComentario = formComentario.querySelector(".input-nombre-comentario");
    var inputTextoComentario = formComentario.querySelector(".input-texto-comentario");

    var autor = inputNombreComentario.value.trim();
    var texto = inputTextoComentario.value.trim();

    //El nombre y el comentario son obligatorios
    if (autor === "" || texto === "") {
      alert("El nombre y el comentario son obligatorios.");
      return;
    }

    var publicaciones = obtenerPublicaciones();
    var publicacion = publicaciones.find(function (p) {
      return p.id === idPublicacion;
    });

    if (publicacion) {
      var comentario = {
        id: generarId(),
        autor: autor,
        texto: texto,
        fecha: Date.now(),
        respuestas: []
      };

      publicacion.comentarios.push(comentario);
      guardarPublicaciones(publicaciones);

      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("form-respuesta")) {
    evento.preventDefault();

    var formRespuesta = evento.target;
    var elementoComentarioRespuesta = formRespuesta.closest(".comentario");
    var idPublicacionRespuesta = Number(formRespuesta.closest(".publicacion").dataset.id);
    var idComentarioRespuesta = Number(elementoComentarioRespuesta.dataset.id);

    var inputNombreRespuesta = formRespuesta.querySelector(".input-nombre-respuesta");
    var inputTextoRespuesta = formRespuesta.querySelector(".input-texto-respuesta");

    var autorRespuesta = inputNombreRespuesta.value.trim();
    var textoRespuesta = inputTextoRespuesta.value.trim();

    //El nombre y la respuesta son obligatorios
    if (autorRespuesta === "" || textoRespuesta === "") {
      alert("El nombre y la respuesta son obligatorios.");
      return;
    }

    var publicacionesRespuesta = obtenerPublicaciones();
    var resultadoRespuesta = localizarComentario(publicacionesRespuesta, idPublicacionRespuesta, idComentarioRespuesta);

    if (resultadoRespuesta.comentario) {
      resultadoRespuesta.comentario.respuestas.push({
        id: generarId(),
        autor: autorRespuesta,
        texto: textoRespuesta,
        fecha: Date.now()
      });
      guardarPublicaciones(publicacionesRespuesta);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("form-reporte")) {
    evento.preventDefault();

    var formReporte = evento.target;
    var idPublicacionReporte = Number(formReporte.closest(".publicacion").dataset.id);
    var motivoReporte = formReporte.querySelector(".select-motivo-reporte").value;

    var publicacionesReporte = obtenerPublicaciones();
    var publicacionReporte = publicacionesReporte.find(function (p) {
      return p.id === idPublicacionReporte;
    });

    //Un mismo reporte no se registra dos veces: si ya está reportada, no se vuelve a guardar
    if (publicacionReporte && !publicacionReporte.reporte) {
      publicacionReporte.reporte = { motivo: motivoReporte, fecha: Date.now() };
      guardarPublicaciones(publicacionesReporte);
      renderizarLista();
    }
  }
});

//Se escuchan los clics en los controles de paginación
contenedorPaginacion.addEventListener("click", function (evento) {
  if (evento.target.id === "btnPaginaAnterior" && paginaActual > 1) {
    paginaActual--;
    renderizarLista();
  } else if (evento.target.id === "btnPaginaSiguiente") {
    paginaActual++;
    renderizarLista();
  }
});

//Se escuchan los clics en la vista de Moderación: descartar un reporte o eliminar la publicación reportada
listaModeracion.addEventListener("click", function (evento) {
  var elementoReporte = evento.target.closest(".reporte-moderacion");
  if (!elementoReporte) {
    return;
  }
  var idPublicacionModeracion = Number(elementoReporte.dataset.id);

  if (evento.target.classList.contains("btn-descartar-reporte")) {
    var publicacionesDescartar = obtenerPublicaciones();
    var publicacionDescartar = publicacionesDescartar.find(function (p) {
      return p.id === idPublicacionModeracion;
    });

    if (publicacionDescartar) {
      publicacionDescartar.reporte = null;
      guardarPublicaciones(publicacionesDescartar);
      renderizarLista();
    }
    return;
  }

  if (evento.target.classList.contains("btn-eliminar-desde-moderacion")) {
    var confirmadoModeracion = confirm("¿Seguro que deseas eliminar esta publicación reportada?");
    if (!confirmadoModeracion) {
      return;
    }

    var publicacionesTrasEliminar = obtenerPublicaciones().filter(function (p) {
      return p.id !== idPublicacionModeracion;
    });
    guardarPublicaciones(publicacionesTrasEliminar);
    renderizarLista();
  }
});

//Se escucha la búsqueda: se filtra mientras se escribe y también al presionar "Buscar"
inputBuscar.addEventListener("input", reiniciarPaginaYRenderizar);
btnBuscar.addEventListener("click", reiniciarPaginaYRenderizar);

//Se escucha el cambio de criterio de orden, de etiqueta y del filtro de favoritas
selectOrden.addEventListener("change", reiniciarPaginaYRenderizar);
selectFiltroEtiqueta.addEventListener("change", reiniciarPaginaYRenderizar);
checkSoloFavoritas.addEventListener("change", reiniciarPaginaYRenderizar);

//Se exporta un respaldo en JSON con todas las publicaciones y sus datos relacionados
btnExportar.addEventListener("click", function () {
  var publicaciones = obtenerPublicaciones();
  var blob = new Blob([JSON.stringify(publicaciones, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "respaldo-feibuk.json";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
});

//Se abre el selector de archivos al presionar "Importar"
btnImportar.addEventListener("click", function () {
  inputImportar.click();
});

//Se procesa el archivo elegido para restaurar un respaldo
inputImportar.addEventListener("change", function () {
  var archivo = inputImportar.files[0];
  if (!archivo) {
    return;
  }

  var lector = new FileReader();
  lector.onload = function () {
    var datosImportados;

    try {
      datosImportados = JSON.parse(lector.result);
    } catch (error) {
      alert("El archivo no es un JSON válido.");
      inputImportar.value = "";
      return;
    }

    if (!validarRespaldo(datosImportados)) {
      alert("El archivo no tiene la estructura esperada de un respaldo de FEIBUK.");
      inputImportar.value = "";
      return;
    }

    var confirmado = confirm("Esto reemplazará todas tus publicaciones actuales por las del respaldo. ¿Deseas continuar?");
    if (!confirmado) {
      inputImportar.value = "";
      return;
    }

    guardarPublicaciones(datosImportados);
    paginaActual = 1;
    renderizarLista();
    inputImportar.value = "";
  };
  lector.readAsText(archivo);
});
