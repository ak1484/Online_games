export async function loadFirebaseConfig() {
  const candidates = [
    '../../infra/demo_database_config.json',
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
