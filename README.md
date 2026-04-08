# Calculadora de Hondt

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
