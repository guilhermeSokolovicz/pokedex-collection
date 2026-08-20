const LIMIT = 10;
const STORAGE_KEY = 'pokedex-owned';
const GENERATIONS = [
  { id: 1, label: '1ª Geração (Kanto)', start: 1, end: 151 },
  { id: 2, label: '2ª Geração (Johto)', start: 152, end: 251 },
  { id: 3, label: '3ª Geração (Hoenn)', start: 252, end: 386 },
  { id: 4, label: '4ª Geração (Sinnoh)', start: 387, end: 493 },
  { id: 5, label: '5ª Geração (Unova)', start: 494, end: 649 },
  { id: 6, label: '6ª Geração (Kalos)', start: 650, end: 721 },
  { id: 7, label: '7ª Geração (Alola)', start: 722, end: 809 },
  { id: 8, label: '8ª Geração (Galar e Hisui)', start: 810, end: 905 },
  { id: 9, label: '9ª Geração (Paldea)', start: 906, end: 1025 },
  { id: 10, label: '10ª Geração (Winds and Waves)', start: 1026, end: 1026 }
];

const generationSelect = document.getElementById('generationSelect');
const pokemonList = document.getElementById('pokemonList');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageLabel = document.getElementById('pageLabel');
const ownedCount = document.getElementById('ownedCount');
const pokemonCardTemplate = document.getElementById('pokemonCardTemplate');

const state = {
  generation: 1,
  offset: 0,
  count: 0,
  owned: {}
};

const getGeneration = (generationId) => {
  return GENERATIONS.find((generation) => generation.id === Number(generationId)) || GENERATIONS[0];
};

const getPokemonIdFromUrl = (url) => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
};

const loadOwned = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.owned = raw ? JSON.parse(raw) : {};
  } catch (error) {
    state.owned = {};
  }
};

const saveOwned = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned));
  renderOwnedCounter();
};

const renderOwnedCounter = () => {
  const total = Object.keys(state.owned).length;
  ownedCount.textContent = `${total} Pokémon${total === 1 ? '' : 's'}`;
};

const updatePagination = () => {
  const currentPage = Math.floor(state.offset / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(state.count / LIMIT));

  pageLabel.textContent = `Página ${currentPage} de ${totalPages}`;
  prevButton.disabled = state.offset === 0;
  nextButton.disabled = state.offset + LIMIT >= state.count;
};

const renderPokemon = (pokemonListData) => {
  pokemonList.innerHTML = '';

  pokemonListData.forEach((pokemon) => {
    const card = pokemonCardTemplate.content.firstElementChild.cloneNode(true);
    const checkbox = card.querySelector('input');
    const image = card.querySelector('.pokemon-image');
    const number = card.querySelector('.pokemon-number');
    const name = card.querySelector('.pokemon-name');

    const isOwned = Boolean(state.owned[pokemon.id]);
    if (isOwned) {
      card.classList.add('owned');
      checkbox.checked = true;
    }

    checkbox.checked = isOwned;
    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        state.owned[pokemon.id] = {
          id: pokemon.id,
          name: pokemon.name,
          image: pokemon.image
        };
      } else {
        delete state.owned[pokemon.id];
      }

      saveOwned();
      card.classList.toggle('owned', Boolean(state.owned[pokemon.id]));
    });

    image.src = pokemon.image;
    image.alt = pokemon.name;
    number.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    name.textContent = pokemon.name;

    pokemonList.appendChild(card);
  });
};

const populateGenerationOptions = () => {
  generationSelect.innerHTML = GENERATIONS.map(
    (generation) => `<option value="${generation.id}">${generation.label}</option>`
  ).join('');
  generationSelect.value = String(state.generation);
};

const fetchPokemonPage = async () => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0');
    if (!response.ok) {
      throw new Error('Erro ao buscar os Pokémons');
    }

    const data = await response.json();
    const generation = getGeneration(state.generation);

    const generationPokemon = (data.results || [])
      .map((pokemon) => {
        const id = getPokemonIdFromUrl(pokemon.url);
        return {
          id,
          name: pokemon.name,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          url: pokemon.url
        };
      })
      .filter((pokemon) => pokemon.id >= generation.start && pokemon.id <= generation.end)
      .filter((pokemon) => Number.isInteger(pokemon.id));

    const paginated = generationPokemon.slice(state.offset, state.offset + LIMIT);

    state.count = generationPokemon.length;
    renderPokemon(paginated);
    updatePagination();
  } catch (error) {
    pokemonList.innerHTML = '<p>Não foi possível carregar os Pokémons no momento.</p>';
    updatePagination();
  }
};

const updateGeneration = async () => {
  state.generation = Number(generationSelect.value);
  state.offset = 0;
  await fetchPokemonPage();
};

generationSelect.addEventListener('change', updateGeneration);
prevButton.addEventListener('click', async () => {
  if (state.offset === 0) return;
  state.offset = Math.max(0, state.offset - LIMIT);
  await fetchPokemonPage();
});

nextButton.addEventListener('click', async () => {
  if (state.offset + LIMIT >= state.count) return;
  state.offset += LIMIT;
  await fetchPokemonPage();
});

const init = async () => {
  loadOwned();
  renderOwnedCounter();
  populateGenerationOptions();
  await fetchPokemonPage();
};

init();
