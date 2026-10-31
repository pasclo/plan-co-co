# Plan Co-Co 🥘

Planificador de cenas y lista de la compra, pensado para el móvil.

- **Cenas de la semana** generadas según presupuesto, despensa, dieta/alergias y lo que comen los niños en el cole.
- **Menú del colegio**: se sube el PDF de cada colegio (castellano o catalán), se revisa y se guarda.
- **Lista de la compra** por secciones de Mercadona, redondeada a paquetes enteros, con precio y enlace a cada producto.
- **Precios de Mercadona** (CP 08024) descargados cada lunes por GitHub Actions (`scripts/fetch-mercadona.mjs`).
- Funciona sin conexión y se instala en la pantalla de inicio. Los datos se guardan solo en el móvil (con copia de seguridad).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # pruebas
npm run build    # versión final en dist/
npm run prices   # descargar precios de Mercadona (necesita acceso a tienda.mercadona.es)
```

## Publicación

El workflow `.github/workflows/deploy.yml` descarga precios, pasa las pruebas y publica en GitHub Pages
en cada push a `main` y cada lunes. Hay que activar Pages en *Settings → Pages → Source: GitHub Actions*.
