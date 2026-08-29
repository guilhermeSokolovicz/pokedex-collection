const LIMIT = 30;
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

const scrollToTop = () => {
  if (typeof window !== 'undefined' && window.scrollTo) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
      .filter((pokemon) => Number.isInteger(pokemon.id))
      .filter((pokemon) => pokemon.id >= generation.start && pokemon.id <= generation.end);

    const paginated = generationPokemon.slice(state.offset, state.offset + LIMIT);

    state.count = generationPokemon.length;
    renderPokemon(paginated);
    updatePagination();
    scrollToTop();
  } catch (error) {
    pokemonList.innerHTML = '<p>Não foi possível carregar os Pokémons no momento.</p>';
    updatePagination();
    scrollToTop();
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

// ----- import / export helpers -----

const exportOwned = () => {
  const ids = Object.keys(state.owned)
    .map((k) => Number(k))
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
  const text = ids.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pokedex-owned.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const openImportModal = () => {
  const modal = document.getElementById('importModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');
};

const closeImportModal = () => {
  const modal = document.getElementById('importModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
};

const importFromText = (text) => {
  if (!text) return { imported: 0, invalid: 0 };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const ids = [];
  let invalid = 0;
  for (const line of lines) {
    const m = line.match(/(\d+)/);
    if (m) {
      const id = Number(m[1]);
      if (Number.isInteger(id) && id > 0) ids.push(id);
      else invalid++;
    } else {
      invalid++;
    }
  }

  const uniqueIds = Array.from(new Set(ids));
  uniqueIds.forEach((id) => {
    if (!state.owned[id]) {
      state.owned[id] = {
        id,
        // temporary name (will try to fetch real name later)
        name: `#${id}`,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
      };
    }
  });

  saveOwned();

  // fetch real names in background
  fetchNamesForIds(uniqueIds).catch(() => {});

  return { imported: uniqueIds.length, invalid };
};

const fetchNamesForIds = async (ids) => {
  const fetches = ids.map((id) =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((r) => {
      if (!r.ok) throw new Error('not found');
      return r.json();
    })
  );

  const results = await Promise.allSettled(fetches);
  let updated = 0;
  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      const id = ids[idx];
      const data = res.value;
      if (data && state.owned[id]) {
        state.owned[id].name = data.name;
        state.owned[id].image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        updated++;
      }
    }
  });

  if (updated > 0) saveOwned();
};

// bind import/export UI
const setupImportExportUI = () => {
  const exportBtn = document.getElementById('exportButton');
  const importBtn = document.getElementById('importButton');
  const modal = document.getElementById('importModal');
  const closeBtn = document.getElementById('closeImport');
  const doImportBtn = document.getElementById('doImport');
  const textarea = document.getElementById('importTextarea');

  if (exportBtn) exportBtn.addEventListener('click', exportOwned);
  if (importBtn) importBtn.addEventListener('click', openImportModal);
  if (closeBtn) closeBtn.addEventListener('click', closeImportModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeImportModal(); });
  if (doImportBtn && textarea) {
    doImportBtn.addEventListener('click', () => {
      const text = textarea.value;
      const result = importFromText(text);
      alert(`Importados: ${result.imported}. Linhas inválidas: ${result.invalid}`);
      textarea.value = '';
      closeImportModal();
      // re-render current page after import
      renderOwnedCounter();
      populateGenerationOptions();
      fetchPokemonPage();
    });
  }
};

const init = async () => {
  loadOwned();
  renderOwnedCounter();
  populateGenerationOptions();
  setupImportExportUI();
  await fetchPokemonPage();
};

init();
