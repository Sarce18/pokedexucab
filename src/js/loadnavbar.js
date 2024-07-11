// Define el HTML para la barra de navegación lateral.
const navbarHTML = `
<section class="lateral">
    <!-- Icono de hamburguesa para expandir/colapsar la barra de navegación -->
    <div class="hamburger_icon" onclick="toggleNavbar()">☰</div>
    <li id="navbar">
        <!-- Logo de la página -->
        <div>
            <a href="./index.html"><img src="../img/Logo.png" class="logo"></a>
        </div>
        <!-- Enlace a la página principal (Pokedex) -->
        <div class="container">
            <a href="./index.html"><img src="../img/pokedexicon.png"></a>
            <a href="./index.html">Pokedex</a>
        </div>
        <!-- Enlace a la página de objetos -->
        <div class="container">
            <a href="./objetos.html"><img src="../img/objetosicon.png"></a>
            <a href="./objetos.html">Objetos</a>
        </div>
        <!-- Enlace a la página de información sobre el proyecto o equipo -->
        <div class="container">
            <a href="./conocenos.html"><img src="../img/abouticon.png"></a>
            <a href="./conocenos.html">Conocenos</a>
        </div>
        <!-- Enlace a la página de contacto -->
        <div class="container">
            <a href="./contacto.html"><img src="../img/contacticon.png"></a>
            <a href="./contacto.html">Contacto</a>
        </div>
    </li>
</section>
`;

// Espera a que el contenido del DOM esté completamente cargado.
document.addEventListener("DOMContentLoaded", function() {
  // Inserta el HTML de la barra de navegación en el elemento con ID 'navbar_container'.
  document.getElementById('navbar_container').innerHTML = navbarHTML;
});

// Función para alternar la visibilidad de la barra de navegación lateral.
function toggleNavbar() {
    // Obtiene el elemento de la barra de navegación por su ID.
    var navbar = document.getElementById("navbar");
    // Alterna la clase 'active' para mostrar u ocultar la barra de navegación.
    navbar.classList.toggle("active");

    // Obtiene el elemento de la barra lateral (sidebar) por su clase.
    var sidebar = document.querySelector('.lateral');
    // Alterna la clase 'active' en la barra lateral para expandir o colapsar.
    sidebar.classList.toggle('active');
}
