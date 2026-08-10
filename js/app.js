// Historia 1: Publicar un mensaje
// Historia 4: Conservar la información

// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var lista = document.getElementById("listaPublicaciones");

var CLAVE_STORAGE = "publicaciones";

// Leemos las publicaciones guardadas en LocalStorage
function obtenerPublicaciones() {
  var datos = localStorage.getItem(CLAVE_STORAGE);
  return datos ? JSON.parse(datos) : [];
}

// Guardamos el arreglo de publicaciones en LocalStorage
function guardarPublicaciones(publicaciones) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(publicaciones));
}

// Creamos el elemento HTML de una publicación
function crearElementoPublicacion(publicacion) {
  var elemento = document.createElement("div");
  elemento.className = "publicacion";
  elemento.dataset.id = publicacion.id;
  elemento.innerHTML =
    "<h3>" + publicacion.nombre + "</h3>" +
    "<p>" + publicacion.mensaje + "</p>" +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar">Eliminar</button>';
  return elemento;
}

// Mostramos en pantalla todas las publicaciones guardadas
function mostrarPublicaciones() {
  lista.innerHTML = "";
  var publicaciones = obtenerPublicaciones();
  publicaciones.forEach(function (publicacion) {
    lista.appendChild(crearElementoPublicacion(publicacion));
  });
}

// Al cargar la página, mostramos las publicaciones guardadas
mostrarPublicaciones();

// Escuchamos cuando el usuario presiona "Publicar"
formulario.addEventListener("submit", function (evento) {
  // Evitamos que la página se recargue
  evento.preventDefault();

  var nombre = inputNombre.value.trim();
  var mensaje = inputMensaje.value.trim();

  // El nombre y el mensaje son obligatorios
  if (nombre === "" || mensaje === "") {
    alert("El nombre y el mensaje son obligatorios.");
    return;
  }

  var publicacion = {
    id: Date.now(),
    nombre: nombre,
    mensaje: mensaje
  };

  // Las publicaciones nuevas aparecen primero
  var publicaciones = obtenerPublicaciones();
  publicaciones.unshift(publicacion);
  guardarPublicaciones(publicaciones);

  lista.insertBefore(crearElementoPublicacion(publicacion), lista.firstChild);

  // Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
});

// Escuchamos los clics en la lista para eliminar publicaciones
lista.addEventListener("click", function (evento) {
  if (!evento.target.classList.contains("btn-eliminar")) {
    return;
  }

  var elemento = evento.target.closest(".publicacion");
  var id = Number(elemento.dataset.id);

  var confirmado = confirm("¿Seguro que deseas eliminar esta publicación?");
  if (!confirmado) {
    return;
  }

  var publicaciones = obtenerPublicaciones().filter(function (publicacion) {
    return publicacion.id !== id;
  });
  guardarPublicaciones(publicaciones);

  elemento.remove();
});
