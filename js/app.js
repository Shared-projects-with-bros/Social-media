// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var lista = document.getElementById("listaPublicaciones");

var CLAVE_STORAGE = "publicaciones";
var CLAVE_LIKES_USUARIO = "likesUsuario";

//Se lee los ids de publicaciones a las que este usuario ya dio like
function obtenerLikesUsuario() {
  var datos = localStorage.getItem(CLAVE_LIKES_USUARIO);
  return datos ? JSON.parse(datos) : [];
}

//Se guarda los ids de publicaciones a las que este usuario ya dio like
function guardarLikesUsuario(likesUsuario) {
  localStorage.setItem(CLAVE_LIKES_USUARIO, JSON.stringify(likesUsuario));
}

//Se leen las publicaciones guardadas en LocalStorage
function obtenerPublicaciones() {
  var datos = localStorage.getItem(CLAVE_STORAGE);
  var publicaciones = datos ? JSON.parse(datos) : [];

  //Las publicaciones antiguas todavía no tienen la propiedad "comentarios"
  publicaciones.forEach(function (publicacion) {
    if (!publicacion.comentarios) {
      publicacion.comentarios = [];
    }
  });

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

//Se arma el HTML de un comentario
function crearHtmlComentario(comentario) {
  return '<div class="comentario">' +
    '<div class="comentario-encabezado">' +
    '<strong class="comentario-autor">' + comentario.autor + "</strong> " +
    '<span class="comentario-fecha">' + formatearFechaHora(comentario.fecha) + "</span>" +
    "</div>" +
    '<p class="comentario-texto">' + comentario.texto + "</p>" +
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
  elemento.className = "publicacion";
  elemento.dataset.id = publicacion.id;
  var yaDioLike = obtenerLikesUsuario().indexOf(publicacion.id) !== -1;
  elemento.innerHTML =
    '<span class="fecha-hora">' + formatearFechaHora(publicacion.fecha || publicacion.id) + "</span>" +
    "<h2>" + publicacion.nombre + "</h2>" +
    '<div class="mensaje-contenedor"><p class="texto-mensaje"> <strong> Mensaje: </strong><span class="mensaje-texto">' + publicacion.mensaje + "</span></p></div>" +
    '<div class="acciones">' +
    '<button type="button" class="btn btn-sm btn-outline-primary btn-like"' + (yaDioLike ? " disabled" : "") + '>Me gusta</button> ' +
    '<span class="contador-likes">' + publicacion.likes + '</span> ' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-editar">Editar</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>' +
    "</div>" +
    '<div class="comentarios-contenedor">' +
    '<h3 class="h6 mt-3">Comentarios</h3>' +
    '<div class="lista-comentarios">' + crearHtmlListaComentarios(publicacion.comentarios) + "</div>" +
    '<form class="form-comentario mt-2">' +
    '<div class="mb-2">' +
    '<input type="text" class="form-control form-control-sm input-nombre-comentario" placeholder="Tu nombre">' +
    "</div>" +
    '<div class="mb-2">' +
    '<input type="text" class="form-control form-control-sm input-texto-comentario" placeholder="Escribe un comentario">' +
    "</div>" +
    '<button type="submit" class="btn btn-sm btn-outline-primary">Comentar</button>' +
    "</form>" +
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
  textarea.value = publicacion.mensaje;

  var contenedorBotones = document.createElement("div");
  contenedorBotones.className = "mt-2";
  contenedorBotones.innerHTML =
    '<button type="button" class="btn btn-sm btn-primary btn-guardar-edicion">Guardar</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-cancelar-edicion">Cancelar</button>';

  contenedorMensaje.appendChild(textarea);
  contenedorMensaje.appendChild(contenedorBotones);
  elementoPublicacion.querySelector(".acciones").style.display = "none";
  textarea.focus();
}

//Se vuelve a mostrar el mensaje (guardado o el original si se cancela)
function salirModoEdicion(elementoPublicacion, publicacion) {
  var contenedorMensaje = elementoPublicacion.querySelector(".mensaje-contenedor");
  contenedorMensaje.innerHTML =
    '<p class="texto-mensaje"> <strong> Mensaje: </strong><span class="mensaje-texto">' + publicacion.mensaje + "</span></p>";
  elementoPublicacion.querySelector(".acciones").style.display = "";
}

//Se muestra en pantalla todas las publicaciones guardadas
function mostrarPublicaciones() {
  lista.innerHTML = "";
  var publicaciones = obtenerPublicaciones();
  publicaciones.forEach(function (publicacion) {
    lista.appendChild(crearElementoPublicacion(publicacion));
  });
}

//Al cargar la página, mostramos las publicaciones guardadas
mostrarPublicaciones();

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

  var publicacion = {
    id: Date.now(),
    nombre: nombre,
    mensaje: mensaje,
    likes: 0,
    fecha: Date.now(),
    comentarios: []
  };

  //Las publicaciones nuevas aparecen primero
  var publicaciones = obtenerPublicaciones();
  publicaciones.unshift(publicacion);
  guardarPublicaciones(publicaciones);

  lista.insertBefore(crearElementoPublicacion(publicacion), lista.firstChild);

  //Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
});

//Se escucha los clics en la lista para eliminar publicaciones o dar "Me gusta"
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

    elementoEliminar.remove();
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

    var publicacionesGuardar = obtenerPublicaciones();
    var publicacionGuardar = publicacionesGuardar.find(function (p) {
      return p.id === idGuardar;
    });

    if (publicacionGuardar) {
      publicacionGuardar.mensaje = nuevoMensaje;
      guardarPublicaciones(publicacionesGuardar);
      salirModoEdicion(elementoGuardar, publicacionGuardar);
    }
    return;
  }

  if (evento.target.classList.contains("btn-like")) {
    var elementoLike = evento.target.closest(".publicacion");
    var idLike = Number(elementoLike.dataset.id);

    var likesUsuario = obtenerLikesUsuario();
    if (likesUsuario.indexOf(idLike) !== -1) {
      return;
    }

    var publicacionesLike = obtenerPublicaciones();
    var publicacion = publicacionesLike.find(function (p) {
      return p.id === idLike;
    });

    if (publicacion) {
      publicacion.likes++;
      guardarPublicaciones(publicacionesLike);
      elementoLike.querySelector(".contador-likes").textContent = publicacion.likes;

      likesUsuario.push(idLike);
      guardarLikesUsuario(likesUsuario);
      evento.target.disabled = true;
    }
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
      autor: autor,
      texto: texto,
      fecha: Date.now()
    };

    publicacion.comentarios.push(comentario);
    guardarPublicaciones(publicaciones);

    elementoPublicacion.querySelector(".lista-comentarios").innerHTML = crearHtmlListaComentarios(publicacion.comentarios);

    inputNombreComentario.value = "";
    inputTextoComentario.value = "";
  }
});
