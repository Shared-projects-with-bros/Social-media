// Historia 1: Publicar un mensaje

// Buscamos los elementos que vamos a usar
var formulario = document.getElementById("formPublicar");
var inputNombre = document.getElementById("nombre");
var inputMensaje = document.getElementById("mensaje");
var lista = document.getElementById("listaPublicaciones");

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

  // Creamos la publicación en pantalla
  var publicacion = document.createElement("div");
  publicacion.className = "publicacion";
  publicacion.innerHTML =
    "<h3>" + nombre + "</h3>" +
    "<p>" + mensaje + "</p>";

  // Las publicaciones nuevas aparecen primero
  lista.insertBefore(publicacion, lista.firstChild);

  // Después de publicar, los campos quedan vacíos
  inputNombre.value = "";
  inputMensaje.value = "";
});
