// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// URL base de la API de Pokémon para obtener datos de Pokémon.
const url = "https://pokeapi.co/api/v2/pokemon/";

// URL base para las imágenes oficiales de los Pokémon.
const BASE_SPRITE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

// Objeto que mapea el inicio de cada generación de Pokémon a su último ID.
const generationStartIds = {
  1: 151, // Primera generación termina en el Pokémon 151 (Mew)
  2: 251, // Segunda generación termina en el Pokémon 251 (Celebi)
  3: 386, // Tercera generación termina en el Pokémon 386 (Deoxys)
  4: 493, // Cuarta generación termina en el Pokémon 493 (Arceus)
  5: 649, // Quinta generación termina en el Pokémon 649 (Genesect)
  6: 721, // Sexta generación termina en el Pokémon 721 (Volcanion)
  7: 809, // Séptima generación termina en el Pokémon 809 (Melmetal)
  8: 898, // Octava generación termina en el Pokémon 898 (Calyrex)
  9: 1025, // Novena generación termina en el Pokémon 1025 (Último Pokémon conocido en el momento de la escritura)
};

// Selecciona el elemento del DOM para el selector de generación.
const generationSelect = document.getElementsByClassName("gen_select")[0];

// Selecciona el elemento del DOM para mostrar la imagen grande del Pokémon.
const spriteGrandElement = document.querySelector(".pokemon_3Dmodel > img");

//
const nameElement = document.querySelector(".name");

// Selecciona el elemento del DOM para listar los Pokémon.
const pokemonList = document.querySelector(".pokemon_list");

// Selecciona el elemento del DOM para el botón de cambio a versión shiny.
const shinyButton = document.querySelector(".shiny_button");

// Variable para controlar si se muestra la versión shiny del Pokémon.
let isShiny = false;

// Variable para almacenar la referencia a la base de datos IndexedDB.
let db;

// Solicita la apertura de una base de datos IndexedDB llamada "PokedexDB" con versión 1.

// Evento que se dispara cuando el contenido del DOM ha sido completamente cargado.
document.addEventListener("DOMContentLoaded", () => {
  // Añade un evento de cambio al selector de generación.
  generationSelect.addEventListener("change", function () {
    const { value: gen } = this; // Obtiene el valor de la generación seleccionada de manera más limpia.
    const firstPoke = generationStartIds[gen]; // Obtiene el primer Pokémon de la generación seleccionada.

    // Calcula el último Pokémon de la generación seleccionada de manera más eficiente.
    const keys = Object.keys(generationStartIds);
    const lastPokeIndex = +gen < keys.length ? +gen + 1 : +gen;
    const lastPoke =
      lastPokeIndex < keys.length
        ? generationStartIds[keys[lastPokeIndex]] - 1
        : generationStartIds[gen];

    getPokeData(firstPoke, lastPoke); // Llama a la función para obtener datos de los Pokémon en el rango especificado.
  });
});

// Añade un evento de escucha al botón shiny para cambiar entre la versión normal y shiny del Pokémon mostrado.
shinyButton.addEventListener("click", () => {
  toggleShiny(); // Llama a la función que maneja el cambio.
});

// Añade un evento de escucha que carga los datos de los Pokémon de la primera generación cuando la ventana se carga.
window.addEventListener("load", () => getPokeData(1, 151)); // Carga los Pokémon del 1 al 151 al iniciar.

// Maneja el evento necesario para actualizar la base de datos IndexedDB cuando se necesita una actualización.

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PokedexDB", 1);

    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result; // Asegúrate de que `db` esté definido en un ámbito accesible
      resolve(db);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result; // Almacena la referencia a la base de datos.
      // Verifica si el almacén de objetos "pokemons" ya existe, si no, lo crea.
      if (!db.objectStoreNames.contains("pokemons")) {
        db.createObjectStore("pokemons", { keyPath: "id" }); // Crea un almacén de pokemones con "id" como clave primaria.
        db.createObjectStore("items", { keyPath: "id" }); // Crea un almacén de objetos con "id" como clave primaria.
      }
    };
  });
}

// Función de ayuda para obtener datos de IndexedDB
async function getDataFromIndexedDB(id) {
  if (!db) {
    console.log("Database is not initialized. Initializing now.");
    await initDB();
  }
  // Retorna una promesa que se resuelve con los datos del Pokémon o se rechaza con un error.
  return new Promise((resolve, reject) => {
    // Inicia una transacción de solo lectura en el almacén de objetos "pokemons".
    const transaction = db.transaction(["pokemons"], "readonly");
    // Accede al almacén de objetos "pokemons".
    const store = transaction.objectStore("pokemons");
    // Realiza una solicitud para obtener el Pokémon por su ID.
    const request = store.get(id);
    // En caso de éxito, resuelve la promesa con los datos obtenidos.
    request.onsuccess = () => resolve(request.result);
    // En caso de error, rechaza la promesa con el error ocurrido.
    request.onerror = () => reject(request.error);
  });
}

// Función para guardar datos de Pokémon en IndexedDB
function savePokemonData(pokemon) {
  if (!db) {
    console.error("Database is not initialized.");
    return;
  }

  // Crea una transacción de escritura en el almacén de objetos 'pokemon'
  const transaction = db.transaction(["pokemons"], "readwrite");

  // Obtiene el almacén de objetos 'pokemon' de la transacción
  const store = transaction.objectStore("pokemons");

  // Intenta guardar el objeto Pokémon en el almacén de objetos
  const request = store.put(pokemon); // Usar `add` o `put` según sea necesario. `put` actualiza si la clave ya existe.

  request.onsuccess = function () {
    console.log("Pokémon saved successfully.");
  };

  request.onerror = function () {
    console.error("Error saving Pokémon:", request.error);
  };
}

// Función asíncrona para obtener datos de Pokémon desde una API y almacenar/recuperar estos datos usando IndexedDB
async function getPokeData(firstPoke, lastPoke) {
  try {
    const pokemonData = [];
    for (let i = firstPoke; i <= lastPoke; i++) {
      // Intenta obtener los datos del Pokémon de IndexedDB.
      const dataFromDB = await getDataFromIndexedDB(i);
      if (dataFromDB) {
        // Si los datos están en IndexedDB, los agrega a la lista de datos de Pokémon.
        pokemonData.push(dataFromDB);
      } else {
        // Si los datos no están en IndexedDB, realiza una solicitud a la API.
        const finalUrl = `${url}${i}`;
        const data = await fetch(finalUrl).then((response) => response.json());
        // Agrega los datos obtenidos de la API a la lista de datos de Pokémon.
        pokemonData.push(data);
        // Almacena los datos obtenidos en IndexedDB para uso futuro.
        await storeDataInIndexedDB(data);
      }
    }

    // Limpia el contenido HTML de la lista de Pokémon y genera nuevas tarjetas para cada Pokémon obtenido.
    pokemonList.innerHTML = "";
    pokemonData.forEach((data) => {
      generateCard(data, lastPoke, isShiny);
    });
    // Mejora la visualización de las tarjetas de Pokémon.
    betterPokemonCards();
    // Habilita la selección de Pokémon para mostrar detalles.
    selectPokemon();

    // Si se obtuvieron datos de Pokémon, selecciona el primer Pokémon para mostrar sus detalles.
    if (pokemonData.length > 0) {
      const firstPokemonElement = document.querySelector(".pokemon");
      if (firstPokemonElement) {
        // Destaca visualmente el primer Pokémon.
        firstPokemonElement.classList.add("pokemon_active");
        // Obtiene el ID del primer Pokémon y muestra sus detalles.
        const pokemonId = firstPokemonElement.getAttribute("data-id");
        fetchPokemonDetails(pokemonId);
        // Determina y muestra la imagen correcta del Pokémon, considerando si debe ser shiny o no.
        determinePokemonSprite(firstPokemonElement, isShiny);
      }
    }
  } catch (error) {
    // Muestra un mensaje de error en la consola si ocurre un error durante el proceso.
    console.error("Failed to fetch or store Pokemon data:", error);
  }
}

async function storeDataInIndexedDB(pokemon) {
  if (!db) {
    console.error("Database is not initialized.");
    return;
  }

  // Create a write transaction on the 'pokemons' object store
  const transaction = db.transaction(["pokemons"], "readwrite");

  // Get the 'pokemons' object store from the transaction
  const store = transaction.objectStore("pokemons");

  // Attempt to save the Pokémon object to the object store
  const request = store.put(pokemon); // Use `put` to update if the key already exists

  return new Promise((resolve, reject) => {
    request.onsuccess = function () {
      console.log("Pokémon saved successfully.");
      resolve(request.result);
    };

    request.onerror = function () {
      console.error("Error saving Pokémon:", request.error);
      reject(request.error);
    };
  });
}

//Función para generar una tarjeta de Pokémon y añadirla a la lista de Pokémon en la interfaz de usuario.
function generateCard(data, lastPoke) {
  const dex_number = data.id; // Número de la Pokédex del Pokémon.
  const name = data.name; // Nombre del Pokémon.
  // URL de la imagen oficial del Pokémon.
  const spriteGrand = data.sprites.other["official-artwork"].front_default;
  // URL de la imagen oficial shiny del Pokémon.
  const spriteGrandShiny = data.sprites.other["official-artwork"].front_shiny;
  // URL del icono del sprite del Pokémon.
  //const spriteIcon = data.sprites.versions["generation-viii"].icons.front_default;
  const spriteIcon = data.sprites.front_default;

  const li = document.createElement("li"); // Crea un nuevo elemento 'li'.

  // Asigna clases al elemento 'li'. Si es el último Pokémon, añade la clase "pokemon_active".
  li.className = `pokemon`;

  // Establece atributos con las URLs de las imágenes y el número de la Pokédex.
  li.setAttribute("data-sprite-grand", spriteGrand);
  li.setAttribute("data-shiny", spriteGrandShiny);
  li.setAttribute("data-id", dex_number);

  // Define el contenido interno del elemento 'li', incluyendo la imagen del sprite, el número y el nombre del Pokémon.
  li.innerHTML = `
        <div>
            <div class="pokemon_sprite">
                <img src="${spriteIcon}" alt="sprite">
            </div>
            <p class="pokemon_num">No. <span class="pokemon_num_field">${dex_number}</span></p>
        </div>
        <p class="pokemon_name">${name}</p>
        <div class="pokeball">
            <img src="/img/pokeball.png" alt="pokeball">
        </div>
    `;

  pokemonList.appendChild(li); // Añade el elemento 'li' a la lista de Pokémon en el DOM.
}

//Función para mejorar la visualización de los números de Pokédex en las tarjetas de Pokémon.
function betterPokemonCards() {
  // Selecciona todos los elementos con la clase ".pokemon" en el documento.
  let pokemons = document.querySelectorAll(".pokemon");
  // Itera sobre cada elemento de Pokémon encontrado.
  pokemons.forEach((pokemon) => {
    // Accede al elemento que contiene el número de la Pokédex del Pokémon.
    let dex_entry = pokemon.firstElementChild.lastElementChild.lastElementChild;
    // Ajusta el texto del número de la Pokédex para asegurar un mínimo de tres dígitos, añadiendo ceros a la izquierda si es necesario.
    dex_entry.innerText = dex_entry.innerText.padStart(3, "0");
  });
}

//Función para añadir funcionalidad de selección a las tarjetas de Pokémon.
function selectPokemon() {
  // Selecciona el elemento que contiene la lista de Pokémon.
  const pokemonList = document.querySelector(".pokemon_list");

  // Añade un escuchador de eventos para capturar clics en la lista de Pokémon.
  pokemonList.addEventListener("click", (event) => {
    // Determina si el clic fue dentro de una tarjeta de Pokémon y obtiene la referencia a esa tarjeta.
    const pokemon = event.target.closest(".pokemon");
    // Si no se encontró una tarjeta de Pokémon, termina la función prematuramente.
    if (!pokemon) return;

    // Determina y muestra la imagen correcta del Pokémon seleccionado, considerando si debe ser shiny o no.
    determinePokemonSprite(pokemon, isShiny);
    // Busca cualquier Pokémon previamente marcado como activo y remueve esa marca.
    const activePokemon = document.querySelector(".pokemon_active");
    if (activePokemon) {
      activePokemon.classList.remove("pokemon_active");
    }

    // Obtiene el ID del Pokémon seleccionado a partir de sus atributos.
    const pokemonId = pokemon.getAttribute("data-id");

    // Solicita los detalles específicos del Pokémon seleccionado.
    fetchPokemonDetails(pokemonId);

    // Marca el Pokémon seleccionado como activo, destacándolo visualmente.
    pokemon.classList.add("pokemon_active");

    // Reproduce el grito del Pokémon seleccionado.
    playPokemonCry(pokemonId);
  });
}

// Función para reproducir el grito de un Pokémon específico por su ID
async function playPokemonCry(pokemonId) {
  const pokemonData = [];
  const dataFromDB = await getDataFromIndexedDB(pokemonId);
  if (dataFromDB) {
    // Si los datos están en IndexedDB, los agrega a la lista de datos de Pokémon.
    pokemonData.push(dataFromDB);
  } else {
    // Si los datos no están en IndexedDB, realiza una solicitud a la API.
    const finalUrl = `${url}${pokemonId}`;
    const data = await fetch(finalUrl).then((response) => response.json());
    // Agrega los datos obtenidos de la API a la lista de datos de Pokémon.
    pokemonData.push(data);
    // Almacena los datos obtenidos en IndexedDB para uso futuro.
  }

  console.log(pokemonData[0].cries.latest);

  // Construye la URL del archivo de sonido del Pokémon basado en su ID.
  const cryUrl = pokemonData[0].cries.latest; // URL to the cry file
  const cryAudio = new Audio(cryUrl);
  cryAudio.play();
}

//Solicita los detalles de un Pokémon específico de la base de datos IndexedDB y, si no está disponible, lo busca en línea.
function fetchPokemonDetails(pokemonId) {
  const transaction = db.transaction(["pokemons"]); // Inicia una transacción en IndexedDB.
  const store = transaction.objectStore("pokemons"); // Accede al almacén de objetos "pokemons".
  const request = store.get(pokemonId); // Intenta obtener los detalles del Pokémon por su ID.

  request.onerror = function (event) {
    // Maneja errores durante la solicitud a IndexedDB.
    console.error("Error al obtener el Pokémon: ", event.target.error);
  };

  request.onsuccess = function (event) {
    if (request.result) {
      // Si el Pokémon se encuentra en IndexedDB, actualiza la interfaz de usuario con sus datos.
      console.log("Pokémon encontrado en IndexedDB: ", request.result);
      updateInfoBox(request.result, request.result.evolutionData);
      updateSpriteGrandElement(request.result);
    } else {
      // Si el Pokémon no está en IndexedDB, inicia una cadena de solicitudes HTTP para obtener sus datos.
      fetch(`${url}${pokemonId}`)
        .then((response) => response.json())
        .then((data) => {
          savePokemonData(data); // Guarda los datos básicos del Pokémon en IndexedDB.
          const speciesUrl = data.species.url; // Obtiene la URL para solicitar información de la especie.
          fetch(speciesUrl)
            .then((response) => response.json())
            .then((speciesData) => {
              const evolutionChainUrl = speciesData.evolution_chain.url; // Obtiene la URL de la cadena de evolución.
              fetch(evolutionChainUrl)
                .then((response) => response.json())
                .then((evolutionData) => {
                  // Actualiza la interfaz de usuario con los datos completos del Pokémon.
                  updateInfoBox(data, evolutionData);
                  updateSpriteGrandElement(data);
                });
            });
        })
        .catch((error) => console.error("Error fetching data: ", error)); // Maneja errores en las solicitudes HTTP.
    }
  };
}

//Actualiza el elemento de la interfaz de usuario que muestra la imagen grande (oficial) del Pokémon.
function updateSpriteGrandElement(pokemonData) {
  // Verificación de la validez de los datos del Pokémon.
  if (
    !pokemonData ||
    !pokemonData.sprites ||
    !pokemonData.sprites.other["official-artwork"]
  ) {
    console.error("Datos de Pokémon incompletos o inválidos.");
    return;
  }
  // Extracción de URLs de los sprites oficial y shiny.
  const spriteGrand =
    pokemonData.sprites.other["official-artwork"].front_default;
  const spriteGrandShiny =
    pokemonData.sprites.other["official-artwork"].front_shiny;

  // Decisión basada en la variable global `isShiny` para elegir la imagen a mostrar.
  if (isShiny) {
    spriteGrandElement.src = spriteGrandShiny;
  } else {
    spriteGrandElement.src = spriteGrand;
  }
  // Actualización del elemento de la interfaz de usuario con la imagen y el ID del Pokémon.
  spriteGrandElement.setAttribute("data-id", pokemonData.id);
}

// Actualiza el cuadro de información en la interfaz de usuario con detalles sobre el Pokémon seleccionado y su cadena de evolución.
function updateInfoBox(pokemonData, evolutionData) {
  // Selecciona el elemento en el DOM que representa el cuadro de información para mostrar los detalles del Pokémon.
  const infoBox = document.querySelector(".pokemon_info_box");
  // Construye un array representando la cadena de evolución del Pokémon.
  const evolutionChain = buildEvolutionChain(evolutionData.chain);
  const hp = pokemonData.stats[0].base_stat;

  const attack = pokemonData.stats[1].base_stat;
  const spAttack = Math.floor(pokemonData.stats[3].base_stat);
  const spDefense = Math.floor(pokemonData.stats[4].base_stat);
  const defense = pokemonData.stats[2].base_stat;
  const speed = pokemonData.stats[5].base_stat;

  // Mapea los tipos y habilidades del Pokémon a una cadena de texto.
  const typeIcons = pokemonData.types
    .map(
      (type) =>
        `<span class="type-icon-${type.type.name}">${
          type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
        }</span>`
    )
    .join(" ");
  const abilities = pokemonData.abilities
    .map(
      (ability) =>
        ability.ability.name.charAt(0).toUpperCase() +
        ability.ability.name.slice(1)
    )
    .join(", ");

  //const evolutionChainImages = buildEvolutionChainImages(evolutionData.chain);

  // Actualiza el innerHTML del infoBox con los detalles del Pokémon, incluyendo tipos, altura, peso, habilidades y cadena de evolución.
  infoBox.innerHTML = `
        <div class="pokemon-info">
            <h2 class="name"> ${
              pokemonData.name.charAt(0).toUpperCase() +
              pokemonData.name.slice(1)
            }</h2>
            <p> Tipos: ${typeIcons}</p>
            <p> Altura: ${pokemonData.height / 10} m</p>
            <p> Peso: ${pokemonData.weight / 10} kg</p>
            <p> Habilidades: ${abilities}</p>
            <div class="stats">
                <div class="stat">
                    <div>
                        <span>Health:</span>
                        <span>${hp}</span>
                    </div>
                    <meter id="hp"
                    style="content:'HP';"
                    min="0" max="255"
                    low="70" high="120" optimum="150"
                    value="${hp}">
                    </meter>
                </div>
                <div class="stat">
                    <div>
                        <span>Attack:</span>
                        <span>${attack}</span>
                    </div>
                    <meter id="attack"
                    min="0" max="255"
                    low="70" high="120" optimum="150"
                    value="${attack}">
                    </meter>
                </div>
                <div class="stat">
                    <div>
                        <span>Defense:</span>
                        <span>${defense}</span>
                    </div>
                    <meter id="defense"
                    min="0" max="255"
                    low="70" high="120" optimum="150"
                    value="${defense}">
                    </meter>
                </div>    
                <div class="stat">
                    <div>
                        <span>Sp. Atk:</span>
                        <span>${spAttack}</span>
                    </div>
                    <meter id="spattack"
                    min="0" max="255"
                    low="70" high="120" optimum="150"
                    value="${spAttack}">
                    </meter>
                </div>   
                <div class="stat">
                  <div>
                    <span>Sp. Def:</span>
                    <span>${spDefense}</span>
                  </div>
                    <meter id="spdefense"
                    min="0" max="255"
                    low="70" high="120" optimum="150"
                    value="${spDefense}">
                    </meter>
                 </div>
      
                <div class="stat">
                  <div>
                    <span>Speed:</span>
                    <span>${speed}</span>
                  </div>
                  <meter id="speed"
                  min="0" max="255"
                  low="70" high="120" optimum="150"
                  value="${speed}">
                  </meter>
                </div>
                                  
                <div class="stat">
                  <div>
                    <span>Total:</span>
                    <span>${
                      speed + hp + attack + defense + spAttack + spDefense
                    }</span>
                  </div>
                  <meter id="total"
                  min="0" max="1530"
                  low="500" high="720" optimum="1000"
                  value="${
                    speed + hp + attack + defense + spAttack + spDefense
                  }">
                  </meter>
                </div>
            </div>
            <p>Cadena de evolución: ${evolutionChain}</p>
        </div>       
    `;
}

// Construye un array representando la cadena de evolución de un Pokémon.
function buildEvolutionChain(currentEvolution) {
  let evolutionChain = [];
  // Itera a través de la estructura de datos de la cadena de evolución para construir un array de nombres de especies.
  while (currentEvolution && currentEvolution.hasOwnProperty("species")) {
    evolutionChain.push(
      currentEvolution.species.name.charAt(0).toUpperCase() +
        currentEvolution.species.name.slice(1)
    );
    currentEvolution = currentEvolution.evolves_to[0];
  }
  return evolutionChain;
}

// construye un array representando las imagenes de la cadena de evolucion de un pokemon
/*function buildEvolutionChainImages(currentEvolution) {
  let evolutionChainImages = [];
  // Itera a través de la estructura de datos de la cadena de evolución para construir un array de imágenes.
  while (currentEvolution && currentEvolution.hasOwnProperty("species")) {
    const spriteUrl = buildPokemonSpriteUrl(currentEvolution.species.name, isShiny);
    evolutionChainImages.push(spriteUrl);
    currentEvolution = currentEvolution.evolves_to[0];
  }
  return evolutionChainImages;
}*/

// Determina y actualiza el sprite del Pokémon basado en si se seleccionó su versión normal o shiny.
function determinePokemonSprite(pokemon, isShiny) {
  // Selecciona el atributo apropiado basado en si el Pokémon es shiny o no.
  const spriteAttribute = isShiny ? "data-shiny" : "data-sprite-grand";
  // Obtiene la URL del sprite del atributo correspondiente.
  const spriteUrl = pokemon.getAttribute(spriteAttribute);
  if (spriteUrl) {
    // Si se encuentra la URL, actualiza el src del elemento spriteGrandElement.
    spriteGrandElement.src = spriteUrl;
  } else {
    // Si no se encuentra la URL, registra un error en la consola.
    console.error("Sprite URL not found");
  }
  // Registra en consola si el sprite se actualizó a shiny o normal.
  console.log(`Sprite updated to ${isShiny ? "shiny" : "normal"}`);
}

// Alterna el estado shiny del Pokémon actual y actualiza la interfaz de usuario en consecuencia.
function toggleShiny() {
  // Invierte el estado de isShiny.
  isShiny = !isShiny;
  // Actualiza la imagen del botón shiny basado en el nuevo estado.
  updateShinyButtonImage(isShiny);
  // Actualiza el sprite del Pokémon basado en el nuevo estado shiny.
  updatePokemonSprite(isShiny);
}

// Actualiza la imagen del botón shiny basado en si el Pokémon es shiny o no.
function updateShinyButtonImage(isShiny) {
  // Selecciona el elemento de imagen dentro del botón shiny.
  const shinyButtonImage = document.querySelector(".shiny_button > img");
  // Actualiza el src de la imagen basado en el estado shiny.
  shinyButtonImage.src = isShiny ? "..img/shiny-stars-active.png" : "..img/shiny-stars.png";
}

// Actualiza el sprite del Pokémon basado en si es shiny o no.
function updatePokemonSprite(isShiny) {
  const pokemonId = spriteGrandElement.getAttribute("data-id");
  // Check if pokemonId is valid
  if (!pokemonId) {
    console.error("Invalid Pokemon ID");
    return; // Exit the function if pokemonId is invalid
  }
  spriteGrandElement.src = buildPokemonSpriteUrl(pokemonId, isShiny);
  console.log(`Sprite updated to ${isShiny ? "shiny" : "normal"}`);
}

// Construye la URL del sprite del Pokémon basado en su ID y si es shiny o no.
function buildPokemonSpriteUrl(pokemonId, isShiny) {
  const shinyPath = isShiny ? "shiny/" : "";
  const url = `${BASE_SPRITE_URL}${shinyPath}${pokemonId}.png`;
  console.log(`Constructed URL: ${url}`); // Log the constructed URL for debugging
  return url;
}

