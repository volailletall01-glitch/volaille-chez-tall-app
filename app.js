const DB_NAME = 'poulet-pro';
const DB_VERSION = 1;
const STORE_NAMES = ['bands', 'daily_logs', 'inventory_items', 'inventory_movements', 'sales', 'charges', 'clients', 'meta'];
const ICONS = {
  dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
  bands: '<path d="M4 20V8l8-5 8 5v12"/><path d="M9 20v-6h6v6M3 20h18"/>',
  daily: '<path d="M8 3v4m8-4v4M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="m9 15 2 2 4-4"/>',
  stock: '<path d="M3 7 12 3l9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  sales: '<path d="M3 6h2l2 11h11l3-8H6"/><circle cx="9" cy="21" r="1"/><circle cx="17" cy="21" r="1"/><path d="M10 10h6m-3-3v6"/>',
  expenses: '<path d="M12 3v18m5-13a3 3 0 0 0-3-2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1-3-2"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  stats: '<path d="M4 20V10m6 10V4m6 16v-7m6 7V7"/><path d="M3 20h18"/>',
  sync: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1.1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1.1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1.1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1.1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)"/>',
  bird: '<path d="M20 12c0 4-3 7-8 7H8l-3 2 1-4c-2-2-3-4-3-7 0-4 3-7 8-7s9 4 9 9Z"/><circle cx="15" cy="10" r="1"/>',
  orders: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M8 12h8M8 16h5"/>',
  feed: '<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v9l8 4 8-4V8M12 12v9"/>',
  water: '<path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z"/><path d="M9 16a3 3 0 0 0 3 2"/>',
  money: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/>',
  box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
};
const PAGE_LABELS = { dashboard: 'Vue d’ensemble', bands: 'Bandes', daily: 'Suivi quotidien', sales: 'Ventes', orders: 'Mes Commandes', expenses: 'Charges', annual: 'Statistiques annuelles' };
const ORDER_STATUS_LABELS = { en_attente: 'En attente', validee: 'Validée', refusee: 'Refusée' };
const SUPABASE = window.SUPABASE_CONFIG || {};
const ordersState = { orders: [], lastFetch: 0, error: null, publicStock: null, loading: false };
const CATEGORY_LABELS = {
  starter: 'Aliment démarrage', grower: 'Aliment croissance', finisher: 'Aliment finition',
  veterinary: 'Produits vétérinaires', bedding: 'Litière / copeaux', heating: 'Gaz / chauffage', other: 'Autre intrant',
  health: 'Santé / prophylaxie', labor: 'Main-d’œuvre', water_energy: 'Eau / électricité',
  delivery: 'Transport livraison client', maintenance: 'Entretien',
};
const CHANNEL_LABELS = { wholesale: 'Grossiste / revendeur', restaurant: 'Restaurant', supermarket: 'Supermarché', retail: 'Détail / comptoir', other: 'Autre' };
const PAYMENT_LABELS = { cash: 'Espèces', mobile_money: 'Mobile Money', transfer: 'Virement', credit: 'Crédit client' };
let db;
let logoJpeg = null;
let currentPage = 'dashboard';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const uid = () => crypto.randomUUID();
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const currency = (amount) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(amount) || 0)} FCFA`;
const number = (amount, digits = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(amount) || 0);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dateLabel = (value) => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '—';
const daysSince = (date) => Math.max(0, Math.floor((new Date(`${today()}T12:00:00`) - new Date(`${date}T12:00:00`)) / 86400000));
const sum = (items, getter) => items.reduce((total, item) => total + (Number(getter(item)) || 0), 0);
const isArchived = (band) => Boolean(band && band.archived_at);
const isOpenBand = (band) => Boolean(band) && !isArchived(band) && band.status !== 'closed';
const visibleBands = (snapshot) => snapshot.bands.filter((band) => !isArchived(band));
const activeBandIds = (snapshot) => new Set(snapshot.bands.filter((band) => !isArchived(band)).map((band) => band.id));

async function preloadLogo() {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = './icons/volaille-chez-tall-512.png';
    });
    const native = Math.min(img.width || 512, img.height || 512);
    const target = Math.min(native, 256);
    const ratio = target / (img.width || target);
    const w = Math.max(1, Math.round((img.width || target) * ratio));
    const h = Math.max(1, Math.round((img.height || target) * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64 = dataUrl.split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    logoJpeg = { data: bytes, width: w, height: h };
  } catch (error) {
    console.error('Logo non charge', error);
    logoJpeg = null;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const name of STORE_NAMES) {
        if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Impossible d’ouvrir le stockage local.'));
  });
}

function localReadAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error(`Lecture impossible : ${storeName}.`));
  });
}

function localReadMeta(key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction('meta', 'readonly').objectStore('meta').get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error || new Error('Lecture des paramètres impossible.'));
  });
}

function localWriteMeta(key, value) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('meta', 'readwrite');
    transaction.objectStore('meta').put({ id: key, value });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Enregistrement des paramètres impossible.'));
  });
}

async function localDeleteRecord(storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Suppression impossible.'));
  });
}

async function localDeleteRecords(storeName, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    for (const id of unique) store.delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Suppression impossible.'));
  });
}

async function localDeleteLogsForBand(bandId) {
  const logs = (await localReadAll('daily_logs')).filter((log) => log.batch_id === bandId);
  if (!logs.length) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('daily_logs', 'readwrite');
    const store = transaction.objectStore('daily_logs');
    for (const log of logs) store.delete(log.id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Suppression de l’historique impossible.'));
  });
}

async function localSaveRecords(entries) {
  const timestamp = new Date().toISOString();
  const prepared = entries.map(({ store, record }) => ({
    store, record: { ...record, updated_at: timestamp },
  }));
  const names = [...new Set(prepared.map((entry) => entry.store))];
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(names, 'readwrite');
    for (const entry of prepared) {
      transaction.objectStore(entry.store).put(entry.record);
    }
    transaction.oncomplete = () => resolve(prepared.map((entry) => entry.record));
    transaction.onerror = () => reject(transaction.error || new Error('Enregistrement local impossible.'));
    transaction.onabort = () => reject(transaction.error || new Error('Enregistrement local annulé.'));
  });
}

async function localSaveRecord(storeName, record) {
  const [saved] = await localSaveRecords([{ store: storeName, record }]);
  return saved;
}

async function localGetSnapshot() {
  const [bands, logs, items, movements, sales, charges, clients] = await Promise.all([
    localReadAll('bands'), localReadAll('daily_logs'), localReadAll('inventory_items'), localReadAll('inventory_movements'),
    localReadAll('sales'), localReadAll('charges'), localReadAll('clients'),
  ]);
  return { bands, logs, items, movements, sales, charges, clients };
}

/* ---------------------------------------------------------------------------
   Authentification Supabase + synchronisation cloud
   --------------------------------------------------------------------------- */
const AUTH_STORAGE_KEY = 'volaille-chez-tall-session-v1';
const PHONE_DOMAIN = 'phone.volaille-cheztall.app';
const REMOTE_SCHEMA = {
  bands: ['id', 'organization_id', 'name', 'strain', 'arrival_date', 'initial_count', 'supplier', 'target_weight_kg', 'target_age_days', 'chick_unit_cost', 'transport_cost', 'chick_total_cost', 'status', 'archived_at', 'created_at', 'updated_at'],
  daily_logs: ['id', 'organization_id', 'batch_id', 'log_date', 'mortality', 'culls', 'note', 'feed_starter_kg', 'feed_grower_kg', 'feed_finisher_kg', 'water_liters', 'avg_weight_kg', 'feed_cost', 'health_cost', 'other_cost', 'created_at', 'updated_at'],
  sales: ['id', 'organization_id', 'batch_id', 'sale_date', 'client_id', 'client_name', 'client_phone', 'client_address', 'heads', 'unit_weight_kg', 'total_weight_kg', 'price_per_kg', 'price_per_head', 'total_amount', 'paid_amount', 'payment_method', 'payment_status', 'channel', 'created_at', 'updated_at'],
  charges: ['id', 'organization_id', 'batch_id', 'charge_date', 'category', 'description', 'amount', 'created_at', 'updated_at'],
};
const REMOTE_TABLES = Object.keys(REMOTE_SCHEMA);

let session = null;
let remoteCache = { bands: [], daily_logs: [], sales: [], charges: [] };
let remoteSettings = {};
let dataLoaded = false;
let authMode = 'signin';

function readStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.access_token && parsed.user ? parsed : null;
  } catch (error) {
    return null;
  }
}

function persistSession(value) {
  session = value;
  try {
    if (value) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Session non persistée', error);
  }
}

function sessionIsFresh() {
  return Boolean(session && session.expires_at && session.expires_at - 30000 > Date.now());
}

async function authRequest(path, { method = 'POST', body, token } = {}) {
  const response = await fetch(`${SUPABASE.url}${path}`, {
    method,
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${token || SUPABASE.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (error) { payload = null; }
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function storeSession(payload) {
  if (!payload || !payload.access_token) throw new Error('Connexion impossible : réponse inattendue du serveur.');
  persistSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
    user: payload.user || session?.user || null,
  });
  return session;
}

async function refreshSession() {
  if (!session?.refresh_token) throw new Error('Session expirée. Reconnectez-vous.');
  const payload = await authRequest('/auth/v1/token?grant_type=refresh_token', {
    body: { refresh_token: session.refresh_token },
  });
  storeSession(payload);
  return session;
}

async function ensureSession() {
  if (!session) session = readStoredSession();
  if (!session) return null;
  if (sessionIsFresh()) return session;
  try {
    await refreshSession();
    if (!session.user?.id) {
      const user = await authRequest('/auth/v1/user', { method: 'GET', token: session.access_token });
      persistSession({ ...session, user });
    }
    return session;
  } catch (error) {
    console.warn('Session expirée', error);
    persistSession(null);
    return null;
  }
}

function normalizeIdentifier(raw) {
  const value = String(raw || '').trim();
  if (!value) throw new Error('Entrez votre email ou votre numéro de téléphone.');
  if (value.includes('@')) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) throw new Error('Adresse email invalide.');
    return value.toLowerCase();
  }
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 6) throw new Error('Numéro de téléphone invalide (6 chiffres minimum).');
  return `${digits}@${PHONE_DOMAIN}`;
}

function phoneFromIdentifier(email) {
  return email && email.endsWith(`@${PHONE_DOMAIN}`) ? email.split('@')[0] : null;
}

function normalizeWhatsAppNumber(raw, { required = true } = {}) {
  const value = String(raw || '').trim();
  if (!value) {
    if (required) throw new Error('Entrez votre numéro WhatsApp.');
    return '';
  }
  const compact = value.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,16}$/.test(compact)) {
    throw new Error('Numéro WhatsApp invalide. Utilisez le format international, ex. +223 78 31 48 18.');
  }
  let digits = compact.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (digits.length === 8) digits = `223${digits}`;
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Numéro WhatsApp invalide. Indiquez l’indicatif pays, ex. +223 78 31 48 18.');
  }
  return digits;
}

function formatWhatsAppNumber(digits) {
  const value = String(digits || '').replace(/\D/g, '');
  return value ? `+${value}` : '';
}

async function signInWithIdentifier(identifier, password) {
  const email = normalizeIdentifier(identifier);
  const payload = await authRequest('/auth/v1/token?grant_type=password', {
    body: { email, password },
  });
  storeSession(payload);
  await upsertProfile();
  return session;
}

async function signUpWithIdentifier(identifier, password, whatsapp) {
  const email = normalizeIdentifier(identifier);
  const normalizedWhatsApp = normalizeWhatsAppNumber(whatsapp);
  const payload = await authRequest('/auth/v1/signup', {
    body: {
      email,
      password,
      data: { phone: phoneFromIdentifier(email) || normalizedWhatsApp, whatsapp: normalizedWhatsApp },
    },
  });
  if (!payload?.access_token) {
    throw new Error('Compte créé. La confirmation par email est encore active : validez le lien reçu puis reconnectez-vous.');
  }
  storeSession(payload);
  const saved = await upsertProfile('', normalizedWhatsApp);
  if (saved) await publishManagerWhatsApp(normalizedWhatsApp);
  return session;
}

async function upsertProfile(displayName = '', whatsapp = '') {
  if (!session?.user?.id) return false;
  const email = session.user.email || '';
  const payload = {
    id: session.user.id,
    email,
    phone: phoneFromIdentifier(email) || whatsapp || '',
    display_name: displayName || session.user.user_metadata?.display_name || '',
    updated_at: new Date().toISOString(),
  };
  if (whatsapp) payload.whatsapp = whatsapp;
  try {
    await apiRequest('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      body: payload,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    return true;
  } catch (error) {
    console.warn('Profil non synchronisé', error);
    return false;
  }
}

async function loadProfileWhatsApp() {
  if (!session?.user?.id) return '';
  try {
    const rows = await apiRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=whatsapp`);
    const value = Array.isArray(rows) && rows[0] ? rows[0].whatsapp : '';
    return String(value || '').replace(/\D/g, '');
  } catch (error) {
    console.warn('Numéro WhatsApp du profil illisible', error);
    return '';
  }
}

async function publishManagerWhatsApp(whatsapp) {
  const digits = String(whatsapp || '').replace(/\D/g, '');
  if (!digits) return false;
  try {
    const rows = await supabaseRequest('/rest/v1/app_config?id=eq.1&select=manager_whatsapp');
    const current = Array.isArray(rows) && rows[0]
      ? String(rows[0].manager_whatsapp || '').replace(/\D/g, '')
      : '';
    if (current === digits) return true;
    await supabaseRequest('/rest/v1/app_config?id=eq.1', {
      method: 'PATCH',
      body: { manager_whatsapp: digits },
      headers: { Prefer: 'return=minimal' },
    });
    return true;
  } catch (error) {
    console.warn('Numéro WhatsApp du gestionnaire non publié', error);
    return false;
  }
}

async function syncManagerWhatsApp() {
  const whatsapp = await loadProfileWhatsApp();
  if (!whatsapp) return '';
  await publishManagerWhatsApp(whatsapp);
  return whatsapp;
}

async function signOut() {
  const token = session?.access_token;
  persistSession(null);
  remoteCache = { bands: [], daily_logs: [], sales: [], charges: [] };
  remoteSettings = {};
  dataLoaded = false;
  if (token) {
    fetch(`${SUPABASE.url}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

async function apiRequest(path, { method = 'GET', body, headers = {}, prefer } = {}) {
  if (!SUPABASE.url || !SUPABASE.anonKey) throw new Error('Supabase n’est pas configuré.');
  if (!session?.access_token) throw new Error('Vous devez être connecté.');
  const response = await fetch(`${SUPABASE.url}${path}`, {
    method,
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 && session.refresh_token) {
    await refreshSession();
    return apiRequest(path, { method, body, headers, prefer });
  }
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (error) { payload = null; }
  if (!response.ok) {
    const message = payload?.message || payload?.hint || payload?.details || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function cleanRecord(storeName, record) {
  const allowed = REMOTE_SCHEMA[storeName];
  const payload = { user_id: session.user.id };
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const value = record[key];
    if (value === undefined) continue;
    payload[key] = value === '' ? null : value;
  }
  if (!payload.id) payload.id = uid();
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  payload.updated_at = new Date().toISOString();
  return payload;
}

async function cacheRemoteSnapshot() {
  if (!session?.user?.id) return;
  const snapshotData = {
    tables: remoteCache,
    settings: remoteSettings,
  };
  if (db) {
    try {
      await localWriteMeta(`remote-snapshot:${session.user.id}`, snapshotData);
    } catch (error) {
      console.warn('Cache local IndexedDB indisponible', error);
    }
  }
  try {
    localStorage.setItem(`remote-snapshot:${session.user.id}`, JSON.stringify(snapshotData));
  } catch (error) {
    /* stockage LocalStorage saturé ou restreint par WebKit */
  }
}

async function loadRemoteData({ silent = false } = {}) {
  if (!session?.access_token) throw new Error('Vous devez être connecté.');
  const queries = REMOTE_TABLES.map((table) => apiRequest(`/rest/v1/${table}?select=*`));
  const results = await Promise.all(queries);
  REMOTE_TABLES.forEach((table, index) => {
    remoteCache[table] = Array.isArray(results[index]) ? results[index] : [];
  });
  const settings = await apiRequest('/rest/v1/app_settings?select=key,value');
  remoteSettings = {};
  (settings || []).forEach((row) => { remoteSettings[row.key] = row.value; });
  dataLoaded = true;
  await cacheRemoteSnapshot();
  if (!silent) console.info('Données synchronisées', REMOTE_TABLES.map((table) => `${table}:${remoteCache[table].length}`).join(' '));
  return getSnapshot();
}

function readAll(storeName) {
  if (!REMOTE_TABLES.includes(storeName)) return Promise.resolve([]);
  return Promise.resolve([...(remoteCache[storeName] || [])]);
}

function readMeta(key) {
  return Promise.resolve(remoteSettings[key] ?? null);
}

async function writeMeta(key, value) {
  await apiRequest('/rest/v1/app_settings?on_conflict=user_id,key', {
    method: 'POST',
    body: { user_id: session.user.id, key, value, updated_at: new Date().toISOString() },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  remoteSettings[key] = value;
  await cacheRemoteSnapshot();
  return value;
}

async function saveRecords(entries) {
  const saved = [];
  for (const entry of entries) {
    const payload = cleanRecord(entry.store, entry.record);
    const [row] = await apiRequest(`/rest/v1/${entry.store}?on_conflict=id`, {
      method: 'POST',
      body: payload,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    const list = remoteCache[entry.store] || (remoteCache[entry.store] = []);
    const index = list.findIndex((item) => item.id === row.id);
    if (index >= 0) list[index] = row; else list.push(row);
    saved.push(row);
  }
  await cacheRemoteSnapshot();
  return saved;
}

async function saveRecord(storeName, record) {
  const [saved] = await saveRecords([{ store: storeName, record }]);
  return saved;
}

async function deleteRecord(storeName, id) {
  if (!id) return;
  await apiRequest(`/rest/v1/${storeName}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  remoteCache[storeName] = (remoteCache[storeName] || []).filter((item) => item.id !== id);
  await cacheRemoteSnapshot();
}

async function deleteRecords(storeName, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;
  const filter = unique.join(',');
  await apiRequest(`/rest/v1/${storeName}?id=in.(${filter})`, { method: 'DELETE' });
  remoteCache[storeName] = (remoteCache[storeName] || []).filter((item) => !unique.includes(item.id));
  await cacheRemoteSnapshot();
}

async function deleteLogsForBand(bandId) {
  if (!bandId) return;
  await deleteRecordsByBand('daily_logs', bandId);
}

async function deleteRecordsByBand(storeName, bandId) {
  if (!bandId) return;
  await apiRequest(`/rest/v1/${storeName}?batch_id=eq.${encodeURIComponent(bandId)}`, { method: 'DELETE' });
  remoteCache[storeName] = (remoteCache[storeName] || []).filter((record) => record.batch_id !== bandId);
  await cacheRemoteSnapshot();
}

async function getSnapshot() {
  if (!dataLoaded) {
    try {
      await loadRemoteData();
    } catch (error) {
      let cached = null;
      try {
        if (db && session?.user?.id) cached = await localReadMeta(`remote-snapshot:${session.user.id}`);
      } catch (cacheError) {
        console.warn('Cache local IndexedDB illisible', cacheError);
      }
      if (!cached && session?.user?.id) {
        try {
          const raw = localStorage.getItem(`remote-snapshot:${session.user.id}`);
          if (raw) cached = JSON.parse(raw);
        } catch (storageError) {
          console.warn('Cache LocalStorage de secours illisible', storageError);
        }
      }
      if (!cached?.tables) throw error;
      REMOTE_TABLES.forEach((table) => {
        remoteCache[table] = Array.isArray(cached.tables[table]) ? cached.tables[table] : [];
      });
      remoteSettings = cached.settings || {};
      dataLoaded = true;
      console.warn('Mode hors ligne : affichage du dernier snapshot synchronisé.', error);
    }
  }
  return {
    bands: [...remoteCache.bands],
    logs: [...remoteCache.daily_logs],
    sales: [...remoteCache.sales],
    charges: [...remoteCache.charges],
    items: [],
    movements: [],
    clients: [],
  };
}

async function migrateLocalData() {
  if (!db || !session?.user?.id) return false;
  const flag = `poulet-pro-migrated-${session.user.id}`;
  try {
    if (localStorage.getItem(flag)) return false;
  } catch (error) { /* stockage indisponible */ }
  const remoteIsEmpty = REMOTE_TABLES.every((table) => !remoteCache[table].length);
  if (!remoteIsEmpty) {
    try { localStorage.setItem(flag, '1'); } catch (error) { /* ignore */ }
    return false;
  }
  let local = null;
  try {
    local = await localGetSnapshot();
  } catch (error) {
    console.warn('Données locales illisibles', error);
    return false;
  }
  const total = ['bands', 'logs', 'sales', 'charges'].reduce((count, key) => count + (local[key]?.length || 0), 0);
  if (!total) {
    try { localStorage.setItem(flag, '1'); } catch (error) { /* ignore */ }
    return false;
  }
  const entries = [];
  for (const [store, key] of [['bands', 'bands'], ['daily_logs', 'logs'], ['sales', 'sales'], ['charges', 'charges']]) {
    for (const record of local[key] || []) entries.push({ store, record });
  }
  await saveRecords(entries);
  try { localStorage.setItem(flag, '1'); } catch (error) { /* ignore */ }
  await loadRemoteData({ silent: true });
  return true;
}

function userLabel() {
  if (!session?.user) return 'Mon compte';
  return session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Mon compte';
}

function userInitials() {
  return userLabel().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'VT';
}


function toast(message, error = false) {
  const node = document.createElement('div');
  node.className = `toast${error ? ' error' : ''}`;
  node.textContent = message;
  $('#toast-region').append(node);
  window.setTimeout(() => node.remove(), 4200);
}

function setDialog(title, subtitle, body) {
  const dialog = $('#app-dialog');
  if (dialog.open) {
    dialog.close();
    $('#dialog-content').replaceChildren();
  }
  $('#dialog-content').innerHTML = `
    <div class="dialog-head"><div><h2 id="dialog-title">${esc(title)}</h2><p>${esc(subtitle)}</p></div>
      <button class="dialog-close" type="button" aria-label="Fermer" data-close-dialog>×</button></div>
    ${body}`;
  dialog.showModal();
  const first = $('input, select, textarea, button', dialog);
  first?.focus();
}

function closeDialog() {
  $('#app-dialog').close();
  $('#dialog-content').replaceChildren();
}

function emptyState(title, message, action = '') {
  return `<div class="empty-state"><strong>${esc(title)}</strong><p>${esc(message)}</p>${action}</div>`;
}

function activeBirds(band, snapshot) {
  const mortality = sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.mortality);
  const culls = sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.culls);
  const sold = sum(snapshot.sales.filter((sale) => sale.batch_id === band.id), (sale) => sale.heads);
  return Math.max(0, Number(band.initial_count) - mortality - culls - sold);
}

function bandFeedCost(band, snapshot) {
  return sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.feed_cost);
}

function bandCost(band, snapshot) {
  const logs = snapshot.logs.filter((log) => log.batch_id === band.id);
  const charges = snapshot.charges.filter((charge) => charge.batch_id === band.id);
  return Number(band.chick_total_cost || 0) + Number(band.transport_cost || 0)
    + sum(logs, (log) => Number(log.feed_cost) + Number(log.health_cost) + Number(log.other_cost))
    + sum(charges, (charge) => charge.amount);
}

function batchSelect(bands, selected = '') {
  return `<option value="">Choisir une bande</option>${bands.map((band) =>
    `<option value="${esc(band.id)}" ${band.id === selected ? 'selected' : ''}>${esc(band.name)} · ${activeBirds(band, window.snapshot || { logs: [], sales: [] })} sujets</option>`,
  ).join('')}`;
}

function metricCard(label, value, note, iconName, noteClass = '') {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(iconName)}</span></div>
    <div class="metric-value">${value}</div><div class="metric-note ${noteClass}">${note}</div></article>`;
}

function bandMortality(band, snapshot) {
  return sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.mortality);
}

function bandRevenue(band, snapshot) {
  return sum(snapshot.sales.filter((sale) => sale.batch_id === band.id), (sale) => sale.total_amount);
}

async function renderDashboard(snapshot) {
  const bands = visibleBands(snapshot);
  const archivedCount = snapshot.bands.length - bands.length;
  let pendingOrders = 0;
  try { await loadOrders({ force: true }); pendingOrders = ordersState.orders.filter((o) => o.status === 'en_attente').length; } catch { /* hors ligne */ }
  const unpaidTotal = sum((snapshot.sales || []).filter((s) => (Number(s.total_amount) - Number(s.paid_amount)) > 0), (s) => Number(s.total_amount) - Number(s.paid_amount));
  const unpaidCount = (snapshot.sales || []).filter((s) => (Number(s.total_amount) - Number(s.paid_amount)) > 0).length;
  const heading = `<div class="page-heading dashboard-heading"><div><h1>Bonjour, bienvenue</h1><p>Voici le résumé de votre exploitation avicole, bande par bande.</p></div></div>`;

  if (!bands.length) {
    return `${heading}
      ${archivedCount ? `<p class="archive-note">${number(archivedCount)} bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} : plus aucune opération dans le quotidien, mais l’historique reste comptabilisé dans les statistiques annuelles.</p>` : ''}
      <section class="panel table-panel">${emptyState('Aucune bande active', 'Créez votre premier lot pour voir apparaître ses indicateurs ici.', '<button class="primary-button" data-action="new-band">Créer une bande</button>')}</section>`;
  }

  const cards = bands.map((band) => {
    const birds = activeBirds(band, snapshot);
    const deaths = bandMortality(band, snapshot);
    const rate = Number(band.initial_count) ? (deaths / Number(band.initial_count)) * 100 : 0;
    const revenue = bandRevenue(band, snapshot);
    const costs = bandCost(band, snapshot);
    const profit = revenue - costs;
    const closed = band.status === 'closed';
    return `<article class="band-kpi">
      <header class="band-kpi-head">
        <div><h3>${esc(band.name)}</h3><p>${esc(band.strain || 'Souche non précisée')} · J${daysSince(band.arrival_date)} / ${Number(band.target_age_days || 42)} j</p></div>
        <span class="status-pill ${closed ? 'neutral' : ''}">${closed ? 'Clôturée' : 'En cours'}</span>
      </header>
      <div class="band-kpi-grid">
        <div><span>Disponible</span><strong>${number(birds)}</strong></div>
        <div><span>Mortalité cumulée</span><strong class="${rate > 5 ? 'low-stock' : ''}">${number(deaths)} <small>(${number(rate, 1)} %)</small></strong></div>
        <div><span>Chiffre d’affaires</span><strong>${currency(revenue)}</strong></div>
        <div><span>Dépenses</span><strong>${currency(costs)}</strong></div>
        <div class="wide"><span>Bénéfice</span><strong class="${profit >= 0 ? 'positive' : 'low-stock'}">${currency(profit)}</strong></div>
      </div>
    </article>`;
  }).join('');

  const maxRevenue = Math.max(0, ...bands.map((band) => bandRevenue(band, snapshot)));
  const chart = maxRevenue > 0
    ? bands.map((band) => {
      const revenue = bandRevenue(band, snapshot);
      const width = Math.max(revenue > 0 ? 2 : 0, (revenue / maxRevenue) * 100);
      return `<div class="band-chart-row"><span class="band-chart-label">${esc(band.name)}</span>
        <div class="band-chart-track"><div class="band-chart-bar" style="width:${width.toFixed(1)}%"></div></div>
        <span class="band-chart-value">${currency(revenue)}</span></div>`;
    }).join('')
    : '<p class="band-chart-empty">Aucune vente enregistrée pour le moment : les barres apparaîtront dès la première vente.</p>';

  return `${heading}
    <section class="mobile-dashboard" data-bands='${esc(JSON.stringify(bands.map((band) => ({ name: esc(band.name), expenses: currency(bandCost(band, snapshot)), profit: currency(bandRevenue(band, snapshot) - bandCost(band, snapshot)), stock: number(activeBirds(band, snapshot)) }))))}' aria-label="Tableau de bord mobile">
      <header class="mobile-dash-header">
        <div class="mobile-dash-brand"><span class="mobile-avatar">AB</span><strong>Accueil</strong></div>
        <div class="mobile-dash-icons">
          <button class="mobile-icon-btn" type="button" aria-label="Rechercher">🔍</button>
          <button class="mobile-icon-btn" type="button" aria-label="Notifications">🔔</button>
        </div>
      </header>
      <p class="mobile-salutation">Bonjour, ${esc((userLabel() || '').split(/\s+/)[0] || 'Awa')}</p>
      <div class="mobile-actions">
        <button class="mobile-action-primary" type="button" data-action="new-band">+ NOUVELLE BANDE</button>
        <button class="mobile-action-secondary" type="button" data-action="new-sale">+ VENTES</button>
      </div>
      <div class="mobile-kpi-grid">
        <div class="mobile-kpi-card">
          <span class="mobile-kpi-label">DEPENSES « <span class="mobile-kpi-band">NOM BANDE</span> »</span>
          <strong class="mobile-kpi-value mobile-kpi-expenses">0 FCFA</strong>
        </div>
        <div class="mobile-kpi-card">
          <span class="mobile-kpi-label">BENEFICES « <span class="mobile-kpi-band">NOM BANDE</span> »</span>
          <strong class="mobile-kpi-value mobile-kpi-profit">0 FCFA</strong>
        </div>
        <div class="mobile-kpi-card">
          <span class="mobile-kpi-label">À encaisser</span>
          <strong class="mobile-kpi-value">${currency(unpaidTotal)}</strong>
          <small>${number(unpaidCount)} en cours</small>
        </div>
        <div class="mobile-kpi-card">
          <span class="mobile-kpi-label">COMMANDES EN ATTENTES</span>
          <strong class="mobile-kpi-value">${number(pendingOrders)}</strong>
        </div>
      </div>
      <div class="mobile-bands-row">
        <div class="mobile-band-card">
          <span class="mobile-band-title">BANDE « <span class="mobile-band-name">nom bande</span> »</span>
          <span class="mobile-band-stock">DISPONIBLE : <strong class="mobile-band-stock-val">0</strong></span>
        </div>
        <div class="mobile-band-card">
          <span class="mobile-band-title">BANDE « <span class="mobile-band-name">Nom bande</span> »</span>
          <span class="mobile-band-stock">DISPONIBLE : <strong class="mobile-band-stock-val">0</strong></span>
        </div>
        <div class="mobile-tools-col">
          <button class="mobile-tool-card" type="button" data-action="new-daily"><span class="mobile-tool-icon">📅</span> SUIVI Quotidien</button>
          <button class="mobile-tool-card" type="button" data-page="annual"><span class="mobile-tool-icon">📊</span> Statistiques</button>
        </div>
      </div>
      <div class="mobile-sales-preview">
        <div class="mobile-sales-header"><strong>Mes ventes et mes clients</strong><button class="mobile-link" type="button" data-page="sales">voir plus</button></div>
      </div>
    </section>
    <section class="band-kpi-list" aria-label="Indicateurs par bande">${cards}</section>
    ${archivedCount ? `<p class="archive-note">${number(archivedCount)} bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} : son historique reste inclus dans les statistiques annuelles.</p>` : ''}
    <section class="panel band-chart-panel">
      <div class="panel-header"><div><h2>Chiffre d’affaires par bande</h2><p>Répartition des recettes enregistrées pour chaque lot.</p></div></div>
      <div class="band-chart">${chart}</div>
    </section>

`;
}