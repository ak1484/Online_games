export async function loadFirebaseConfig() {
  // Dynamically resolve relative to this module's URL to work on any host/path
  const resolvedPath = new URL('../../infra/demo_database_config.json', import.meta.url).href;

  const candidates = [
    resolvedPath,
    '../../infra/demo_database_config.json',
    '/Online_games/infra/demo_database_config.json',
    '/infra/demo_database_config.json'
  ];

  for (const path of candidates) {
    try {
      const resp = await fetch(path, { cache: 'no-store' });
      if (!resp.ok) continue;
      const json = await resp.json();
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
