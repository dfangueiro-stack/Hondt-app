# Eleições - Distribuição de mandatos

Web app estatica para calcular a atribuicao de mandatos por partido atraves do metodo de Hondt.

## Abrir no browser

Basta abrir o ficheiro `index.html` diretamente no browser.

Se preferires servir localmente:

- `python -m http.server`
- `npx serve .`

## O que faz

- Suporta entre 2 e 20 listas/partidos
- Suporta entre 1 e 300 mandatos
- Gera automaticamente os campos para introduzir nome e votos de cada lista
- Calcula os mandatos atribuidos pelo metodo de Hondt
- Mostra resumo final, ordem de atribuicao dos mandatos e tabela completa de quocientes
- Exporta um resumo em PDF usando a impressao do browser

## Ficheiros principais

- `index.html`: estrutura da app
- `styles.css`: layout, responsividade e estilos de impressao
- `src/app.js`: logica do metodo de Hondt, rendering e exportacao PDF

## Publicar no GitHub Pages

O projeto ja fica preparado para deploy automatico com GitHub Actions.

1. Cria um repositorio no GitHub e envia estes ficheiros para a branch principal.
2. No GitHub, abre `Settings > Pages`.
3. Em `Build and deployment`, escolhe `Source: GitHub Actions`.
4. Faz push para a branch `main` e aguarda o workflow terminar.
5. O site ficara disponivel no URL do GitHub Pages desse repositorio.

O workflow de publicacao esta em `.github/workflows/deploy-pages.yml`.
