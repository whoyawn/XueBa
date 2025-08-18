# XueBa Client - Gleam + Lustre App

This is a Gleam + Lustre single-page application for searching Spotify tracks and displaying lyrics.

## Development

To run the development server:

```bash
gleam run -m lustre/dev start
```

## Building for Production

To build the application:

```bash
gleam build
```

This will generate the JavaScript files in `priv/static/`.

## Deploying to GitHub Pages

1. Build the application: `gleam build`
2. Copy the following files to your GitHub Pages repository:
   - `index.html`
   - `404.html`
   - `CNAME` (for custom domain xue8.app)
   - `priv/static/app.min.mjs`
   - `manifest.toml` (if you have one)

3. Enable GitHub Pages in your repository settings
4. Configure custom domain: `xue8.app`

## SPA Routing

This application uses client-side routing with a special setup for GitHub Pages:

- `404.html` handles redirects for SPA routes
- `index.html` processes the redirected URLs and restores the original path
- The Gleam app handles the routing logic

### Search Route Handling

For search routes specifically:
1. User visits: `https://xue8.app/search?q=spotify-url`
2. GitHub Pages returns 404.html (since /search doesn't exist as a file)
3. 404.html detects it's a search route and redirects to: `https://xue8.app/?q=spotify-url`
4. Your Gleam app loads and processes the query parameter directly

### Other Route Handling

For other routes:
1. User visits: `https://xue8.app/some-route`
2. GitHub Pages returns 404.html
3. 404.html redirects to: `https://xue8.app/?path=/some-route`
4. index.html processes the path parameter and restores the original URL
5. Your Gleam app handles the routing

This approach ensures that direct links to your app routes work correctly on GitHub Pages, with special handling for search URLs to maintain compatibility with your existing Gleam app logic.
