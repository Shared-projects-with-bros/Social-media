// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var lista = document.getElementById("listaPublicaciones");
var inputBuscar = document.getElementById("buscar");
var selectOrden = document.getElementById("ordenar");
var btnBuscar = document.getElementById("btnBuscar");
var elementoResumenPublicaciones = document.getElementById("resumenPublicaciones");
var elementoResumenReacciones = document.getElementById("resumenReacciones");
var elementoResumenComentarios = document.getElementById("resumenComentarios");
var elementoContadorMensaje = document.getElementById("contadorMensaje");

var CLAVE_STORAGE = "publicaciones";
var CLAVE_LIKES_USUARIO = "likesUsuario";
var CLAVE_REACCIONES_USUARIO = "reaccionesUsuario";
var COLORES_AVATAR = ["#1877f2", "#e91e63", "#00a884", "#f5a623", "#8e44ad", "#e67e22", "#16a085", "#c0392b"];
var LIMITE_MENSAJE = 200;
var TIPOS_REACCION = [
  { clave: "meGusta", emoji: "👍", etiqueta: "Me gusta", color: "primary" },
  { clave: "meEncanta", emoji: "🥰", etiqueta: "Me encanta", color: "danger" },
  { clave: "meDivierte", emoji: "😂", etiqueta: "Me divierte", color: "warning" }
];

//Se genera un id único (marca de tiempo + número aleatorio) para publicaciones y comentarios
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

    //Los comentarios antiguos todavía no tienen un id único
    publicacion.comentarios.forEach(function (comentario) {
      if (!comentario.id) {
        comentario.id = generarId();
        seMigraronDatos = true;
      }
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
  });

  //Se guarda la migración para que los ids y las reacciones queden estables entre recargas
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

//Se arma el HTML de la vista (no edición) de un comentario
function construirVistaComentario(comentario) {
  return '<strong class="comentario-autor">' + comentario.autor + "</strong> " +
    '<span class="comentario-fecha">' + formatearFechaHora(comentario.fecha) + "</span>" +
    '<p class="comentario-texto">' + comentario.texto + "</p>" +
    '<div class="comentario-acciones">' +
    '<button type="button" class="btn btn-sm btn-link p-0 me-3 btn-editar-comentario">Editar</button>' +
    '<button type="button" class="btn btn-sm btn-link p-0 text-danger btn-eliminar-comentario">Eliminar</button>' +
    "</div>";
}

//Se arma el HTML de un comentario completo
function crearHtmlComentario(comentario) {
  return '<div class="comentario" data-id="' + comentario.id + '">' +
    '<div class="comentario-vista">' + construirVistaComentario(comentario) + "</div>" +
    "</div>";
}

//Se arma el HTML con la lista de comentarios de una publicación
function crearHtmlListaComentarios(comentarios) {
  if (comentarios.length === 0) {
    return '<p class="sin-comentarios">Sin comentarios todavía.</p>';
  }
  return comentarios.map(crearHtmlComentario).join("");
}

//Se crea los elementos del HTML de una publicación
function crearElementoPublicacion(publicacion) {
  var elemento = document.createElement("div");
  elemento.className = "publicacion card shadow-sm border-0 mb-3";
  elemento.dataset.id = publicacion.id;
  var reaccionElegida = obtenerReaccionesUsuario()[publicacion.id];
  elemento.innerHTML =
    '<div class="card-body">' +
    '<div class="d-flex align-items-center mb-2">' +
    '<div class="avatar-circulo me-2" style="background-color: ' + obtenerColorAvatar(publicacion.nombre) + ';">' + obtenerInicial(publicacion.nombre) + "</div>" +
    "<div>" +
    '<h2 class="h6 mb-0">' + publicacion.nombre + "</h2>" +
    '<span class="text-muted small fecha-hora">' + formatearFechaHora(publicacion.fecha || publicacion.id) + "</span>" +
    "</div>" +
    "</div>" +
    '<div class="mensaje-contenedor"><p class="texto-mensaje"><span class="mensaje-texto">' + publicacion.mensaje + "</span></p></div>" +
    '<div class="acciones d-flex flex-wrap align-items-center gap-2 border-top mt-3 pt-2">' +
    crearHtmlReacciones(publicacion, reaccionElegida) +
    ' <button type="button" class="btn btn-sm btn-outline-secondary btn-editar">Editar</button>' +
    ' <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>' +
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

//Se calcula y muestra el resumen de actividad a partir del arreglo de publicaciones
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

//Se muestra en pantalla la lista de publicaciones aplicando la búsqueda y el orden actuales
function renderizarLista() {
  var publicaciones = obtenerPublicaciones();
  actualizarResumen(publicaciones);

  lista.innerHTML = "";

  if (publicaciones.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mensaje-sin-resultados">Todavía no hay publicaciones. ¡Sé el primero en publicar algo!</p>';
    return;
  }

  var filtradas = obtenerPublicacionesFiltradas(publicaciones);
  var ordenadas = ordenarPublicaciones(filtradas);

  if (ordenadas.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted mensaje-sin-resultados">No se encontraron publicaciones que coincidan con tu búsqueda.</p>';
    return;
  }

  ordenadas.forEach(function (publicacion) {
    lista.appendChild(crearElementoPublicacion(publicacion));
  });
}

//Al cargar la página, mostramos las publicaciones guardadas
renderizarLista();

//Se actualiza el contador de caracteres mientras se escribe el mensaje
inputMensaje.addEventListener("input", function () {
  actualizarContadorCaracteres(elementoContadorMensaje, inputMensaje.value.length);
});

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
    reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
    fecha: Date.now(),
    comentarios: []
  };

  //Las publicaciones nuevas aparecen primero
  var publicaciones = obtenerPublicaciones();
  publicaciones.unshift(publicacion);
  guardarPublicaciones(publicaciones);

  renderizarLista();

  //Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
  actualizarContadorCaracteres(elementoContadorMensaje, 0);
});

//Se escucha los clics en la lista: publicaciones (eliminar, editar, reaccionar) y comentarios (editar, eliminar)
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
});

//Se escucha el envío de los formularios de comentarios
lista.addEventListener("submit", function (evento) {
  if (!evento.target.classList.contains("form-comentario")) {
    return;
  }

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
      fecha: Date.now()
    };

    publicacion.comentarios.push(comentario);
    guardarPublicaciones(publicaciones);

    renderizarLista();
  }
});

//Se escucha la búsqueda: se filtra mientras se escribe y también al presionar "Buscar"
inputBuscar.addEventListener("input", renderizarLista);
btnBuscar.addEventListener("click", renderizarLista);

//Se escucha el cambio de criterio de orden
selectOrden.addEventListener("change", renderizarLista);
