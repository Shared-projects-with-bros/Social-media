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
  return datos ? JSON.parse(datos) : [];
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

//Se crea los elementos del HTML de una publicación
function crearElementoPublicacion(publicacion) {
  var elemento = document.createElement("div");
  elemento.className = "publicacion";
  elemento.dataset.id = publicacion.id;
  var yaDioLike = obtenerLikesUsuario().indexOf(publicacion.id) !== -1;
  elemento.innerHTML =
    '<span class="fecha-hora">' + formatearFechaHora(publicacion.fecha || publicacion.id) + "</span>" +
    "<h2>" + publicacion.nombre + "</h2>" +
    "<p> <strong> Mensaje: </strong>" + publicacion.mensaje + "</p>" +
    '<button type="button" class="btn btn-sm btn-outline-primary btn-like"' + (yaDioLike ? " disabled" : "") + '>Me gusta</button> ' +
    '<span class="contador-likes">' + publicacion.likes + '</span> ' +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>';
  return elemento;
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
    fecha: Date.now()
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
