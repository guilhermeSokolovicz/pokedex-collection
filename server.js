const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

const extractPokemonId = (url) => {
  const matches = url.match(/\/pokemon\/(\d+)\/?$/);
  return matches ? Number(matches[1]) : null;
};

const getGenerationRange = (generationId) => {
  const generation = GENERATIONS.find((item) => item.id === Number(generationId));
  return generation || GENERATIONS[0];
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/generations', (req, res) => {
  res.json(GENERATIONS);
});

app.get('/api/pokemon', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const generationId = Number(req.query.generation) || 1;
    const generation = getGenerationRange(generationId);

    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0');
    if (!response.ok) {
      throw new Error(`PokeAPI error: ${response.status}`);
    }

    const data = await response.json();

    const allPokemon = (data.results || []).map((pokemon) => ({
      ...pokemon,
      id: extractPokemonId(pokemon.url),
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${extractPokemonId(pokemon.url)}.png`
    }));

    const generationPokemon = allPokemon.filter(
      (pokemon) => pokemon.id >= generation.start && pokemon.id <= generation.end
    );

    const paginatedResults = generationPokemon.slice(offset, offset + limit);

    res.json({
      count: generationPokemon.length,
      limit,
      offset,
      next: offset + limit < generationPokemon.length ? offset + limit : null,
      previous: offset - limit >= 0 ? offset - limit : null,
      generation: generation.label,
      results: paginatedResults.map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        url: pokemon.url
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Não foi possível carregar os Pokémons no momento.'
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
