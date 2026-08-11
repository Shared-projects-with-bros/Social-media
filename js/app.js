// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var lista = document.getElementById("listaPublicaciones");
var inputBuscar = document.getElementById("buscar");
var selectOrden = document.getElementById("ordenar");
var btnBuscar = document.getElementById("btnBuscar");
var elementoResumenPublicaciones = document.getElementById("resumenPublicaciones");
var elementoResumenLikes = document.getElementById("resumenLikes");
var elementoResumenComentarios = document.getElementById("resumenComentarios");
var elementoContadorMensaje = document.getElementById("contadorMensaje");

var CLAVE_STORAGE = "publicaciones";
var CLAVE_LIKES_USUARIO = "likesUsuario";
var COLORES_AVATAR = ["#1877f2", "#e91e63", "#00a884", "#f5a623", "#8e44ad", "#e67e22", "#16a085", "#c0392b"];
var LIMITE_MENSAJE = 200;

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
  elemento.className = "publicacion card shadow-sm border-0 mb-3";
  elemento.dataset.id = publicacion.id;
  var yaDioLike = obtenerLikesUsuario().indexOf(publicacion.id) !== -1;
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
    '<button type="button" class="btn btn-sm btn-outline-primary btn-like"' + (yaDioLike ? " disabled" : "") + ">👍 Me gusta</button>" +
    '<span class="badge rounded-pill text-bg-light"><span class="contador-likes">' + publicacion.likes + "</span> me gusta</span>" +
    '<button type="button" class="btn btn-sm btn-outline-secondary btn-editar">Editar</button>' +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>' +
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
      return b.likes - a.likes;
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
  var totalLikes = publicaciones.reduce(function (total, publicacion) {
    return total + publicacion.likes;
  }, 0);
  var totalComentarios = publicaciones.reduce(function (total, publicacion) {
    return total + publicacion.comentarios.length;
  }, 0);

  elementoResumenPublicaciones.textContent = publicaciones.length;
  elementoResumenLikes.textContent = totalLikes;
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

  renderizarLista();

  //Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
  actualizarContadorCaracteres(elementoContadorMensaje, 0);
});

//Se escucha los clics en la lista para eliminar, editar o dar "Me gusta"
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

      likesUsuario.push(idLike);
      guardarLikesUsuario(likesUsuario);

      renderizarLista();
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

    renderizarLista();
  }
});

//Se escucha la búsqueda: se filtra mientras se escribe y también al presionar "Buscar"
inputBuscar.addEventListener("input", renderizarLista);
btnBuscar.addEventListener("click", renderizarLista);

//Se escucha el cambio de criterio de orden
selectOrden.addEventListener("change", renderizarLista);
