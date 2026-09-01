export async function loadFirebaseConfig() {
  // For local development, use absolute paths from current host
  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]+$/, '');

  const candidates = [
    baseUrl + '../../infra/demo_database_config.json',
    baseUrl + 'infra/demo_database_config.json',
    baseUrl + '../infra/demo_database_config.json',
    '/Online_games/infra/demo_database_config.json',
    '/infra/demo_database_config.json',
    baseUrl + 'demo_database_config.json'
  ];

  console.log('Trying to load Firebase config from:', candidates);

  for (const path of candidates) {
    try {
      console.log('Fetching:', path);
      const resp = await fetch(path, { cache: 'no-store' });
      if (!resp.ok) {
        console.log('Not OK:', resp.status, path);
        continue;
      }
      const json = await resp.json();
      console.log('Got config:', json);
      if (json && json.firebase) return json.firebase;
    } catch (e) {
      console.warn(`Failed to fetch config from ${path}:`, e);
      // ignore and try next
    }
  }

  // Fallback to local firebase-config.js (the expected developer file)
  try {
    const mod = await import('./firebase-config.js');
    return mod.firebaseConfig;
  } catch (e) {
    throw new Error('Firebase configuration could not be loaded. Please ensure GitHub Secrets are set and the GitHub Action has deployed the site, or check your GitHub Pages branch settings.');
  }
}
