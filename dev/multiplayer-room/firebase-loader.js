export async function loadFirebaseConfig() {
  const repoName = '/Online_games'; // The GitHub Pages repo path
  const candidates = [
    `${repoName}/infra/demo_database_config.json`, // Absolute path from root
    '../infra/demo_database_config.json',
    '/infra/demo_database_config.json',
    './infra/demo_database_config.json'
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
    throw new Error('Firebase configuration could not be loaded. Please ensure infra/demo_database_config.json exists or create firebase-config.js');
  }
}
