const STORAGE_KEY = 'pokedex-owned';
const missingList = document.getElementById('missingList');
const summaryCount = document.getElementById('summaryCount');
const printButton = document.getElementById('printButton');

const loadOwned = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const getPokemonIdFromUrl = (url) => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
};

const renderMissingList = (pokemonList) => {
  missingList.innerHTML = '';

  if (!pokemonList.length) {
    missingList.innerHTML = '<div class="missing-empty">Você já tem todos os Pokémons da coleção.</div>';
    summaryCount.textContent = '0 Pokémons faltando';
    return;
  }

  pokemonList.forEach((pokemon) => {
    const card = document.createElement('article');
    card.className = 'print-card';

    const number = document.createElement('span');
    number.className = 'print-number';
    number.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

    const name = document.createElement('h2');
    name.className = 'print-name';
    name.textContent = pokemon.name;

    card.append(number, name);
    missingList.appendChild(card);
  });

  summaryCount.textContent = `${pokemonList.length} Pokémon${pokemonList.length === 1 ? '' : 's'} faltando`;
};

const fetchMissingPokemon = async () => {
  const owned = loadOwned();

  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0');
  if (!response.ok) {
    throw new Error('Erro ao buscar os Pokémons');
  }

  const data = await response.json();
  const missing = (data.results || [])
    .map((pokemon) => {
      const id = getPokemonIdFromUrl(pokemon.url);
      return id !== null ? { id, name: pokemon.name } : null;
    })
    .filter(Boolean)
    .filter((pokemon) => !owned[pokemon.id])
    .sort((a, b) => a.id - b.id);

  renderMissingList(missing);
};

printButton.addEventListener('click', () => {
  window.print();
});

fetchMissingPokemon().catch(() => {
  missingList.innerHTML = '<div class="missing-empty">Não foi possível carregar a lista de Pokémons faltantes.</div>';
  summaryCount.textContent = 'Erro ao carregar';
});
