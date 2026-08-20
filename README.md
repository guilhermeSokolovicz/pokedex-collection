# PokeDex

Projeto estático para listar Pokémons da PokeAPI, aplicar filtro por geração e salvar a coleção marcada no `localStorage` do navegador.

## Requisitos

- Node.js 18+
- npm

## Como rodar localmente

1. Instale as dependências:
   npm install
2. Inicie o servidor estático:
   npm start
3. Acesse no navegador:
   http://localhost:3000

## GitHub Pages

Este projeto foi ajustado para rodar como página estática no GitHub Pages. Não depende de back-end/Express, já que a chamada para a PokeAPI é feita diretamente no navegador.

### Deploy no GitHub Pages

1. Faça push do conteúdo do projeto para o repositório GitHub.
2. No GitHub, vá em Settings > Pages.
3. Selecione a branch principal (ou `gh-pages`) e a pasta raiz.
4. Salve e aguarde a publicação.
5. A URL ficará algo como:
   https://seu-usuario.github.io/seu-repositorio/

## Funcionalidades

- Listagem paginada de Pokémons
- Filtro por geração
- Exibição de número, nome e imagem
- Marcação de Pokémons que você já possui
- Persistência no cache do navegador (`localStorage`)
