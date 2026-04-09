# Eleições - Distribuição de mandatos (Método de Hondt)

Static web app to calculate party seat allocation using the D'Hondt method.

## Open in the browser

Just open the `index.html` file directly in the browser.

If you prefer to serve it locally:

- `python -m http.server`
- `npx serve .`

## Features

- Supports between 2 and 20 party lists
- Supports between 1 and 300 seats
- Automatically generates fields to enter each list name and vote count
- Calculates seat allocation using the D'Hondt method
- Shows the final summary, seat assignment order, and full quotient table
- Exports a PDF summary using the browser print flow

## Main files

- `index.html`: application structure
- `styles.css`: layout, responsiveness, and print styles
- `src/app.js`: D'Hondt logic, rendering, and PDF export

## Publish to GitHub Pages

The project is already prepared for automatic deployment with GitHub Actions.

1. Create a GitHub repository and push these files to the main branch.
2. In GitHub, open `Settings > Pages`.
3. Under `Build and deployment`, choose `Source: GitHub Actions`.
4. Push to the `main` branch and wait for the workflow to finish.
5. The site will be available at that repository's GitHub Pages URL.

The deployment workflow is in `.github/workflows/deploy-pages.yml`.
