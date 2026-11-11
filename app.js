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

function renderDashboard(snapshot) {
  const bands = visibleBands(snapshot);
  const archivedCount = snapshot.bands.length - bands.length;
  const heading = `<div class="page-heading"><div><h1>Bonjour, bienvenue</h1><p>Voici le résumé de votre exploitation avicole, bande par bande.</p></div></div>`;

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
        <div><span>Sujets en élevage</span><strong>${number(birds)}</strong></div>
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
    <section class="band-kpi-list" aria-label="Indicateurs par bande">${cards}</section>
    ${archivedCount ? `<p class="archive-note">${number(archivedCount)} bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} : son historique reste inclus dans les statistiques annuelles.</p>` : ''}
    <section class="panel band-chart-panel">
      <div class="panel-header"><div><h2>Chiffre d’affaires par bande</h2><p>Répartition des recettes enregistrées pour chaque lot.</p></div></div>
      <div class="band-chart">${chart}</div>
    </section>`;
}

function renderBands(snapshot) {
  const visible = [...visibleBands(snapshot)].sort((a, b) => (b.arrival_date || '').localeCompare(a.arrival_date || ''));
  const archived = snapshot.bands.filter(isArchived)
    .sort((a, b) => String(b.archived_at || '').localeCompare(String(a.archived_at || '')));

  const rows = visible.map((band) => {
    const birds = activeBirds(band, snapshot);
    const mortality = bandMortality(band, snapshot);
    const percent = band.initial_count ? (mortality / band.initial_count) * 100 : 0;
    const days = daysSince(band.arrival_date);
    const weight = [...snapshot.logs].filter((log) => log.batch_id === band.id && log.avg_weight_kg).sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.avg_weight_kg;
    const weightText = weight ? `${number(weight, 2)} kg / ${number(band.target_weight_kg, 2)} kg cible` : `— / ${number(band.target_weight_kg, 2)} kg cible`;
    const forecast = new Date(`${band.arrival_date}T12:00:00`);
    forecast.setDate(forecast.getDate() + Number(band.target_age_days || 42));
    const saleableHeads = birds + sum(snapshot.sales.filter((sale) => sale.batch_id === band.id), (sale) => sale.heads);
    const unitCost = saleableHeads ? bandCost(band, snapshot) / saleableHeads : 0;
    return `<tr data-band-detail="${esc(band.id)}" style="cursor:pointer"><td class="primary-cell">${esc(band.name)}<span class="secondary-cell">${esc(band.strain || 'Souche non précisée')} · ${esc(band.supplier || 'Fournisseur non précisé')}</span></td>
      <td>${dateLabel(band.arrival_date)}</td><td>J${days} / ${Number(band.target_age_days || 42)} j</td><td>${dateLabel(`${forecast.getFullYear()}-${String(forecast.getMonth() + 1).padStart(2, '0')}-${String(forecast.getDate()).padStart(2, '0')}`)}</td>
      <td>${number(birds)}</td><td>${number(percent, 1)} %</td><td>${weightText}</td><td>${currency(unitCost)}</td>
      <td>${currency(bandCost(band, snapshot))}</td><td><span class="status-pill ${band.status === 'closed' ? 'neutral' : ''}">${band.status === 'closed' ? 'Clôturée' : 'En cours'}</span></td>
      <td class="actions-cell">
        <button class="icon-button" type="button" data-action="edit-band" data-band-id="${esc(band.id)}" title="Modifier">✎</button>
        <button class="icon-button" type="button" data-action="delete-band-history" data-band-id="${esc(band.id)}" title="Supprimer l'historique des relevés">↺</button>
        <button class="secondary-button danger-outline" type="button" data-action="archive-band" data-band-id="${esc(band.id)}" title="Archiver la bande">Archiver</button>
      </td></tr>`;
  }).join('');

  const archivedRows = archived.map((band) => {
    const birds = activeBirds(band, snapshot);
    const deaths = bandMortality(band, snapshot);
    const revenue = bandRevenue(band, snapshot);
    return `<tr data-band-detail="${esc(band.id)}" style="cursor:pointer"><td class="primary-cell">${esc(band.name)}<span class="secondary-cell">${esc(band.strain || 'Souche non précisée')}</span></td>
      <td>${dateLabel(band.arrival_date)}</td><td>${number(band.initial_count)}</td><td>${number(birds)}</td><td>${number(deaths)}</td><td>${currency(revenue)}</td>
      <td>${band.archived_at ? dateLabel(String(band.archived_at).slice(0, 10)) : '—'}</td>
      <td class="actions-cell"><button class="secondary-button" type="button" data-action="restore-band" data-band-id="${esc(band.id)}">Restaurer</button><button class="secondary-button danger-outline" type="button" data-action="delete-band" data-band-id="${esc(band.id)}" title="Supprimer définitivement la bande et toutes ses données">Supprimer</button></td></tr>`;
  }).join('');

  return `<div class="page-heading"><div><h1>Bandes de production</h1><p>Suivez vos lots de poulets de chair du démarrage à la vente.</p></div><button class="primary-button" data-action="new-band"><span class="plus">+</span> Nouvelle bande</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Tous les lots</h2><p>${visible.length} bande${visible.length > 1 ? 's' : ''} active${visible.length > 1 ? 's' : ''}. Cliquez sur une ligne pour consulter sa fiche.</p></div></div>
      ${rows ? `<div class="table-wrap"><table><thead><tr><th>Bande / souche</th><th>Arrivée</th><th>Âge</th><th>Vente cible estimée</th><th>En élevage</th><th>Mortalité</th><th>Poids réel / cible</th><th>Coût / sujet sorti</th><th>Coût cumulé</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Pas encore de bande', 'Ajoutez un lot pour calculer son coût de revient et suivre ses performances.', '<button class="primary-button" data-action="new-band">Créer la première bande</button>')}</section>
    ${archived.length ? `<section class="panel table-panel archived-panel"><div class="panel-header"><div><h2>Bandes archivées</h2><p>${archived.length} bande${archived.length > 1 ? 's' : ''} retirée${archived.length > 1 ? 's' : ''} de l’élevage actif — plus aucune opération dans les menus du quotidien, mais l’historique reste comptabilisé dans les statistiques annuelles. La suppression définitive efface la bande et toutes ses données.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Bande / souche</th><th>Arrivée</th><th>Poussins</th><th>Sujets restants</th><th>Mortalité</th><th>Chiffre d’affaires</th><th>Archivée le</th><th>Actions</th></tr></thead><tbody>${archivedRows}</tbody></table></div></section>` : ''}`;
}

function renderDaily(snapshot) {
  const activeIds = activeBandIds(snapshot);
  const logs = snapshot.logs.filter((log) => activeIds.has(log.batch_id));
  const archivedCount = snapshot.logs.length - logs.length;
  const rows = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).map((log) => {
    const band = snapshot.bands.find((item) => item.id === log.batch_id);
    return `<tr><td>${dateLabel(log.log_date)}</td><td class="primary-cell">${esc(band?.name || 'Bande supprimée')}</td><td>${number(log.mortality)}</td><td>${number(log.culls)}</td><td>${esc(log.note || '—')}</td>
      <td class="actions-cell"><button class="icon-button danger-button" type="button" data-action="delete-log" data-log-id="${esc(log.id)}" title="Supprimer ce relevé">✕</button></td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Suivi quotidien</h1><p>Consignez les mortalités et observations au poulailler.</p></div><button class="primary-button" data-action="new-daily"><span class="plus">+</span> Saisie du jour</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des relevés</h2><p>${logs.length} relevé${logs.length > 1 ? 's' : ''} · la suppression recalcule aussitôt les totaux.${archivedCount ? ` ${number(archivedCount)} relevé${archivedCount > 1 ? 's' : ''} de bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} conservé${archivedCount > 1 ? 's' : ''} dans les statistiques annuelles.` : ''}</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Bande</th><th>Mortalité</th><th>Tri / réformes</th><th>Note / observation</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucun relevé quotidien', 'Les mortalités et observations se saisissent ici.', '<button class="primary-button" data-action="new-daily">Ajouter un relevé</button>')}</section>`;
}


function renderSales(snapshot) {
  const activeIds = activeBandIds(snapshot);
  const sales = snapshot.sales.filter((sale) => !sale.batch_id || activeIds.has(sale.batch_id));
  const archivedCount = snapshot.sales.length - sales.length;
  const rows = [...sales].sort((a, b) => (b.sale_date || '').localeCompare(a.sale_date || '')).map((sale) => {
    const band = snapshot.bands.find((item) => item.id === sale.batch_id);
    const due = Number(sale.total_amount) - Number(sale.paid_amount);
    return `<tr><td class="check-cell"><input type="checkbox" data-sale-check="${esc(sale.id)}" aria-label="Sélectionner la vente de ${esc(sale.client_name || 'comptoir')}" /></td>
      <td>${dateLabel(sale.sale_date)}</td><td class="primary-cell">${esc(sale.client_name || 'Vente comptoir')}</td><td>${esc(band?.name || '—')}</td><td>${number(sale.heads)}</td><td>${number(sale.total_weight_kg, 1)} kg</td><td>${currency(sale.total_amount)}</td><td>${currency(due)}</td><td>${esc(PAYMENT_LABELS[sale.payment_method] || sale.payment_method)}</td><td><span class="status-pill ${due > 0 ? 'warning' : ''}">${due > 0 ? 'À encaisser' : 'Payée'}</span></td>
      <td class="sales-row-actions"><button class="primary-button" type="button" data-action="download-receipt" data-sale-id="${esc(sale.id)}" data-client-name="${esc(sale.client_name || 'Vente comptoir')}" data-client-phone="${esc(sale.client_phone || '')}" data-client-address="${esc(sale.client_address || '')}" data-band-name="${esc(band?.name || '—')}" data-sale-date="${esc(sale.sale_date)}" data-heads="${esc(sale.heads)}" data-total-weight="${esc(sale.total_weight_kg)}" data-price="${esc(sale.price_per_kg)}" data-price-head="${esc(sale.price_per_head || '')}" data-total="${esc(sale.total_amount)}" data-paid="${esc(sale.paid_amount)}" data-payment="${esc(sale.payment_method || '')}" data-created-at="${esc(sale.created_at || '')}">Reçu</button>
      <button class="icon-button danger-button" type="button" data-action="delete-sale" data-sale-id="${esc(sale.id)}" title="Supprimer cette vente">✕</button></td></tr>`;
  }).join('');
  const revenue = sum(sales, (sale) => sale.total_amount);
  const unpaid = sum(sales, (sale) => Number(sale.total_amount) - Number(sale.paid_amount));
  return `<div class="page-heading"><div><h1>Ventes & commandes</h1><p>Associez chaque vente à son lot et suivez les règlements clients.</p></div><button class="primary-button" data-action="new-sale"><span class="plus">+</span> Nouvelle vente</button></div>
    <section class="metrics-grid">${metricCard('Ventes enregistrées', number(sales.length), 'Bandes actives', 'sales')}${metricCard('Chiffre d’affaires', currency(revenue), 'Montant total vendu', 'money')}<article class="metric-card" data-action="show-credits" style="cursor:pointer"><div class="metric-top"><span>Crédits clients</span><span class="metric-icon">${icon('daily')}</span></div><div class="metric-value">${currency(unpaid)}</div><div class="metric-note">Reste à encaisser — cliquer pour justifier</div></article>${metricCard('Sujets vendus', number(sum(sales, (sale) => sale.heads)), 'Poulets de chair', 'bird')}</section>
    ${archivedCount ? `<p class="archive-note">${number(archivedCount)} vente${archivedCount > 1 ? 's' : ''} de bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} : historique conservé dans les statistiques annuelles.</p>` : ''}
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des ventes</h2><p>Vente en gros, au détail ou sur commande. Cochez les lignes pour supprimer plusieurs ventes.</p></div>
      <div class="sales-bulk"><label class="sales-check-all"><input type="checkbox" id="sales-select-all" /> Tout sélectionner</label>
      <button class="secondary-button danger-outline" type="button" id="sales-delete-selected" data-action="delete-selected-sales" disabled>Supprimer la sélection</button></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th class="check-cell"><span class="sr-only">Sélection</span></th><th>Date</th><th>Client</th><th>Bande source</th><th>Sujets</th><th>Poids total</th><th>Montant</th><th>Solde</th><th>Mode de paiement</th><th>État</th><th>Reçu / Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucune vente enregistrée', 'Enregistrez une vente pour suivre les recettes et les sujets disponibles.', '<button class="primary-button" data-action="new-sale">Créer une vente</button>')}</section>`;
}

function updateSalesSelection() {
  const checks = $$('[data-sale-check]');
  const checked = checks.filter((node) => node.checked);
  const all = $('#sales-select-all');
  if (all) {
    all.checked = checks.length > 0 && checked.length === checks.length;
    all.indeterminate = checked.length > 0 && checked.length < checks.length;
  }
  const button = $('#sales-delete-selected');
  if (button) {
    button.disabled = checked.length === 0;
    button.textContent = checked.length ? `Supprimer la sélection (${checked.length})` : 'Supprimer la sélection';
  }
  checks.forEach((node) => node.closest('tr')?.classList.toggle('row-selected', node.checked));
}

async function deleteSales(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return false;
  const snapshot = await getSnapshot();
  const sales = snapshot.sales.filter((sale) => unique.includes(sale.id));
  const heads = sum(sales, (sale) => sale.heads);
  const message = unique.length === 1
    ? `Supprimer cette vente ? Les ${number(heads)} sujet${heads > 1 ? 's' : ''} reviendront dans le stock disponible.`
    : `Supprimer ces ${unique.length} ventes ? Les ${number(heads)} sujets reviendront dans le stock disponible.`;
  if (!confirm(message)) return false;
  await deleteRecords('sales', unique);
  toast(`${unique.length} vente${unique.length > 1 ? 's' : ''} supprimée${unique.length > 1 ? 's' : ''} · stock mis à jour.`);
  await render();
  publishStock({ silent: true }).catch((error) => console.error(error));
  return true;
}

async function deleteDailyLog(logId) {
  if (!logId) return false;
  const snapshot = await getSnapshot();
  const log = snapshot.logs.find((item) => item.id === logId);
  if (!log) { toast('Relevé introuvable.', true); return false; }
  const band = snapshot.bands.find((item) => item.id === log.batch_id);
  const label = `${dateLabel(log.log_date)}${band ? ` — ${band.name}` : ''}`;
  if (!confirm(`Supprimer le relevé du ${label} ?\n\nLa mortalité (${number(log.mortality)}) et le tri (${number(log.culls)}) seront immédiatement retirés des totaux de la bande.`)) return false;
  await deleteRecord('daily_logs', logId);
  if ($('#app-dialog').open) closeDialog();
  toast('Relevé supprimé · totaux recalculés immédiatement.');
  await render();
  publishStock({ silent: true }).catch((error) => console.error(error));
  return true;
}

async function deleteCharge(chargeId) {
  if (!chargeId) return false;
  const snapshot = await getSnapshot();
  const charge = snapshot.charges.find((item) => item.id === chargeId);
  if (!charge) { toast('Charge introuvable.', true); return false; }
  const band = snapshot.bands.find((item) => item.id === charge.batch_id);
  if (!confirm(`Supprimer la charge « ${charge.description} » (${currency(charge.amount)}) ?\n\nElle sera immédiatement déduite des dépenses${band ? ` de « ${band.name} »` : ''} et du bénéfice.`)) return false;
  await deleteRecord('charges', chargeId);
  if ($('#app-dialog').open) closeDialog();
  toast('Charge supprimée · dépenses et bénéfice recalculés.');
  await render();
  return true;
}

async function archiveBand(bandId) {
  const band = (await readAll('bands')).find((item) => item.id === bandId);
  if (!band) { toast('Bande introuvable.', true); return; }
  if (!confirm(`Archiver la bande « ${band.name} » ?\n\nElle et ses opérations (relevés, ventes, charges) disparaîtront des menus de gestion quotidienne. Tout son historique restera consultable dans les statistiques annuelles, sans fausser les calculs globaux.`)) return;
  await saveRecord('bands', { ...band, archived_at: new Date().toISOString() });
  toast('Bande archivée — historique conservé.');
  await render();
  publishStock({ silent: true }).catch((error) => console.error(error));
}

async function restoreBand(bandId) {
  const band = (await readAll('bands')).find((item) => item.id === bandId);
  if (!band) { toast('Bande introuvable.', true); return; }
  await saveRecord('bands', { ...band, archived_at: null });
  toast('Bande restaurée dans l’élevage actif.');
  await render();
  publishStock({ silent: true }).catch((error) => console.error(error));
}

async function deleteBandPermanently(bandId) {
  if (!bandId) return false;
  const snapshot = await getSnapshot();
  const band = snapshot.bands.find((item) => item.id === bandId);
  if (!band) { toast('Bande introuvable.', true); return false; }
  if (!isArchived(band)) {
    toast('Archivez d’abord la bande, puis supprimez-la définitivement.', true);
    return false;
  }
  const logs = snapshot.logs.filter((log) => log.batch_id === band.id);
  const sales = snapshot.sales.filter((sale) => sale.batch_id === band.id);
  const charges = snapshot.charges.filter((charge) => charge.batch_id === band.id);
  const details = `${logs.length} relevé${logs.length > 1 ? 's' : ''}, ${sales.length} vente${sales.length > 1 ? 's' : ''} et ${charges.length} charge${charges.length > 1 ? 's' : ''}`;
  if (!confirm(`Supprimer DÉFINITIVEMENT la bande « ${band.name} » ?\n\n${details} seront effacés de votre compte et de l’historique statistique. Cette action est irréversible.`)) return false;
  const typed = prompt(`Sécurité : tapez le nom exact de la bande pour confirmer la suppression définitive.\n\n${band.name}`);
  if (typed === null) return false;
  if (typed.trim() !== String(band.name).trim()) {
    toast('Suppression annulée : le nom saisi ne correspond pas.', true);
    return false;
  }
  await deleteRecordsByBand('daily_logs', band.id);
  await deleteRecordsByBand('sales', band.id);
  await deleteRecordsByBand('charges', band.id);
  await deleteRecord('bands', band.id);
  if ($('#app-dialog').open) closeDialog();
  toast('Bande supprimée définitivement avec toutes ses données.');
  await render();
  publishStock({ silent: true }).catch((error) => console.error(error));
  return true;
}

async function emptyTrash() {
  const refused = ordersState.orders.filter((order) => order.status === 'refusee');
  if (!refused.length) { toast('La corbeille est déjà vide.'); return; }
  if (!confirm(`Supprimer définitivement les ${refused.length} commande${refused.length > 1 ? 's' : ''} refusée${refused.length > 1 ? 's' : ''} ? Cette action est irréversible.`)) return;
  try {
    await purgeTrash({ force: true });
    toast('Corbeille vidée.');
    await render();
  } catch (error) {
    toast(error.message || 'Impossible de vider la corbeille.', true);
  }
}

function renderExpenses(snapshot) {
  const activeIds = activeBandIds(snapshot);
  const bands = visibleBands(snapshot);
  const charges = snapshot.charges.filter((charge) => !charge.batch_id || activeIds.has(charge.batch_id));
  const archivedCount = snapshot.charges.length - charges.length;
  const rows = [...charges].sort((a, b) => b.charge_date.localeCompare(a.charge_date)).map((charge) => {
    const band = snapshot.bands.find((item) => item.id === charge.batch_id);
    return `<tr><td>${dateLabel(charge.charge_date)}</td><td class="primary-cell">${esc(charge.description)}</td><td>${esc(CATEGORY_LABELS[charge.category] || charge.category)}</td><td>${esc(band?.name || 'Exploitation')}</td><td>${currency(charge.amount)}</td>
      <td class="actions-cell"><button class="icon-button danger-button" type="button" data-action="delete-charge" data-charge-id="${esc(charge.id)}" title="Supprimer cette charge">✕</button></td></tr>`;
  }).join('');
  const total = sum(charges, (charge) => charge.amount);
  return `<div class="page-heading"><div><h1>Charges d’exploitation</h1><p>Centralisez les dépenses directes et communes de la ferme.</p></div><button class="primary-button" data-action="new-charge"><span class="plus">+</span> Ajouter une charge</button></div>
    <section class="metrics-grid">${metricCard('Charges enregistrées', number(charges.length), 'Dépenses hors aliment', 'expenses')}${metricCard('Total des charges', currency(total), 'Bandes actives et exploitation', 'money')}${metricCard('Coûts des bandes', currency(sum(bands, (band) => bandCost(band, snapshot))), 'Poussins, transport, aliment et soins', 'bird')}${metricCard('Dépenses générales', currency(sum(charges.filter((item) => !item.batch_id), (item) => item.amount)), 'Non affectées à un lot', 'stock')}</section>
    ${archivedCount ? `<p class="archive-note">${number(archivedCount)} charge${archivedCount > 1 ? 's' : ''} de bande${archivedCount > 1 ? 's' : ''} archivée${archivedCount > 1 ? 's' : ''} : historique conservé dans les statistiques annuelles.</p>` : ''}
    <section class="panel table-panel"><div class="panel-header"><div><h2>Journal des charges</h2><p>Les aliments consommés sont calculés dans le coût de chaque bande.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Affectation</th><th>Montant</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucune charge saisie', 'Ajoutez le chauffage, la main-d’œuvre, les soins ou les frais de livraison.', '<button class="primary-button" data-action="new-charge">Ajouter une charge</button>')}</section>`;
}


function statBarRow(label, value, max, kind, display, delay = 0) {
  const ratio = max > 0 ? (Math.abs(Number(value) || 0) / max) * 100 : 0;
  const width = Math.abs(value) > 0 ? Math.max(1.5, ratio) : 0;
  return `<div class="stat-bar-row">
    <span class="stat-bar-label">${esc(label)}</span>
    <div class="stat-bar-track"><span class="stat-bar-fill ${kind}" style="--bar-w:${width.toFixed(1)}%;--bar-delay:${delay}ms"></span></div>
    <span class="stat-bar-value">${display}</span>
  </div>`;
}

function renderAnnualStats(snapshot) {
  const years = [...new Set([
    ...snapshot.bands.map((band) => (band.arrival_date || '').slice(0, 4)),
    ...snapshot.sales.map((sale) => (sale.sale_date || '').slice(0, 4)),
    ...snapshot.charges.map((charge) => (charge.charge_date || '').slice(0, 4)),
  ].filter(Boolean))].sort().reverse();
  if (!years.length) years.push(String(new Date().getFullYear()));
  const yearStats = years.map((year) => {
    const bands = snapshot.bands.filter((band) => (band.arrival_date || '').startsWith(year));
    const sales = snapshot.sales.filter((sale) => (sale.sale_date || '').startsWith(year));
    const charges = snapshot.charges.filter((charge) => (charge.charge_date || '').startsWith(year));
    const logs = snapshot.logs.filter((log) => {
      const band = snapshot.bands.find((b) => b.id === log.batch_id);
      return band && (band.arrival_date || '').startsWith(year);
    });
    const initial = sum(bands, (band) => band.initial_count);
    const deaths = sum(logs, (log) => log.mortality);
    const sold = sum(sales, (sale) => sale.heads);
    const revenue = sum(sales, (sale) => sale.total_amount);
    const costs = sum(bands, (band) => bandCost(band, snapshot)) + sum(charges.filter((c) => !c.batch_id), (c) => c.amount);
    const profit = revenue - costs;
    const rate = initial ? (deaths / initial) * 100 : 0;
    return { year, bands: bands.length, initial, deaths, sold, revenue, costs, profit, rate };
  });
  const maxYearValue = Math.max(1, ...yearStats.map((item) => Math.max(item.revenue, item.costs, Math.abs(item.profit))));
  const maxMortality = Math.max(5, ...yearStats.map((item) => item.rate));

  const yearCharts = yearStats.map((item, index) => `
    <article class="stats-year">
      <header class="stats-year-head">
        <div><h3>${esc(item.year)}</h3><p>${number(item.bands)} bande${item.bands > 1 ? 's' : ''} · ${number(item.initial)} sujets mis en place · ${number(item.sold)} vendus</p></div>
        <span class="status-pill ${item.profit >= 0 ? '' : 'danger'}">${item.profit >= 0 ? 'Marge positive' : 'Marge négative'}</span>
      </header>
      <div class="stats-bars">
        ${statBarRow('Recettes', item.revenue, maxYearValue, 'revenue', currency(item.revenue), 40)}
        ${statBarRow('Dépenses', item.costs, maxYearValue, 'expense', currency(item.costs), 140)}
        ${statBarRow('Marge nette', item.profit, maxYearValue, item.profit >= 0 ? 'margin' : 'margin-negative', currency(item.profit), 240)}
        ${statBarRow('Mortalité', item.rate, maxMortality, 'mortality', `${number(item.rate, 1)} %`, 340 + index * 30)}
      </div>
    </article>`).join('');

  const bandsTableRows = yearStats.map((item) => `<tr><td class="primary-cell">${esc(item.year)}</td><td>${number(item.bands)}</td><td>${number(item.initial)}</td><td>${number(item.deaths)}</td><td>${number(item.sold)}</td><td>${currency(item.revenue)}</td><td>${currency(item.costs)}</td><td class="${item.profit >= 0 ? 'positive' : 'low-stock'}">${currency(item.profit)}</td></tr>`).join('');

  const bandStats = snapshot.bands.map((band) => {
    const revenue = bandRevenue(band, snapshot);
    const costs = bandCost(band, snapshot);
    const deaths = bandMortality(band, snapshot);
    const initial = Number(band.initial_count) || 0;
    return { band, revenue, costs, profit: revenue - costs, rate: initial ? (deaths / initial) * 100 : 0 };
  }).sort((a, b) => b.revenue - a.revenue || String(b.band.arrival_date || '').localeCompare(String(a.band.arrival_date || '')));
  const maxBandValue = Math.max(1, ...bandStats.map((item) => Math.max(item.revenue, item.costs, Math.abs(item.profit))));
  const bandCharts = bandStats.map((item, index) => `
    <article class="stats-band-row">
      <header class="stats-band-head">
        <div><strong>${esc(item.band.name)}</strong>${isArchived(item.band) ? ' <span class="status-pill neutral">Archivée</span>' : ''}<span class="stats-band-meta">${esc(item.band.strain || 'Souche non précisée')} · ${number(item.band.initial_count)} poussins · mortalité ${number(item.rate, 1)} %</span></div>
        <span class="stats-band-profit ${item.profit >= 0 ? 'positive' : 'low-stock'}">${currency(item.profit)}</span>
      </header>
      <div class="stats-bars compact">
        ${statBarRow('Recettes', item.revenue, maxBandValue, 'revenue', currency(item.revenue), 30 + index * 15)}
        ${statBarRow('Dépenses', item.costs, maxBandValue, 'expense', currency(item.costs), 100 + index * 15)}
      </div>
    </article>`).join('');

  const totalRevenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const totalCosts = sum(snapshot.bands, (band) => bandCost(band, snapshot)) + sum(snapshot.charges.filter((c) => !c.batch_id), (c) => c.amount);
  const hasHistory = snapshot.bands.length || snapshot.sales.length || snapshot.charges.length;
  return `<div class="page-heading"><div><h1>Statistiques annuelles</h1><p>Bilan complet : bandes actives et archivées restent comptabilisées ici.</p></div></div>
    <section class="metrics-grid">
      ${metricCard('Chiffre d’affaires total', currency(totalRevenue), 'Toutes années', 'money')}
      ${metricCard('Dépenses totales', currency(totalCosts), 'Toutes années', 'expenses')}
      ${metricCard('Bénéfice total', currency(totalRevenue - totalCosts), 'Toutes années', 'money', (totalRevenue - totalCosts) >= 0 ? 'positive' : 'low-stock')}
      ${metricCard('Bandes créées', number(snapshot.bands.length), 'Actives et archivées', 'bands')}
    </section>
    ${hasHistory ? `<section class="panel stats-viz-panel">
      <div class="panel-header"><div><h2>Performance par année</h2><p>Recettes, dépenses, marge nette et mortalité — graphiques animés, toutes bandes confondues.</p></div></div>
      <div class="stats-year-list">${yearCharts}</div>
      <div class="stats-legend"><span><i class="legend-dot revenue"></i> Recettes</span><span><i class="legend-dot expense"></i> Dépenses</span><span><i class="legend-dot margin"></i> Marge nette</span><span><i class="legend-dot mortality"></i> Mortalité</span></div>
    </section>
    <section class="panel stats-viz-panel">
      <div class="panel-header"><div><h2>Performance par bande</h2><p>Chaque lot, actif ou archivé, avec ses recettes et ses dépenses. L’historique des bandes archivées reste ainsi consultable.</p></div></div>
      ${bandCharts ? `<div class="stats-band-list">${bandCharts}</div>` : emptyState('Aucune bande à comparer', 'Les performances apparaîtront dès la création d’une bande.')}
    </section>` : emptyState('Aucun historique statistique', 'Créez une bande, saisissez des charges et des ventes pour alimenter les statistiques.')}
    <section class="panel table-panel"><div class="panel-header"><div><h2>Bilan par année</h2><p>Recettes, dépenses et résultats consolidés.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Année</th><th>Bandes</th><th>Sujets mis en place</th><th>Mortalité</th><th>Sujets vendus</th><th>Chiffre d’affaires</th><th>Dépenses</th><th>Bénéfice</th></tr></thead><tbody>${bandsTableRows}</tbody></table></div>
    </section>`;
}


function strToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 0xff;
  return bytes;
}

function normalizeAscii(value) {
  return String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ');
}

function pdfSafe(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019\u201a]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ')
    .replace(/\u20ac/g, '\x80')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
}

function pdfString(value) {
  return pdfSafe(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapWords(text, width) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= width) current += ` ${word}`;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

function buildReceiptPdf(sale, band, options = {}) {
  const PAGE_WIDTH = 227;       // 80 mm
  const MARGIN = 9;
  const BASE_SIZE = 8;
  const CHAR_RATIO = 0.6;       // police Courier
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const MAX_CHARS = Math.floor(CONTENT_WIDTH / (BASE_SIZE * CHAR_RATIO));
  const LINE_HEIGHT = 1.32;

  const total = options.total !== undefined ? Number(options.total) || 0 : Number(sale.total_amount) || 0;
  const paid = options.paid !== undefined ? Number(options.paid) || 0 : Number(sale.paid_amount) || 0;
  const due = options.due !== undefined ? Math.max(0, Number(options.due) || 0) : Math.max(0, total - paid);
  const heads = Number(sale.heads) || 0;
  const perHead = Number(sale.price_per_head) || 0;
  const weight = Number(sale.total_weight_kg) || 0;
  const priceKg = Number(sale.price_per_kg) || 0;
  const payment = PAYMENT_LABELS[sale.payment_method] || 'Espèces';
  const client = sale.client_name || 'Vente comptoir';
  const receiptNo = String(sale.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase() || '—';
  const title = options.title || 'TICKET DE CAISSE';
  const note = options.note || 'Merci de votre confiance !';
  const totalLabel = options.totalLabel || 'TOTAL';
  const paidLabel = options.paidLabel || 'MONTANT RÉGLÉ';
  const dueLabel = options.dueLabel || 'SOLDE RESTANT';
  const dueZeroLabel = options.dueZeroLabel || 'SOLDÉ';

  const items = [];
  const addLine = (text = '', { bold = false, size = BASE_SIZE, align = 'left', gap = 0 } = {}) => {
    items.push({ text: pdfSafe(text), bold, size, align, gap });
  };
  const addRule = (char = '-') => addLine(char.repeat(MAX_CHARS));
  const addPair = (label, value, { bold = false } = {}) => {
    const room = MAX_CHARS - label.length - value.length;
    addLine(`${label}${' '.repeat(Math.max(1, room))}${value}`, { bold });
  };
  const addField = (label, value) => {
    wrapWords(`${label} : ${value}`, MAX_CHARS).forEach((line, index) => addLine(index ? `  ${line}` : line));
  };

  addLine('VOLAILLE CHEZ TALL', { bold: true, size: 11, align: 'center' });
  addLine('Poulets de chair', { size: 8, align: 'center' });
  addLine('Kalaban Coura ACI — Bamako', { size: 8, align: 'center' });
  addLine('Tél : +223 78 31 48 18', { size: 8, align: 'center', gap: 2 });
  addRule('=');
  addLine(title, { bold: true, size: 10, align: 'center' });
  addLine(`Reçu n° ${receiptNo}`, { size: 7, align: 'center', gap: 1 });
  addLine('');
  addField('Date', dateLabel(sale.sale_date));
  const time = sale.created_at ? new Date(sale.created_at) : new Date();
  if (!Number.isNaN(time.getTime())) {
    addField('Heure', new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(time));
  }
  addField('Client', client);
  if (sale.client_phone) addField('Téléphone', sale.client_phone);
  if (sale.client_address) addField('Adresse', sale.client_address);
  if (band && band.name) addField('Bande', band.name);
  addRule('-');
  addLine('DÉSIGNATION', { bold: true });
  addLine('Poulets de chair');
  if (perHead > 0) {
    addLine(`  ${number(heads)} tête${heads > 1 ? 's' : ''} × ${currency(perHead)}`);
  } else {
    addLine(`  ${number(weight, 1)} kg × ${currency(priceKg)}/kg`);
  }
  addLine('');
  addRule('=');
  addPair(totalLabel, currency(total), { bold: true });
  addPair(paidLabel, currency(paid));
  addPair(dueLabel, due > 0 ? currency(due) : dueZeroLabel, { bold: due > 0 });
  addLine(`Règlement : ${payment}`, { gap: 2 });
  addRule('-');
  wrapWords(note, MAX_CHARS).forEach((line, index) => {
    addLine(line, { bold: true, align: 'center', gap: index ? 0 : 2 });
  });
  addLine('Vos poulets frais, de la ferme à votre table.', { size: 7, align: 'center' });
  addLine('Volaille chez TALL — Kalaban Coura ACI', { size: 7, align: 'center' });
  addLine('Tél : +223 78 31 48 18', { size: 7, align: 'center' });
  addLine('Ce ticket fait foi de votre achat.', { size: 7, align: 'center', gap: 2 });

  const textHeight = items.reduce((height, item) => height + item.gap + item.size * LINE_HEIGHT, 0);
  const logoWidth = 64;
  const logoHeight = logoJpeg ? Math.max(1, Math.round((logoJpeg.height / logoJpeg.width) * logoWidth)) : 0;
  const pageHeight = Math.ceil(MARGIN * 2 + (logoJpeg ? logoHeight + 7 : 0) + textHeight);

  const chunks = [];
  let totalLen = 0;
  const add = (chunk) => {
    const bytes = typeof chunk === 'string' ? strToBytes(chunk) : chunk;
    chunks.push(bytes);
    totalLen += bytes.length;
  };
  const objOffsets = [];
  const mark = () => totalLen;

  add('%PDF-1.4\n');
  objOffsets[1] = mark(); add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objOffsets[2] = mark(); add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  let pageObj = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >>`;
  if (logoJpeg) pageObj += ' /XObject << /Im1 7 0 R >>';
  pageObj += ' >> >>\nendobj\n';
  objOffsets[3] = mark(); add(pageObj);

  const contentParts = [];
  let y = pageHeight - MARGIN;
  if (logoJpeg) {
    contentParts.push('q');
    contentParts.push(`${logoWidth} 0 0 ${logoHeight} ${((PAGE_WIDTH - logoWidth) / 2).toFixed(2)} ${(y - logoHeight).toFixed(2)} cm`);
    contentParts.push('/Im1 Do');
    contentParts.push('Q');
    y -= logoHeight + 7;
  }
  contentParts.push('BT');
  for (const item of items) {
    y -= item.gap;
    const font = item.bold ? 'F2' : 'F1';
    contentParts.push(`/${font} ${item.size} Tf`);
    const textWidth = item.text.length * item.size * CHAR_RATIO;
    let x = MARGIN;
    if (item.align === 'center') x = (PAGE_WIDTH - textWidth) / 2;
    else if (item.align === 'right') x = PAGE_WIDTH - MARGIN - textWidth;
    contentParts.push(`1 0 0 1 ${Math.max(MARGIN, x).toFixed(2)} ${y.toFixed(2)} Tm`);
    contentParts.push(`(${pdfString(item.text)}) Tj`);
    y -= item.size * LINE_HEIGHT;
  }
  contentParts.push('ET');
  const stream = contentParts.join('\n');
  const streamBytes = strToBytes(stream);
  objOffsets[4] = mark();
  add(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  add(streamBytes);
  add('\nendstream\nendobj\n');

  objOffsets[5] = mark(); add('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n');
  objOffsets[6] = mark(); add('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

  const numObjs = logoJpeg ? 7 : 6;
  if (logoJpeg) {
    objOffsets[7] = mark();
    add(`7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logoJpeg.width} /Height ${logoJpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoJpeg.data.length} >>\nstream\n`);
    add(logoJpeg.data);
    add('\nendstream\nendobj\n');
  }

  const xrefPos = totalLen;
  add(`xref\n0 ${numObjs + 1}\n`);
  add('0000000000 65535 f \n');
  for (let i = 1; i <= numObjs; i++) add(`${String(objOffsets[i]).padStart(10, '0')} 00000 n \n`);
  add(`trailer\n<< /Size ${numObjs + 1} /Root 1 0 R >>\n`);
  add(`startxref\n${xrefPos}\n%%EOF\n`);

  const finalLen = chunks.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(finalLen);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

function generateReceipt(sale, band, options = {}) {
  const bytes = buildReceiptPdf(sale, band, options);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = normalizeAscii(sale.client_name || 'vente').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `${options.filenamePrefix || 'recu'}-${safeName}-${sale.sale_date || 'vente'}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
}

function downloadReceipt(saleId, button) {
  const btn = button || document.querySelector(`button[data-sale-id="${saleId}"]`);
  let sale = null;
  if (btn && btn.dataset) {
    sale = {
      id: btn.dataset.saleId,
      client_name: btn.dataset.clientName,
      client_phone: btn.dataset.clientPhone,
      client_address: btn.dataset.clientAddress,
      sale_date: btn.dataset.saleDate,
      heads: Number(btn.dataset.heads) || 0,
      total_weight_kg: Number(btn.dataset.totalWeight) || 0,
      price_per_kg: Number(btn.dataset.price) || 0,
      price_per_head: Number(btn.dataset.priceHead) || 0,
      total_amount: Number(btn.dataset.total) || 0,
      paid_amount: Number(btn.dataset.paid) || 0,
      payment_method: btn.dataset.payment || 'cash',
      created_at: btn.dataset.createdAt || '',
    };
  }
  if (!sale) {
    const snapshot = window.snapshot || {};
    sale = (snapshot.sales || []).find((item) => item.id === saleId);
  }
  if (!sale) { toast('Vente introuvable.', true); return; }
  const bandName = btn && btn.dataset ? btn.dataset.bandName : null;
  const snapshot = window.snapshot || {};
  const band = bandName ? { name: bandName } : (snapshot.bands || []).find((item) => item.id === sale.batch_id);
  generateReceipt(sale, band);
}

async function openCreditsDialog() {
  const snapshot = await getSnapshot();
  const outstanding = snapshot.sales.filter((sale) => Number(sale.total_amount) - Number(sale.paid_amount) > 0);
  if (!outstanding.length) { toast('Aucun crédit client en cours.'); return; }
  const body = `
    <div class="dialog-form">
      <h3>Crédits clients</h3>
      <p>Cliquez sur un règlement pour justifier le paiement du reste.</p>
      ${outstanding.map((sale) => {
        const due = Number(sale.total_amount) - Number(sale.paid_amount);
        return `<div class="cost-preview" style="display:block;margin-bottom:10px">
          <div><strong>${esc(sale.client_name || 'Vente comptoir')}</strong> — ${dateLabel(sale.sale_date)}</div>
          <div>Reste à payer : ${currency(due)}</div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <input type="number" min="0" step="1" max="${due}" placeholder="Montant payé" data-credit-input="${esc(sale.id)}" style="flex:1;padding:6px" />
            <button class="primary-button" type="button" data-action="record-credit-payment" data-sale-id="${esc(sale.id)}">Enregistrer</button>
          </div>
        </div>`;
      }).join('')}
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Fermer</button></div>
    </div>`;
  setDialog('Crédits clients', 'Justifiez les paiements restants.', body);
}

async function recordCreditPayment(saleId, button) {
  const input = document.querySelector(`[data-credit-input="${saleId}"]`);
  const amount = Number(input && input.value) || 0;
  if (amount <= 0) { toast('Saisissez un montant valide.', true); return; }
  const snapshot = await getSnapshot();
  const sale = snapshot.sales.find((item) => item.id === saleId);
  if (!sale) { toast('Vente introuvable.', true); return; }
  const due = Number(sale.total_amount) - Number(sale.paid_amount);
  if (amount > due) { toast('Le montant dépasse le reste à payer.', true); return; }
  const newPaid = Number(sale.paid_amount) + amount;
  const updated = { ...sale, paid_amount: newPaid, payment_status: newPaid >= Number(sale.total_amount) ? 'paid' : 'partial' };
  await saveRecord('sales', updated);
  toast('Paiement enregistré.');
  if (newPaid >= Number(sale.total_amount)) {
    if (confirm('Solde réglé. Télécharger le reçu ?')) downloadReceipt(saleId);
  }
  closeDialog();
  await render();
}


async function openBandDetail(bandId) {
  const snapshot = await getSnapshot();
  const band = snapshot.bands.find((item) => item.id === bandId);
  if (!band) { toast('Bande introuvable.', true); return; }
  const logs = snapshot.logs.filter((log) => log.batch_id === band.id).sort((a, b) => b.log_date.localeCompare(a.log_date));
  const sales = snapshot.sales.filter((sale) => sale.batch_id === band.id).sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  const charges = snapshot.charges.filter((charge) => charge.batch_id === band.id).sort((a, b) => b.charge_date.localeCompare(a.charge_date));
  const birds = activeBirds(band, snapshot);
  const deaths = sum(logs, (log) => log.mortality);
  const revenue = sum(sales, (sale) => sale.total_amount);
  const costs = bandCost(band, snapshot);
  const archived = isArchived(band);
  const body = `
    <div class="dialog-form">
      <h3>${esc(band.name)}</h3>
      <p>${esc(band.strain || 'Souche non précisée')} · ${esc(band.supplier || 'Fournisseur non précisé')}${archived ? ' · <span class="status-pill neutral">Archivée</span>' : ''}</p>
      <div class="metrics-grid" style="margin:12px 0">
        ${metricCard('Sujets en élevage', number(birds), `Initial : ${number(band.initial_count)}`, 'bird')}
        ${metricCard('Mortalité cumulée', number(deaths), `${band.initial_count ? number((deaths / band.initial_count) * 100, 1) : 0} %`, 'daily')}
        ${metricCard('Chiffre d’affaires', currency(revenue), `${sales.length} vente(s)`, 'money')}
        ${metricCard('Dépenses', currency(costs), 'Coût cumulé du lot', 'expenses')}
        ${metricCard('Bénéfice', currency(revenue - costs), 'Après vente', 'money')}
      </div>
      ${archived ? '<p class="archive-note">Bande archivée : ses opérations n’apparaissent plus dans les menus du quotidien, mais son historique reste comptabilisé dans les statistiques annuelles.</p>' : ''}
      <h3>Relevés (${logs.length})</h3>
      ${logs.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Mortalité</th><th>Tri</th><th>Note</th>${archived ? '' : '<th>Actions</th>'}</tr></thead><tbody>${logs.map((log) => `<tr><td>${dateLabel(log.log_date)}</td><td>${number(log.mortality)}</td><td>${number(log.culls)}</td><td>${esc(log.note || '—')}</td>${archived ? '' : `<td><button class="icon-button danger-button" type="button" data-action="delete-log" data-log-id="${esc(log.id)}" title="Supprimer ce relevé">✕</button></td>`}</tr>`).join('')}</tbody></table></div>` : '<p>Aucun relevé.</p>'}
      <h3>Ventes (${sales.length})</h3>
      ${sales.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Sujets</th><th>Montant</th></tr></thead><tbody>${sales.map((sale) => `<tr><td>${dateLabel(sale.sale_date)}</td><td>${esc(sale.client_name || 'Vente comptoir')}</td><td>${number(sale.heads)}</td><td>${currency(sale.total_amount)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Aucune vente.</p>'}
      <h3>Charges (${charges.length})</h3>
      ${charges.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Libellé</th><th>Montant</th>${archived ? '' : '<th>Actions</th>'}</tr></thead><tbody>${charges.map((charge) => `<tr><td>${dateLabel(charge.charge_date)}</td><td>${esc(charge.description)}</td><td>${currency(charge.amount)}</td>${archived ? '' : `<td><button class="icon-button danger-button" type="button" data-action="delete-charge" data-charge-id="${esc(charge.id)}" title="Supprimer cette charge">✕</button></td>`}</tr>`).join('')}</tbody></table></div>` : '<p>Aucune charge.</p>'}
      <div class="dialog-actions">
        ${archived ? `<button class="secondary-button danger-outline" type="button" data-action="delete-band" data-band-id="${esc(band.id)}">Supprimer définitivement</button>` : ''}
        <button class="secondary-button" type="button" data-close-dialog>Fermer</button>
      </div>
    </div>`;
  setDialog(`Détail — ${band.name}`, archived ? 'Historique conservé — bande archivée.' : 'Toutes les informations de la bande.', body);
}


async function render() {
  if (!session) return;
  const snapshot = await getSnapshot();
  window.snapshot = snapshot;
  const renderers = { dashboard: renderDashboard, bands: renderBands, daily: renderDaily, sales: renderSales, orders: renderOrders, expenses: renderExpenses, annual: renderAnnualStats };
  $('#page-container').innerHTML = await renderers[currentPage](snapshot);
  $('#page-container').setAttribute('aria-labelledby', `tab-${currentPage}`);
  $('#page-title').textContent = PAGE_LABELS[currentPage];
  $('#band-count').textContent = snapshot.bands.filter((band) => !isArchived(band)).length;
  updateOrderBadge();
  $('#today-label').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  $('#connection-label').textContent = navigator.onLine ? 'Synchronisation active' : 'Hors ligne';
  const syncLabel = $('#sync-label');
  if (syncLabel) syncLabel.textContent = session
    ? (navigator.onLine ? 'Compte TALL synchronisé' : 'Reconnexion au réseau requise')
    : 'Non connecté';
  $('.offline-dot').classList.toggle('offline', !navigator.onLine);
  updateAccountUI();
}

async function setPage(page, { pushHistory = false, focusTab = false, scrollToTop = false } = {}) {
  if (!Object.prototype.hasOwnProperty.call(PAGE_LABELS, page)) return;
  currentPage = page;
  if (pushHistory && location.hash !== `#${page}`) history.pushState({ page }, '', `#${page}`);
  $$('.nav-item[role="tab"]').forEach((tab) => {
    const active = tab.dataset.page === page;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focusTab) tab.focus();
  });
  await render();
  if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function openBandForm(bandId = null) {
  let band = null;
  if (bandId) {
    band = (await readAll('bands')).find((item) => item.id === bandId);
  }
  const isEdit = Boolean(band);
  setDialog(isEdit ? 'Modifier la bande' : 'Créer une bande', 'Renseignez le lot et le coût d’acquisition à la mise en place.', `
    <form class="dialog-form" id="band-form" data-band-id="${esc(band ? band.id : '')}"><div class="form-grid">
      <input type="hidden" name="id" value="${esc(band ? band.id : '')}" />
      <div class="field"><label for="band-name">Nom de la bande *</label><input id="band-name" name="name" required maxlength="80" placeholder="Ex. Bande Mars — bâtiment 1" value="${esc(band ? band.name : '')}" /></div>
      <div class="field"><label for="band-strain">Souche</label><select id="band-strain" name="strain"><option ${band && band.strain==='Ross 308' ? 'selected' : ''}>Ross 308</option><option ${band && band.strain==='Cobb 500' ? 'selected' : ''}>Cobb 500</option><option ${band && band.strain==='Hubbard' ? 'selected' : ''}>Hubbard</option><option ${band && band.strain==='Autre' ? 'selected' : ''}>Autre</option></select></div>
      <div class="field"><label for="band-date">Date de mise en place *</label><input id="band-date" name="arrival_date" type="date" value="${esc((band && band.arrival_date) || today())}" required /></div>
      <div class="field"><label for="band-count-input">Nombre de poussins *</label><input id="band-count-input" name="initial_count" type="number" inputmode="numeric" min="1" step="1" required placeholder="Ex. 1 000" value="${esc(band ? band.initial_count : '')}" /></div>
      <div class="field"><label for="band-supplier">Fournisseur</label><input id="band-supplier" name="supplier" maxlength="100" placeholder="Couvoir / fournisseur" value="${esc(band ? band.supplier : '')}" /></div>
      <div class="field"><label for="band-weight">Poids cible (kg / sujet)</label><input id="band-weight" name="target_weight_kg" type="number" inputmode="decimal" min="0" step="0.01" value="${esc((band && band.target_weight_kg) || '2.2')}" /></div>
      <div class="field"><label for="band-age">Cycle cible (jours)</label><input id="band-age" name="target_age_days" type="number" inputmode="numeric" min="1" max="120" step="1" value="${esc((band && band.target_age_days) || '42')}" /></div>
      <div class="field"><label for="chick-price">Prix unitaire du poussin (FCFA) *</label><input id="chick-price" name="chick_unit_cost" type="number" inputmode="decimal" min="0" step="1" required value="${esc((band && band.chick_unit_cost) || '0')}" /></div>
      <div class="field"><label for="transport-cost">Transport initial (FCFA)</label><input id="transport-cost" name="transport_cost" type="number" inputmode="decimal" min="0" step="1" value="${esc((band && band.transport_cost) || '0')}" /></div>
      <div class="cost-preview"><span>Coût initial (poussins + transport)</span><strong id="initial-cost-preview">0 FCFA</strong></div>
      <div class="field full"><span class="field-hint">Le coût total des poussins est calculé automatiquement : effectif × prix unitaire. Le transport est comptabilisé séparément dans le coût du lot.</span></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">${isEdit ? 'Enregistrer les modifications' : 'Enregistrer la bande'}</button></div></form>`);
  const updatePreview = () => {
    const count = Number($('#band-count-input').value) || 0;
    const price = Number($('#chick-price').value) || 0;
    const transport = Number($('#transport-cost').value) || 0;
    $('#initial-cost-preview').textContent = currency(count * price + transport);
  };
  ['#band-count-input', '#chick-price', '#transport-cost'].forEach((selector) => $(selector).addEventListener('input', updatePreview));
  updatePreview();
}

async function openDailyForm() {
  const snapshot = await getSnapshot();
  const bands = snapshot.bands.filter(isOpenBand);
  if (!bands.length) { toast('Créez d’abord une bande avant de saisir un relevé.', true); return; }
  setDialog('Saisie quotidienne', 'Les données sont synchronisées avec votre compte, même sur un autre appareil.', `
    <form class="dialog-form" id="daily-form"><div class="form-grid">
      <div class="field"><label for="log-band">Bande *</label><select id="log-band" name="batch_id" required>${batchSelect(bands)}</select></div>
      <div class="field"><label for="log-date">Date du relevé *</label><input id="log-date" name="log_date" type="date" value="${today()}" max="${today()}" required /></div>
      <div class="field"><label for="log-mortality">Mortalité du jour (sujets)</label><input id="log-mortality" name="mortality" type="number" inputmode="numeric" min="0" step="1" value="0" /></div>
      <div class="field"><label for="log-culls">Tri / réformes (sujets)</label><input id="log-culls" name="culls" type="number" inputmode="numeric" min="0" step="1" value="0" /></div>
      <div class="field full"><label for="log-note">Note ou autre observation</label><textarea id="log-note" name="note" maxlength="1000" placeholder="Observation du bâtiment, température, incident…"></textarea></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer le relevé</button></div></form>`);
}

async function openSaleForm() {
  const snapshot = await getSnapshot();
  const bands = snapshot.bands.filter((band) => isOpenBand(band) && activeBirds(band, snapshot) > 0);
  if (!bands.length) { toast('Aucun sujet disponible à la vente. Créez une bande ou vérifiez vos effectifs.', true); return; }
  setDialog('Nouvelle vente', 'Associez la vente à un lot pour assurer la traçabilité.', `
    <form class="dialog-form" id="sale-form"><div class="form-grid">
      <div class="field"><label for="sale-band">Bande source *</label><select id="sale-band" name="batch_id" required>${batchSelect(bands)}</select></div>
      <div class="field"><label for="sale-date">Date de vente *</label><input id="sale-date" name="sale_date" type="date" value="${today()}" required /></div>
      <div class="field"><label for="sale-client-name">Nom du client *</label><input id="sale-client-name" name="client_name" required maxlength="120" placeholder="Ex. Restaurant Le Marché" /></div>
      <div class="field"><label for="sale-client-phone">Numéro de téléphone</label><input id="sale-client-phone" name="client_phone" type="tel" maxlength="30" placeholder="+221…" /></div>
      <div class="field full"><label for="sale-client-address">Adresse</label><input id="sale-client-address" name="client_address" maxlength="200" placeholder="Adresse du client" /></div>
      <div class="field"><label for="sale-heads">Nombre de sujets *</label><input id="sale-heads" name="heads" type="number" inputmode="numeric" min="1" step="1" required /></div>
      <div class="field"><label for="sale-weight">Poids moyen unitaire (kg) *</label><input id="sale-weight" name="unit_weight_kg" type="number" inputmode="decimal" min="0.01" step="0.01" value="2" required /></div>
      <div class="field"><label for="sale-price">Prix par kg vif (FCFA) *</label><input id="sale-price" name="price_per_kg" type="number" inputmode="decimal" min="0" step="1" required /></div>
      <div class="field"><label for="sale-payment">Mode de paiement</label><select id="sale-payment" name="payment_method"><option value="cash">Espèces</option><option value="mobile_money">Mobile Money</option><option value="transfer">Virement</option><option value="credit">Crédit client</option></select></div>
      <div class="field"><label for="sale-paid">Montant déjà réglé (FCFA)</label><input id="sale-paid" name="paid_amount" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="cost-preview"><span>Montant estimé</span><strong id="sale-total-preview">0 FCFA</strong></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer la vente</button></div></form>`);
  const update = () => {
    const amount = (Number($('#sale-heads').value) || 0) * (Number($('#sale-weight').value) || 0) * (Number($('#sale-price').value) || 0);
    $('#sale-total-preview').textContent = currency(amount);
  };
  ['#sale-heads', '#sale-weight', '#sale-price'].forEach((selector) => $(selector).addEventListener('input', update));
}

async function openChargeForm() {
  const bands = (await readAll('bands')).filter(isOpenBand);
  setDialog('Ajouter une charge', 'Les dépenses peuvent être affectées à un lot ou à toute l’exploitation.', `
    <form class="dialog-form" id="charge-form"><div class="form-grid">
      <div class="field"><label for="charge-date">Date *</label><input id="charge-date" name="charge_date" type="date" value="${today()}" required /></div>
      <div class="field"><label for="charge-category">Catégorie *</label><select id="charge-category" name="category"><option value="health">Santé / prophylaxie</option><option value="heating">Chauffage / combustible</option><option value="labor">Main-d’œuvre</option><option value="water_energy">Eau / électricité</option><option value="delivery">Transport livraison client</option><option value="bedding">Litière</option><option value="maintenance">Entretien</option><option value="other">Autre</option></select></div>
      <div class="field full"><label for="charge-description">Libellé *</label><input id="charge-description" name="description" required maxlength="160" placeholder="Ex. Facture électricité du bâtiment 1" /></div>
      <div class="field"><label for="charge-amount">Montant (FCFA) *</label><input id="charge-amount" name="amount" type="number" inputmode="decimal" min="1" step="1" required /></div>
      <div class="field"><label for="charge-band">Affectation</label><select id="charge-band" name="batch_id"><option value="">Exploitation générale</option>${bands.map((band) => `<option value="${esc(band.id)}">${esc(band.name)}</option>`).join('')}</select></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer la charge</button></div></form>`);
}


async function handleSubmit(event) {
  const form = event.target;
  const formId = form && typeof form.getAttribute === 'function' ? form.getAttribute('id') : form && form.id;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const numericFields = ['initial_count', 'chick_unit_cost', 'transport_cost', 'target_weight_kg', 'target_age_days', 'mortality', 'culls', 'feed_starter_kg', 'feed_grower_kg', 'feed_finisher_kg', 'water_liters', 'avg_weight_kg', 'health_cost', 'other_cost', 'quantity', 'min_quantity', 'unit_cost', 'heads', 'unit_weight_kg', 'price_per_kg', 'paid_amount', 'amount'];
  for (const key of numericFields) {
    if (key in values) values[key] = key === 'avg_weight_kg' && values[key] === '' ? null : Number(values[key]) || 0;
  }
  const base = { id: uid(), organization_id: await readMeta('organization_id'), created_at: new Date().toISOString() };
  let followUp = null;

  if (formId === 'band-form') {
    const existing = values.id ? (await readAll('bands')).find((item) => item.id === values.id) : null;
    const bandValues = { ...values };
    delete bandValues.id;
    const record = {
      ...base, ...bandValues, id: values.id || base.id,
      chick_total_cost: values.initial_count * values.chick_unit_cost,
      status: existing ? existing.status : 'active', target_age_days: values.target_age_days || 42,
      created_at: existing ? existing.created_at : base.created_at,
    };
    await saveRecord('bands', record);
  } else if (formId === 'daily-form') {
    const snapshot = await getSnapshot();
    const band = snapshot.bands.find((item) => item.id === values.batch_id);
    if (!band) throw new Error('La bande sélectionnée n’existe plus.');
    const used = values.mortality + values.culls;
    if (used > activeBirds(band, snapshot)) throw new Error('La mortalité et le tri dépassent le nombre de sujets présents.');
    if (snapshot.logs.some((log) => log.batch_id === values.batch_id && log.log_date === values.log_date)) {
      throw new Error('Un relevé existe déjà pour cette bande et cette date.');
    }
    const record = { ...base, ...values, feed_cost: 0 };
    await saveRecords([{ store: 'daily_logs', record }]);
  } else if (formId === 'sale-form') {
    const snapshot = await getSnapshot();
    const band = snapshot.bands.find((item) => item.id === values.batch_id);
    if (!band || values.heads > activeBirds(band, snapshot)) throw new Error(`Quantité indisponible. ${band ? `${activeBirds(band, snapshot)} sujets` : 'Vérifiez la bande'} disponibles.`);
    const totalWeight = values.heads * values.unit_weight_kg;
    const totalAmount = totalWeight * values.price_per_kg;
    if (values.paid_amount > totalAmount) throw new Error('Le règlement ne peut pas dépasser le montant de la vente.');
    const sale = await saveRecord('sales', {
      ...base, ...values, client_id: values.client_id || null,
      total_weight_kg: totalWeight, total_amount: totalAmount, payment_status: values.paid_amount >= totalAmount ? 'paid' : 'partial',
    });
    followUp = { type: 'sale', sale, band };
  } else if (formId === 'charge-form') {
    await saveRecord('charges', { ...base, ...values, batch_id: values.batch_id || null });
  }
  closeDialog();
  await render();
  toast('Enregistré et synchronisé sur votre compte.');
  publishStock({ silent: true }).catch((error) => console.error(error));
  if (followUp?.type === 'sale') openDirectSaleDialog(followUp.sale, followUp.band);
}

function supabaseReady() {
  return Boolean(SUPABASE.url && SUPABASE.anonKey && !/VOTRE|COLLEZ|COLLEZ_ICI/i.test(SUPABASE.anonKey));
}

async function supabaseRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${SUPABASE.url}${path}`, {
    method,
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    const message = (data && (data.message || data.error_description || data.hint || data.details)) || `Erreur ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function loadOrders({ force = false } = {}) {
  if (!supabaseReady()) return [];
  if (!force && Date.now() - ordersState.lastFetch < 15000) return ordersState.orders;
  const rows = await supabaseRequest('/rest/v1/orders?select=*&order=created_at.desc');
  ordersState.orders = Array.isArray(rows) ? rows : [];
  ordersState.lastFetch = Date.now();
  return ordersState.orders;
}

async function publishStock({ silent = false } = {}) {
  if (!supabaseReady()) {
    if (!silent) toast('Supabase n’est pas configuré.', true);
    return;
  }
  const snapshot = await getSnapshot();
  const heads = sum(snapshot.bands.filter(isOpenBand), (band) => activeBirds(band, snapshot));
  const payload = {
    stock_heads: heads,
    min_price: Number(SUPABASE.minPrice) || 2500,
    max_price: Number(SUPABASE.maxPrice) || 25000,
    updated_at: new Date().toISOString(),
  };
  await supabaseRequest('/rest/v1/app_config?id=eq.1', {
    method: 'PATCH', body: payload, headers: { Prefer: 'return=minimal' },
  });
  ordersState.publicStock = payload;
  if (!silent) {
    toast(`Stock publié : ${number(heads)} sujets visibles sur la page publique.`);
    await render();
  }
}

function updateOrderBadge() {
  const badge = $('#order-count');
  if (!badge) return;
  const pending = ordersState.orders.filter((order) => order.status === 'en_attente').length;
  badge.textContent = pending ? String(pending) : '';
  badge.hidden = !pending;
}

async function refreshOrderBadge() {
  if (supabaseReady()) {
    try { await loadOrders(); } catch (error) { console.error(error); }
  }
  updateOrderBadge();
}

function whatsappNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 8) digits = `223${digits}`;
  else if (digits.length === 9 && digits.startsWith('0')) digits = `223${digits.slice(1)}`;
  return digits;
}

function whatsappLink(phone, message) {
  const digits = whatsappNumber(phone);
  const text = encodeURIComponent(message);
  return digits.length >= 10 ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

function buildTransactionMessage({ status, clientName, items, total, paid, remaining, neighborhood, extra }) {
  const lines = [
    `Bonjour ${clientName},`,
    '',
    `Statut : ${status}`,
    '',
    'Détail de la transaction :',
  ];
  for (const item of items) {
    const unit = Number(item.unitPrice) > 0 ? ` × ${currency(item.unitPrice)}` : '';
    lines.push(`• ${item.label} : ${number(item.quantity)}${unit} = ${currency(item.total)}`);
  }
  lines.push(
    '',
    `Total : ${currency(total)}`,
    `Total payé : ${currency(paid)}`,
    `Solde restant : ${currency(remaining)}`,
  );
  if (neighborhood) lines.push(`Livraison : ${neighborhood}`);
  if (extra) lines.push('', extra);
  lines.push('', 'Merci de votre confiance !', 'Volaille chez TALL');
  return lines.join('\n');
}

function makeOrderReceipt(order, records) {
  const heads = sum(records, (record) => Number(record.heads) || 0);
  const totalWeight = sum(records, (record) => Number(record.total_weight_kg) || 0);
  const total = sum(records, (record) => Number(record.total_amount) || 0);
  const paid = sum(records, (record) => Number(record.paid_amount) || 0);
  return {
    id: order.id,
    client_name: order.client_name,
    client_phone: order.client_phone,
    client_address: order.neighborhood,
    sale_date: today(),
    heads,
    unit_weight_kg: heads ? totalWeight / heads : 0,
    total_weight_kg: totalWeight,
    price_per_kg: totalWeight ? Math.round(total / totalWeight) : 0,
    price_per_head: Number(order.price_per_head) || (heads ? Math.round(total / heads) : 0),
    total_amount: total,
    paid_amount: paid,
    payment_method: 'cash',
    payment_status: paid >= total ? 'paid' : 'partial',
    created_at: new Date().toISOString(),
  };
}

function openTransactionDialog({
  title, subtitle, clientName, clientPhone, status, items, total, paid, remaining,
  neighborhood = '', extra = '', receipt, receiptBand = null, receiptOptions = {},
}) {
  const message = buildTransactionMessage({ status, clientName, items, total, paid, remaining, neighborhood, extra });
  const lines = items.map((item) => `<div class="transaction-line"><span>${esc(item.label)} × ${number(item.quantity)}</span><span>${currency(item.total)}</span></div>`).join('');
  setDialog(title, subtitle, `
    <div class="dialog-form">
      <div class="transaction-summary">
        <strong>${esc(clientName)}${clientPhone ? ` · ${esc(clientPhone)}` : ''}</strong>
        ${lines}
        <div class="transaction-line"><span>Total payé</span><span>${currency(paid)}</span></div>
        <div class="transaction-line"><span>Solde restant</span><span>${currency(remaining)}</span></div>
      </div>
      <div class="field full"><label for="transaction-message">Message WhatsApp</label><textarea id="transaction-message" rows="7">${esc(message)}</textarea></div>
      <div class="transaction-actions">
        <a class="primary-button" id="transaction-whatsapp" href="${esc(whatsappLink(clientPhone, message))}" target="_blank" rel="noopener">Envoyer par WhatsApp</a>
        <button class="secondary-button" type="button" id="transaction-receipt">Télécharger le reçu</button>
      </div>
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Fermer</button></div>
    </div>`);
  const textarea = $('#transaction-message');
  const link = $('#transaction-whatsapp');
  if (textarea && link) {
    textarea.addEventListener('input', () => { link.href = whatsappLink(clientPhone, textarea.value); });
  }
  $('#transaction-receipt')?.addEventListener('click', () => {
    generateReceipt(receipt, receiptBand, receiptOptions);
    toast('Reçu PDF téléchargé.');
  });
}

function openAcceptedOrderDialog(order, records) {
  const total = sum(records, (record) => Number(record.total_amount) || 0);
  const paid = sum(records, (record) => Number(record.paid_amount) || 0);
  const remaining = Math.max(0, total - paid);
  openTransactionDialog({
    title: 'Commande acceptée',
    subtitle: 'Envoyez la confirmation au client ou téléchargez son reçu.',
    clientName: order.client_name,
    clientPhone: order.client_phone,
    status: 'Commande acceptée ✅',
    items: [{ label: 'Poulets de chair', quantity: Number(order.quantity) || 0, unitPrice: Number(order.price_per_head) || 0, total }],
    total,
    paid,
    remaining,
    neighborhood: order.neighborhood,
    extra: remaining > 0 ? `Solde à régler à la livraison : ${currency(remaining)}.` : 'Commande entièrement réglée.',
    receipt: makeOrderReceipt(order, records),
    receiptBand: { name: 'Commande publique' },
    receiptOptions: { title: 'COMMANDE CONFIRMÉE' },
  });
}

function openRefusedOrderDialog(order) {
  const total = (Number(order.quantity) || 0) * (Number(order.price_per_head) || 0);
  const receipt = {
    id: order.id,
    client_name: order.client_name,
    client_phone: order.client_phone,
    client_address: order.neighborhood,
    sale_date: String(order.created_at || '').slice(0, 10) || today(),
    heads: Number(order.quantity) || 0,
    unit_weight_kg: 0,
    total_weight_kg: 0,
    price_per_kg: 0,
    price_per_head: Number(order.price_per_head) || 0,
    total_amount: total,
    paid_amount: 0,
    payment_method: 'cash',
    payment_status: 'unpaid',
    created_at: order.created_at || new Date().toISOString(),
  };
  openTransactionDialog({
    title: 'Commande refusée',
    subtitle: 'Prévenez le client et remettez-lui un justificatif.',
    clientName: order.client_name,
    clientPhone: order.client_phone,
    status: 'Commande refusée',
    items: [{ label: 'Poulets de chair', quantity: Number(order.quantity) || 0, unitPrice: Number(order.price_per_head) || 0, total }],
    total,
    paid: 0,
    remaining: 0,
    neighborhood: order.neighborhood,
    extra: 'Le stock disponible ne nous permet pas de satisfaire cette commande. Aucun montant n’a été débité.',
    receipt,
    receiptBand: { name: 'Commande publique' },
    receiptOptions: {
      title: 'COMMANDE REFUSÉE',
      total,
      paid: 0,
      due: 0,
      totalLabel: 'MONTANT COMMANDÉ',
      paidLabel: 'MONTANT VERSÉ',
      dueLabel: 'MONTANT DÛ',
      dueZeroLabel: 'AUCUN',
      note: 'Aucun montant n’a été débité. Merci de votre compréhension.',
      filenamePrefix: 'commande-refusee',
    },
  });
}

function openDirectSaleDialog(sale, band) {
  const total = Number(sale.total_amount) || 0;
  const paid = Number(sale.paid_amount) || 0;
  const remaining = Math.max(0, total - paid);
  const heads = Number(sale.heads) || 0;
  const unitPrice = Number(sale.price_per_head) || (heads ? total / heads : 0);
  openTransactionDialog({
    title: 'Vente enregistrée',
    subtitle: 'Envoyez le récapitulatif au client ou téléchargez le reçu.',
    clientName: sale.client_name || 'Client comptoir',
    clientPhone: sale.client_phone || '',
    status: 'Vente enregistrée ✅',
    items: [{ label: band?.name ? `Poulets — ${band.name}` : 'Poulets de chair', quantity: heads, unitPrice, total }],
    total,
    paid,
    remaining,
    neighborhood: sale.client_address || '',
    extra: remaining > 0 ? `Solde à régler : ${currency(remaining)}.` : 'Vente entièrement réglée. Merci !',
    receipt: sale,
    receiptBand: band,
    receiptOptions: { title: 'TICKET DE CAISSE' },
  });
}

async function validateOrder(orderId, button) {
  const order = ordersState.orders.find((item) => item.id === orderId);
  if (!order || order.status !== 'en_attente') return;
  if (button) button.disabled = true;
  try {
    const snapshot = await getSnapshot();
    const active = snapshot.bands.filter(isOpenBand);
    const available = sum(active, (band) => activeBirds(band, snapshot));
    if (Number(order.quantity) > available) {
      throw new Error(`Stock insuffisant : ${number(available)} sujet${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''} pour ${number(order.quantity)} demandé${Number(order.quantity) > 1 ? 's' : ''}.`);
    }
    const pricePerHead = Number(order.price_per_head) || 0;
    const saleDate = today();
    const created = [];
    let remaining = Number(order.quantity) || 0;
    const bands = active
      .filter((band) => activeBirds(band, snapshot) > 0)
      .sort((a, b) => (a.arrival_date || '').localeCompare(b.arrival_date || ''));
    for (const band of bands) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, activeBirds(band, snapshot));
      if (!take) continue;
      const weight = Number(band.target_weight_kg) || 2.2;
      const amount = take * pricePerHead;
      created.push({
        store: 'sales',
        record: {
          id: uid(),
          created_at: new Date().toISOString(),
          batch_id: band.id,
          sale_date: saleDate,
          client_name: order.client_name,
          client_phone: order.client_phone,
          client_address: order.neighborhood,
          heads: take,
          unit_weight_kg: weight,
          price_per_kg: weight ? Math.round(pricePerHead / weight) : pricePerHead,
          price_per_head: pricePerHead,
          total_weight_kg: take * weight,
          total_amount: amount,
          paid_amount: 0,
          payment_method: 'cash',
          payment_status: 'partial',
          order_id: order.id,
          source: 'commande',
        },
      });
      remaining -= take;
    }
    await saveRecords(created);
    try {
      await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        body: { status: 'validee', handled_at: new Date().toISOString() },
        headers: { Prefer: 'return=minimal' },
      });
    } catch (error) {
      for (const entry of created) await deleteRecord('sales', entry.record.id);
      throw error;
    }
    order.status = 'validee';
    order.handled_at = new Date().toISOString();
    ordersState.lastFetch = 0;
    toast(`Commande validée : ${number(order.quantity)} sujets déduits du stock.`);
    await publishStock({ silent: true }).catch((error) => console.error(error));
    await render();
    openAcceptedOrderDialog(order, created.map((entry) => entry.record));
  } catch (error) {
    toast(error.message || 'Validation impossible.', true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function refuseOrder(orderId, button) {
  const order = ordersState.orders.find((item) => item.id === orderId);
  if (!order || order.status !== 'en_attente') return;
  if (!confirm(`Refuser la commande de ${order.client_name} (${number(order.quantity)} poulets) ?`)) return;
  if (button) button.disabled = true;
  try {
    await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      body: { status: 'refusee', handled_at: new Date().toISOString() },
      headers: { Prefer: 'return=minimal' },
    });
    order.status = 'refusee';
    order.handled_at = new Date().toISOString();
    ordersState.lastFetch = 0;
    await render();
    openRefusedOrderDialog(order);
  } catch (error) {
    toast(error.message || 'Refus impossible.', true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function restoreOrder(orderId, button) {
  const order = ordersState.orders.find((item) => item.id === orderId);
  if (!order || order.status !== 'refusee') return;
  if (button) button.disabled = true;
  try {
    await supabaseRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      body: { status: 'en_attente', handled_at: null },
      headers: { Prefer: 'return=minimal' },
    });
    order.status = 'en_attente';
    order.handled_at = null;
    ordersState.lastFetch = 0;
    toast(`Commande de ${order.client_name} restaurée : elle est de nouveau en attente.`);
    await render();
  } catch (error) {
    toast(error.message || 'Restauration impossible.', true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function copyOrderLink() {
  const url = new URL('./commander.html', location.href).href;
  try {
    await navigator.clipboard.writeText(url);
    toast('Lien public copié.');
  } catch {
    setDialog('Lien public', 'Partagez ce lien avec vos clients.', `
      <div class="dialog-form"><div class="field full"><label for="public-link">Lien de commande</label><input id="public-link" readonly value="${esc(url)}" /></div>
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Fermer</button></div></div>`);
    const input = $('#public-link');
    if (input) { input.focus(); input.select(); }
  }
}

const TRASH_HOURS = 72;

function trashDeadline(order) {
  const handled = new Date(order.handled_at || order.created_at || Date.now());
  return new Date(handled.getTime() + TRASH_HOURS * 3600 * 1000);
}

function trashCountdown(order) {
  const ms = trashDeadline(order).getTime() - Date.now();
  if (ms <= 0) return 'Suppression imminente';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours >= 1 ? `${hours} h ${String(minutes).padStart(2, '0')} min` : `${minutes} min`;
}

async function purgeTrash({ force = false } = {}) {
  if (!supabaseReady()) return 0;
  const now = Date.now();
  const expired = ordersState.orders.filter((order) => order.status === 'refusee'
    && (force || trashDeadline(order).getTime() <= now));
  if (!expired.length) return 0;
  const filter = expired.map((order) => encodeURIComponent(order.id)).join(',');
  await supabaseRequest(`/rest/v1/orders?id=in.(${filter})`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  const ids = new Set(expired.map((order) => order.id));
  ordersState.orders = ordersState.orders.filter((order) => !ids.has(order.id));
  return expired.length;
}

async function renderOrders(snapshot) {
  const header = (actions = '') => `<div class="page-heading"><div><h1>Mes Commandes</h1><p>Les demandes envoyées depuis le lien public de commande.</p></div><div class="heading-actions">${actions}</div></div>`;
  if (!supabaseReady()) {
    return `${header()}<section class="panel"><div class="panel-header"><div><h2>Connexion à Supabase requise</h2><p>Les commandes ne peuvent pas encore être reçues.</p></div></div>
      <div class="orders-setup">
        <p>Renseignez l’URL du projet et la clé publique <code>anon</code> dans <code>supabase-config.js</code>, puis exécutez <code>supabase/commandes.sql</code> dans le SQL Editor Supabase.</p>
      </div></section>`;
  }
  let error = null;
  try {
    await loadOrders({ force: true });
    await purgeTrash();
  } catch (requestError) {
    error = requestError.message;
  }
  try {
    const rows = await supabaseRequest('/rest/v1/app_config?id=eq.1&select=stock_heads,min_price,max_price,updated_at');
    ordersState.publicStock = Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch {
    ordersState.publicStock = null;
  }
  const orders = ordersState.orders;
  const pending = orders.filter((order) => order.status === 'en_attente');
  const validated = orders.filter((order) => order.status === 'validee');
  const refused = orders.filter((order) => order.status === 'refusee')
    .sort((a, b) => String(b.handled_at || b.created_at || '').localeCompare(String(a.handled_at || a.created_at || '')));
  const open = [...pending].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const liveStock = sum(snapshot.bands.filter(isOpenBand), (band) => activeBirds(band, snapshot));
  const publicStock = ordersState.publicStock ? Math.max(0, Number(ordersState.publicStock.stock_heads) || 0) : null;
  const rows = open.map((order) => {
    const total = (Number(order.quantity) || 0) * (Number(order.price_per_head) || 0);
    const statusClass = order.status === 'en_attente' ? 'warning' : '';
    const actions = order.status === 'en_attente'
      ? `<button class="primary-button" type="button" data-action="validate-order" data-order-id="${esc(order.id)}">Valider</button><button class="secondary-button danger-outline" type="button" data-action="refuse-order" data-order-id="${esc(order.id)}">Refuser</button>`
      : order.handled_at
        ? `<span class="orders-handled">Traitée le ${dateLabel(String(order.handled_at).slice(0, 10))}</span>`
        : '—';
    return `<tr>
      <td>${dateLabel(String(order.created_at || '').slice(0, 10))}</td>
      <td class="primary-cell">${esc(order.client_name)}<span class="secondary-cell">${esc(order.client_phone)}</span></td>
      <td>${esc(order.neighborhood)}</td>
      <td>${number(order.quantity)}</td>
      <td>${currency(order.price_per_head)}</td>
      <td>${currency(total)}</td>
      <td><span class="status-pill ${statusClass}">${esc(ORDER_STATUS_LABELS[order.status] || order.status)}</span></td>
      <td class="orders-table-actions">${actions}</td>
    </tr>`;
  }).join('');
  const trashRows = refused.map((order) => {
    const total = (Number(order.quantity) || 0) * (Number(order.price_per_head) || 0);
    return `<tr>
      <td>${dateLabel(String(order.created_at || '').slice(0, 10))}</td>
      <td class="primary-cell">${esc(order.client_name)}<span class="secondary-cell">${esc(order.client_phone)}</span></td>
      <td>${esc(order.neighborhood)}</td>
      <td>${number(order.quantity)}</td>
      <td>${currency(total)}</td>
      <td>${order.handled_at ? dateLabel(String(order.handled_at).slice(0, 10)) : '—'}</td>
      <td><span class="status-pill danger">${trashCountdown(order)}</span></td>
      <td class="orders-table-actions"><button class="secondary-button" type="button" data-action="restore-order" data-order-id="${esc(order.id)}">Restaurer</button></td>
    </tr>`;
  }).join('');
  const actions = `<button class="secondary-button" type="button" data-action="copy-order-link">Copier le lien public</button>
    <a class="secondary-button" href="./commander.html" target="_blank" rel="noopener">Ouvrir la page</a>
    <button class="secondary-button" type="button" data-action="publish-stock">Publier le stock</button>
    <button class="primary-button" type="button" data-action="refresh-orders">Actualiser</button>`;
  return `${header(actions)}
    <section class="metrics-grid">
      ${metricCard('En attente', number(pending.length), 'À traiter', 'orders', pending.length ? 'low-stock' : '')}
      ${metricCard('Validées', number(validated.length), 'Basculées dans les ventes', 'bird', 'positive')}
      ${metricCard('Corbeille', number(refused.length), 'Purge automatique après 72 h', 'expenses')}
      ${metricCard('Stock publié', publicStock === null ? '—' : number(publicStock), `${number(liveStock)} sujets dans l’élevage`, 'stock')}
    </section>
    ${error ? `<p class="orders-error">Impossible de rafraîchir les commandes : ${esc(error)}</p>` : ''}
    <section class="panel table-panel"><div class="panel-header"><div><h2>Demandes à traiter</h2><p>${open.length} commande${open.length > 1 ? 's' : ''} en attente · les commandes validées rejoignent automatiquement l’onglet Ventes.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Quartier</th><th>Qté</th><th>Prix / tête</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : emptyState('Aucune commande en attente', 'Partagez le lien public pour recevoir les demandes de vos clients.', '<button class="primary-button" type="button" data-action="copy-order-link">Copier le lien public</button>')}</section>
    <section class="panel table-panel trash-panel"><div class="panel-header"><div><h2>Corbeille des commandes refusées</h2><p>Les commandes refusées sont conservées 72 heures, puis supprimées automatiquement.</p></div>
      ${refused.length ? '<button class="secondary-button danger-outline" type="button" data-action="empty-trash">Vider la corbeille</button>' : ''}</div>
    ${trashRows ? `<div class="table-wrap"><table><thead><tr><th>Commandée le</th><th>Client</th><th>Quartier</th><th>Qté</th><th>Total</th><th>Refusée le</th><th>Purge dans</th><th>Actions</th></tr></thead><tbody>${trashRows}</tbody></table></div>`
      : '<div class="empty-state trash-empty"><strong>La corbeille est vide</strong><p>Les commandes refusées apparaîtront ici avant leur suppression définitive.</p></div>'}</section>`;
}

function setAuthError(message) {
  const node = $('#auth-error');
  if (!node) return;
  node.textContent = message || '';
  node.hidden = !message;
}

function authBusy(busy) {
  const button = $('#auth-submit');
  const spinner = $('#auth-spinner');
  const label = $('#auth-submit-label');
  if (!button) return;
  button.disabled = busy;
  if (spinner) spinner.hidden = !busy;
  if (label) label.textContent = busy
    ? (authMode === 'signup' ? 'Création du compte…' : 'Connexion…')
    : (authMode === 'signup' ? 'Créer mon compte' : 'Se connecter');
}

function friendlyAuthError(error) {
  const message = String(error?.message || error || '');
  if (/invalid login credentials/i.test(message)) return 'Email/téléphone ou mot de passe incorrect.';
  if (/user already registered|already been registered/i.test(message)) return 'Ce compte existe déjà. Utilisez l’onglet Connexion.';
  if (/email not confirmed/i.test(message)) return 'Cet email doit encore être confirmé.';
  if (/password should be at least/i.test(message)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/rate limit|too many/i.test(message)) return 'Trop de tentatives. Patientez une minute puis réessayez.';
  if (/failed to fetch|networkerror/i.test(message)) return 'Connexion au serveur impossible. Vérifiez votre réseau.';
  return message || 'Connexion impossible pour le moment.';
}

function setAuthMode(mode) {
  authMode = mode === 'signup' ? 'signup' : 'signin';
  $$('.auth-tab').forEach((tab) => {
    const active = tab.dataset.authTab === authMode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $$('[data-signup-only]').forEach((node) => { node.hidden = authMode !== 'signup'; });
  const password = $('#auth-password');
  if (password) password.autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
  const hint = $('#auth-hint');
  if (hint) hint.textContent = authMode === 'signup'
    ? 'Votre historique sera synchronisé sur tous vos appareils dès la création du compte.'
    : 'Retrouvez vos bandes, ventes et charges sur ordinateur comme sur téléphone.';
  setAuthError('');
  authBusy(false);
}

function showAuthScreen() {
  document.body.classList.remove('is-authenticated');
  const screen = $('#auth-screen');
  if (screen) screen.hidden = false;
  setAuthMode('signin');
  window.setTimeout(() => $('#auth-identifier')?.focus(), 420);
}

function hideAuthScreen() {
  document.body.classList.add('is-authenticated');
  const screen = $('#auth-screen');
  if (screen) screen.hidden = true;
  const dialog = $('#app-dialog');
  if (dialog?.open) closeDialog();
}

function updateAccountUI() {
  const name = $('#profile-name');
  const email = $('#profile-email');
  const avatar = $('#profile-avatar');
  if (name) name.textContent = userLabel();
  if (email) {
    const address = session?.user?.email || '';
    email.textContent = address.endsWith(`@${PHONE_DOMAIN}`) ? `+${address.split('@')[0]}` : (address || 'Non connecté');
  }
  if (avatar) avatar.textContent = userInitials();
}

async function openAccountDialog() {
  if (!session) return;
  const snapshot = await getSnapshot();
  const whatsapp = await loadProfileWhatsApp();
  const address = session.user.email || '';
  const identifier = address.endsWith(`@${PHONE_DOMAIN}`) ? `+${address.split('@')[0]}` : address;
  const body = `
    <div class="dialog-form">
      <h3>${esc(userLabel())}</h3>
      <p>${esc(identifier)}</p>
      <div class="metrics-grid" style="margin:12px 0">
        ${metricCard('Bandes', number(snapshot.bands.length), 'Synchronisées', 'bands')}
        ${metricCard('Relevés', number(snapshot.logs.length), 'Suivi quotidien', 'daily')}
        ${metricCard('Ventes', number(snapshot.sales.length), 'Toutes périodes', 'sales')}
        ${metricCard('Charges', number(snapshot.charges.length), 'Toutes périodes', 'expenses')}
      </div>
      <div class="field full">
        <label for="account-whatsapp">Numéro WhatsApp du gestionnaire</label>
        <input id="account-whatsapp" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" value="${esc(formatWhatsAppNumber(whatsapp))}" placeholder="+223 78 31 48 18" aria-describedby="account-whatsapp-hint" />
        <small class="field-hint" id="account-whatsapp-hint">Chaque nouvelle commande publique envoie une alerte à ce numéro.</small>
      </div>
      <div class="dialog-actions" style="justify-content:space-between">
        <button class="secondary-button danger-outline" type="button" data-action="logout">Se déconnecter</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="secondary-button" type="button" data-action="sync-now">Synchroniser</button>
          <button class="primary-button" type="button" data-action="save-whatsapp">Enregistrer le numéro</button>
          <button class="secondary-button" type="button" data-close-dialog>Fermer</button>
        </div>
      </div>
    </div>`;
  setDialog('Mon compte', 'Synchronisation multi-appareils sécurisée.', body);
}

async function saveAccountWhatsApp(button) {
  if (!session) return;
  const input = $('#account-whatsapp');
  try {
    const digits = normalizeWhatsAppNumber(input?.value || '');
    if (button) button.disabled = true;
    const saved = await upsertProfile(session.user.user_metadata?.display_name || '', digits);
    if (!saved) throw new Error('Enregistrement du profil impossible. Vérifiez votre connexion.');
    const published = await publishManagerWhatsApp(digits);
    closeDialog();
    await openAccountDialog();
    toast(published
      ? 'Numéro WhatsApp enregistré et publié pour les commandes.'
      : 'Numéro enregistré. Publication publique impossible pour le moment.', !published);
  } catch (error) {
    toast(error.message || 'Numéro WhatsApp invalide.', true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function syncNow() {
  if (!session) return;
  toast('Synchronisation en cours…');
  await loadRemoteData();
  await render();
  toast('Données synchronisées.');
}

async function logout() {
  if (!confirm('Se déconnecter de ce compte ?\n\nLes données restent enregistrées et seront retrouvées à la prochaine connexion.')) return;
  await signOut();
  if ($('#app-dialog').open) closeDialog();
  showAuthScreen();
  toast('Vous êtes déconnecté.');
}

function bindAuthUI() {
  const form = $('#auth-form');
  if (!form) return;
  $$('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.authTab));
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseReady()) { setAuthError('Supabase n’est pas configuré.'); return; }
    const identifier = $('#auth-identifier')?.value.trim() || '';
    const password = $('#auth-password')?.value || '';
    const whatsapp = $('#auth-whatsapp')?.value.trim() || '';
    setAuthError('');
    if (!identifier) { setAuthError('Entrez votre email ou votre numéro de téléphone.'); return; }
    if (password.length < 6) { setAuthError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (authMode === 'signup') {
      try { normalizeWhatsAppNumber(whatsapp); } catch (error) { setAuthError(error.message); return; }
    }
    authBusy(true);
    try {
      if (authMode === 'signup') await signUpWithIdentifier(identifier, password, whatsapp);
      else await signInWithIdentifier(identifier, password);
      const passwordInput = $('#auth-password');
      if (passwordInput) passwordInput.value = '';
      await startApp();
      toast(authMode === 'signup' ? 'Compte créé · synchronisation activée.' : 'Connexion réussie.');
    } catch (error) {
      setAuthError(friendlyAuthError(error));
    } finally {
      authBusy(false);
    }
  });
  $('#auth-toggle-password')?.addEventListener('click', () => {
    const input = $('#auth-password');
    const button = $('#auth-toggle-password');
    if (!input || !button) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Masquer' : 'Afficher';
    button.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  });
  setAuthMode('signin');
}

async function startApp() {
  hideAuthScreen();
  updateAccountUI();
  try {
    await loadRemoteData();
    const migrated = await migrateLocalData();
    if (migrated) toast('Vos données locales ont été transférées sur votre compte.');
    if (!remoteSettings.organization_id) await writeMeta('organization_id', uid());
  } catch (error) {
    console.error(error);
    toast(`Synchronisation impossible : ${error.message || 'vérifiez votre réseau.'}`, true);
  }
  const initialPage = PAGE_LABELS[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  if (!location.hash) history.replaceState({ page: initialPage }, '', `#${initialPage}`);
  await setPage(initialPage);
  refreshOrderBadge();
  if (supabaseReady()) {
    syncManagerWhatsApp().catch((error) => console.error(error));
    getSnapshot()
      .then((snapshot) => {
        if (!snapshot.bands.length) return null;
        return publishStock({ silent: true });
      })
      .catch((error) => console.error(error));
  }
}

async function handleAction(action, button = null) {
  if (action === 'new-band') openBandForm();
  else if (action === 'edit-band') { if (button?.dataset?.bandId) await openBandForm(button.dataset.bandId); }
  else if (action === 'archive-band') { if (button?.dataset?.bandId) await archiveBand(button.dataset.bandId); }
  else if (action === 'restore-band') { if (button?.dataset?.bandId) await restoreBand(button.dataset.bandId); }
  else if (action === 'delete-band') { if (button?.dataset?.bandId) await deleteBandPermanently(button.dataset.bandId); }
  else if (action === 'delete-band-history') {
    const id = button?.dataset?.bandId;
    if (id && confirm('Supprimer tout l’historique (relevés) de cette bande ?')) {
      await deleteLogsForBand(id);
      toast('Historique supprimé.');
      await render();
    }
  }
  else if (action === 'show-credits') await openCreditsDialog();
  else if (action === 'download-receipt') { if (button?.dataset?.saleId) downloadReceipt(button.dataset.saleId, button); }
  else if (action === 'delete-sale') { if (button?.dataset?.saleId) await deleteSales([button.dataset.saleId]); }
  else if (action === 'delete-log') { if (button?.dataset?.logId) await deleteDailyLog(button.dataset.logId); }
  else if (action === 'delete-charge') { if (button?.dataset?.chargeId) await deleteCharge(button.dataset.chargeId); }
  else if (action === 'delete-selected-sales') {
    const ids = $$('[data-sale-check]:checked').map((node) => node.dataset.saleCheck);
    await deleteSales(ids);
  }
  else if (action === 'record-credit-payment') { if (button?.dataset?.saleId) await recordCreditPayment(button.dataset.saleId, button); }
  else if (action === 'new-daily') await openDailyForm();
  else if (action === 'new-sale') await openSaleForm();
  else if (action === 'new-charge') await openChargeForm();
  else if (action === 'refresh-orders') { await loadOrders({ force: true }).catch((error) => toast(error.message, true)); await render(); }
  else if (action === 'publish-stock') await publishStock();
  else if (action === 'copy-order-link') await copyOrderLink();
  else if (action === 'empty-trash') await emptyTrash();
  else if (action === 'validate-order') { if (button?.dataset?.orderId) await validateOrder(button.dataset.orderId, button); }
  else if (action === 'refuse-order') { if (button?.dataset?.orderId) await refuseOrder(button.dataset.orderId, button); }
  else if (action === 'restore-order') { if (button?.dataset?.orderId) await restoreOrder(button.dataset.orderId, button); }
  else if (action === 'account' || action === 'settings') await openAccountDialog();
  else if (action === 'save-whatsapp') await saveAccountWhatsApp(button);
  else if (action === 'sync-now') await syncNow().catch((error) => toast(error.message || 'Synchronisation impossible.', true));
  else if (action === 'logout') await logout();
}

async function routeEvent(event) {
  const bandDetail = event.target.closest('[data-band-detail]');
  if (bandDetail && !event.target.closest('button')) {
    await openBandDetail(bandDetail.dataset.bandDetail);
    return;
  }
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) {
    await setPage(pageButton.dataset.page, { pushHistory: true, scrollToTop: true });
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) { await handleAction(actionButton.dataset.action, actionButton); return; }
  if (event.target.closest('[data-close-dialog]')) closeDialog();
}

function handleTabKeydown(event) {
  const tab = event.target.closest('.nav-item[role="tab"]');
  if (!tab) return;
  const tabs = $$('.nav-item[role="tab"]');
  const currentIndex = tabs.indexOf(tab);
  let nextIndex;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else return;
  event.preventDefault();
  setPage(tabs[nextIndex].dataset.page, { pushHistory: true, focusTab: true, scrollToTop: true })
    .catch((error) => toast(error.message || 'Impossible d’ouvrir cette section.', true));
}

const IOS_INSTALL_KEY = 'volaille-ios-install-dismissed-v1';

function isIosDevice() {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
  return window.navigator.standalone === true
    || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function setupIosInstallGuide() {
  const banner = $('#ios-install');
  if (!banner || !isIosDevice() || isStandaloneMode()) return;
  let dismissed = false;
  try { dismissed = localStorage.getItem(IOS_INSTALL_KEY) === '1'; } catch (error) { /* stockage purgé */ }
  if (dismissed) return;
  banner.hidden = false;
  banner.querySelector('[data-dismiss-ios-install]')?.addEventListener('click', () => {
    banner.hidden = true;
    try { localStorage.setItem(IOS_INSTALL_KEY, '1'); } catch (error) { /* stockage purgé */ }
  });
}

async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch (error) {
    console.warn('Stockage persistant non accordé', error);
  }
}

async function main() {
  await requestPersistentStorage();
  try {
    db = await openDatabase();
  } catch (error) {
    console.warn('Stockage local indisponible (migration ignorée).', error);
    db = null;
  }
  await preloadLogo();
  setupIosInstallGuide();
  document.querySelectorAll('[data-icon]').forEach((node) => {
    if (ICONS[node.dataset.icon]) node.innerHTML = icon(node.dataset.icon);
  });
  document.addEventListener('click', routeEvent);
  $('#main-nav').addEventListener('keydown', handleTabKeydown);
  $('#page-container').addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'sales-select-all') {
      $$('[data-sale-check]').forEach((node) => { node.checked = target.checked; });
      updateSalesSelection();
    } else if (target.matches('[data-sale-check]')) {
      updateSalesSelection();
    }
  });
  $('#dialog-content').addEventListener('submit', (event) => {
    handleSubmit(event).catch((error) => toast(error.message || 'Échec de l’enregistrement.', true));
  });
  $('#app-dialog').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  });
  $('#app-dialog').addEventListener('click', (event) => {
    if (event.target === $('#app-dialog')) closeDialog();
  });
  window.addEventListener('online', () => { if (session) render().catch((error) => toast(error.message, true)); });
  window.addEventListener('offline', () => { if (session) render().catch((error) => toast(error.message, true)); });
  const navigateFromHistory = () => {
    if (!session) return;
    const page = location.hash.slice(1) || 'dashboard';
    setPage(page, { scrollToTop: true })
      .catch((error) => toast(error.message || 'Impossible de restaurer cette section.', true));
  };
  window.addEventListener('popstate', navigateFromHistory);
  window.addEventListener('hashchange', navigateFromHistory);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker non enregistré :', error));
  }
  bindAuthUI();
  updateAccountUI();
  const restored = await ensureSession();
  if (restored) {
    await startApp();
  } else {
    showAuthScreen();
  }
}

main().catch((error) => {
  console.error(error);
  document.body.classList.remove('is-authenticated');
  const screen = $('#auth-screen');
  if (screen) screen.hidden = false;
  setAuthError('Impossible de démarrer l’application. Vérifiez votre connexion puis rechargez la page.');
});
