const LIMIT = 10;
const STORAGE_KEY = 'pokedex-owned';

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

const fetchGenerations = async () => {
  const response = await fetch('/api/generations');
  const generations = await response.json();

  generationSelect.innerHTML = generations
    .map(
      (generation) =>
        `<option value="${generation.id}">${generation.label}</option>`
    )
    .join('');

  generationSelect.value = String(state.generation);
};

const fetchPokemonPage = async () => {
  const response = await fetch(
    `/api/pokemon?generation=${state.generation}&offset=${state.offset}&limit=${LIMIT}`
  );

  if (!response.ok) {
    throw new Error('Erro ao carregar os pokémons');
  }

  const data = await response.json();
  state.count = data.count;
  renderPokemon(data.results || []);
  updatePagination();
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
  await fetchGenerations();
  await fetchPokemonPage();
};

init();
