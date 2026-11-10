const DB_NAME = 'poulet-pro';
const DB_VERSION = 1;
const DEFAULT_SUPABASE_URL = 'https://avoktrlsmbnisxxvxogc.supabase.co';
const STORE_NAMES = ['bands', 'daily_logs', 'inventory_items', 'inventory_movements', 'sales', 'charges', 'clients', 'outbox', 'meta'];
const ICONS = {
  dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
  bands: '<path d="M4 20V8l8-5 8 5v12"/><path d="M9 20v-6h6v6M3 20h18"/>',
  daily: '<path d="M8 3v4m8-4v4M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="m9 15 2 2 4-4"/>',
  stock: '<path d="M3 7 12 3l9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  sales: '<path d="M3 6h2l2 11h11l3-8H6"/><circle cx="9" cy="21" r="1"/><circle cx="17" cy="21" r="1"/><path d="M10 10h6m-3-3v6"/>',
  expenses: '<path d="M12 3v18m5-13a3 3 0 0 0-3-2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1-3-2"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  sync: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1.1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1.1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1.1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1.1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)"/>',
  bird: '<path d="M20 12c0 4-3 7-8 7H8l-3 2 1-4c-2-2-3-4-3-7 0-4 3-7 8-7s9 4 9 9Z"/><circle cx="15" cy="10" r="1"/>',
  feed: '<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v9l8 4 8-4V8M12 12v9"/>',
  water: '<path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z"/><path d="M9 16a3 3 0 0 0 3 2"/>',
  money: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/>',
  box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
};
const PAGE_LABELS = { dashboard: 'Vue d’ensemble', bands: 'Bandes', daily: 'Suivi quotidien', stock: 'Stocks', sales: 'Ventes', expenses: 'Charges', clients: 'Clients' };
const CATEGORY_LABELS = {
  starter: 'Aliment démarrage', grower: 'Aliment croissance', finisher: 'Aliment finition',
  veterinary: 'Produits vétérinaires', bedding: 'Litière / copeaux', heating: 'Gaz / chauffage', other: 'Autre intrant',
  health: 'Santé / prophylaxie', labor: 'Main-d’œuvre', water_energy: 'Eau / électricité',
  delivery: 'Transport livraison client', maintenance: 'Entretien',
};
const CHANNEL_LABELS = { wholesale: 'Grossiste / revendeur', restaurant: 'Restaurant', supermarket: 'Supermarché', retail: 'Détail / comptoir', other: 'Autre' };
const PAYMENT_LABELS = { cash: 'Espèces', mobile_money: 'Mobile Money', transfer: 'Virement', credit: 'Crédit client' };
const CLOUD_TABLES = {
  bands: 'batches', daily_logs: 'daily_logs', inventory_items: 'inventory_items',
  inventory_movements: 'inventory_movements', sales: 'poultry_sales', charges: 'charges', clients: 'clients',
};
let db;
let currentPage = 'dashboard';
let syncInProgress = false;

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

function readAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error(`Lecture impossible : ${storeName}.`));
  });
}

function readMeta(key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction('meta', 'readonly').objectStore('meta').get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error || new Error('Lecture des paramètres impossible.'));
  });
}

function writeMeta(key, value) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('meta', 'readwrite');
    transaction.objectStore('meta').put({ id: key, value });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Enregistrement des paramètres impossible.'));
  });
}

async function saveRecords(entries) {
  const timestamp = new Date().toISOString();
  const prepared = entries.map(({ store, record, enqueue = true }) => ({
    store, enqueue: enqueue && Boolean(CLOUD_TABLES[store]),
    record: { ...record, updated_at: timestamp },
  }));
  const names = [...new Set([...prepared.map((entry) => entry.store), ...(prepared.some((entry) => entry.enqueue) ? ['outbox'] : [])])];
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(names, 'readwrite');
    for (const entry of prepared) {
      transaction.objectStore(entry.store).put(entry.record);
      if (entry.enqueue) {
        transaction.objectStore('outbox').put({
          id: uid(), entity: entry.store, record: entry.record, created_at: timestamp,
        });
      }
    }
    transaction.oncomplete = () => resolve(prepared.map((entry) => entry.record));
    transaction.onerror = () => reject(transaction.error || new Error('Enregistrement local impossible.'));
    transaction.onabort = () => reject(transaction.error || new Error('Enregistrement local annulé.'));
  });
}

async function saveRecord(storeName, record, enqueue = true) {
  const [saved] = await saveRecords([{ store: storeName, record, enqueue }]);
  return saved;
}

async function removeOutbox(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('outbox', 'readwrite');
    transaction.objectStore('outbox').delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Impossible de confirmer la synchronisation.'));
  });
}

async function getSnapshot() {
  const [bands, logs, items, movements, sales, charges, clients, outbox] = await Promise.all([
    readAll('bands'), readAll('daily_logs'), readAll('inventory_items'), readAll('inventory_movements'),
    readAll('sales'), readAll('charges'), readAll('clients'), readAll('outbox'),
  ]);
  return { bands, logs, items, movements, sales, charges, clients, outbox };
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

function renderDashboard(snapshot) {
  const active = snapshot.bands.filter((band) => band.status !== 'closed');
  const live = sum(active, (band) => activeBirds(band, snapshot));
  const feedKg = sum(snapshot.logs, (log) => Number(log.feed_starter_kg) + Number(log.feed_grower_kg) + Number(log.feed_finisher_kg));
  const mortalities = sum(snapshot.logs, (log) => log.mortality);
  const initial = sum(snapshot.bands, (band) => band.initial_count);
  const mortalityRate = initial ? (mortalities / initial) * 100 : 0;
  const liveBiomass = sum(active, (band) => {
    const latestWeight = [...snapshot.logs].filter((log) => log.batch_id === band.id && log.avg_weight_kg > 0)
      .sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.avg_weight_kg || 0;
    return activeBirds(band, snapshot) * latestWeight;
  }) + sum(snapshot.sales, (sale) => sale.total_weight_kg);
  const feedConversion = liveBiomass > 0 ? number(feedKg / liveBiomass, 2) : '—';
  const revenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const totalCosts = sum(snapshot.bands, (band) => bandCost(band, snapshot))
    + sum(snapshot.charges.filter((charge) => !charge.batch_id), (charge) => charge.amount);
  const profit = revenue - totalCosts;
  const lowItems = snapshot.items.filter((item) => Number(item.quantity) <= Number(item.min_quantity));
  const last7 = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayLogs = snapshot.logs.filter((log) => log.log_date === key);
    return { day: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''), feed: sum(dayLogs, (log) => Number(log.feed_starter_kg) + Number(log.feed_grower_kg) + Number(log.feed_finisher_kg)) };
  });
  const maxFeed = Math.max(1, ...last7.map((day) => day.feed));
  const recentBands = [...snapshot.bands].sort((a, b) => b.arrival_date.localeCompare(a.arrival_date)).slice(0, 5);
  const rows = recentBands.map((band) => {
    const birds = activeBirds(band, snapshot);
    const days = daysSince(band.arrival_date);
    const deaths = sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.mortality);
    const rate = band.initial_count ? (deaths / Number(band.initial_count)) * 100 : 0;
    return `<tr><td class="primary-cell">${esc(band.name)}<span class="secondary-cell">${esc(band.strain || 'Souche non précisée')}</span></td>
      <td>${dateLabel(band.arrival_date)}</td><td>J${days}</td><td>${number(birds)}</td><td>${number(rate, 1)} %</td>
      <td><span class="status-pill ${band.status === 'closed' ? 'neutral' : ''}">${band.status === 'closed' ? 'Clôturée' : 'En cours'}</span></td></tr>`;
  }).join('');

  return `<div class="page-heading"><div><h1>Bonjour, bienvenue</h1><p>Voici le résumé de votre exploitation avicole.</p></div>
    <button class="primary-button" data-action="new-band"><span class="plus">+</span> Créer une bande</button></div>
    <section class="metrics-grid" aria-label="Indicateurs clés">
      ${metricCard('Sujets en élevage', number(live), `${active.length} bande${active.length > 1 ? 's' : ''} active${active.length > 1 ? 's' : ''}`, 'bird')}
      ${metricCard('Aliment distribué', `${number(feedKg, 1)} <small>kg</small>`, 'Depuis le début des cycles', 'feed')}
      ${metricCard('Mortalité cumulée', `${number(mortalityRate, 1)} <small>%</small>`, `${number(mortalities)} sujet${mortalities > 1 ? 's' : ''} enregistré${mortalities > 1 ? 's' : ''}`, 'daily', mortalityRate > 5 ? 'low-stock' : '')}
      ${metricCard('Chiffre d’affaires', currency(revenue), `Marge estimée : ${currency(profit)}`, 'money', profit >= 0 ? 'positive' : 'low-stock')}
      ${metricCard('Indice de consommation', feedConversion, liveBiomass ? 'kg aliment / kg vif mesuré' : 'Disponible après une pesée', 'feed')}
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h2>Consommation d’aliment</h2><p>Quantités saisies sur les 7 derniers jours</p></div><span class="status-pill neutral">kg / jour</span></div>
        <div class="chart-area">${snapshot.logs.length ? last7.map((day) => `<div class="chart-column"><span class="chart-value">${day.feed ? number(day.feed, 1) : ''}</span><div class="chart-bar-track"><div class="chart-bar" style="height:${Math.max(day.feed ? 5 : 0, (day.feed / maxFeed) * 100)}%"></div></div><span class="chart-day">${esc(day.day)}</span></div>`).join('') : '<div class="chart-empty">Vos saisies de consommation apparaîtront ici.</div>'}</div>
      </article>
      <article class="panel"><div class="panel-header"><div><h2>Actions rapides</h2><p>Enregistrez une opération</p></div></div><div class="quick-actions">
        <button class="quick-action" data-action="new-daily"><span class="quick-icon">${icon('daily')}</span><span class="quick-copy"><strong>Suivi du jour</strong><small>Mortalité, aliment, poids</small></span><span class="quick-arrow">›</span></button>
        <button class="quick-action" data-action="new-stock"><span class="quick-icon">${icon('box')}</span><span class="quick-copy"><strong>Entrée de stock</strong><small>Aliments et intrants</small></span><span class="quick-arrow">›</span></button>
        <button class="quick-action" data-action="new-sale"><span class="quick-icon">${icon('sales')}</span><span class="quick-copy"><strong>Nouvelle vente</strong><small>Commande et paiement</small></span><span class="quick-arrow">›</span></button>
      </div></article>
    </section>
    ${lowItems.length ? `<section class="panel" style="margin-bottom:16px"><div class="panel-header"><div><h2>Alertes de stock</h2><p>${lowItems.length} référence${lowItems.length > 1 ? 's' : ''} au seuil minimum ou en dessous</p></div><button class="text-button" data-page="stock">Voir les stocks →</button></div><div class="table-wrap"><table><thead><tr><th>Produit</th><th>Catégorie</th><th>Disponible</th><th>Seuil</th></tr></thead><tbody>${lowItems.slice(0, 4).map((item) => `<tr><td class="primary-cell">${esc(item.name)}</td><td>${esc(item.category)}</td><td class="low-stock">${number(item.quantity, 1)} ${esc(item.unit)}</td><td>${number(item.min_quantity, 1)} ${esc(item.unit)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
    <section class="panel table-panel"><div class="panel-header"><div><h2>Bandes récentes</h2><p>Suivi des cycles de production actifs</p></div><button class="text-button" data-page="bands">Toutes les bandes →</button></div>
      ${rows ? `<div class="table-wrap"><table><thead><tr><th>Bande / souche</th><th>Mise en place</th><th>Âge</th><th>Sujets vivants</th><th>Mortalité</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : emptyState('Aucune bande pour le moment', 'Créez votre premier lot pour commencer le suivi.', '<button class="primary-button" data-action="new-band">Créer une bande</button>')}</section>`;
}

function renderBands(snapshot) {
  const rows = [...snapshot.bands].sort((a, b) => b.arrival_date.localeCompare(a.arrival_date)).map((band) => {
    const birds = activeBirds(band, snapshot);
    const mortality = sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.mortality);
    const percent = band.initial_count ? (mortality / band.initial_count) * 100 : 0;
    const days = daysSince(band.arrival_date);
    const weight = [...snapshot.logs].filter((log) => log.batch_id === band.id && log.avg_weight_kg).sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.avg_weight_kg;
    const weightText = weight ? `${number(weight, 2)} kg / ${number(band.target_weight_kg, 2)} kg cible` : `— / ${number(band.target_weight_kg, 2)} kg cible`;
    const forecast = new Date(`${band.arrival_date}T12:00:00`);
    forecast.setDate(forecast.getDate() + Number(band.target_age_days || 42));
    const saleableHeads = birds + sum(snapshot.sales.filter((sale) => sale.batch_id === band.id), (sale) => sale.heads);
    const unitCost = saleableHeads ? bandCost(band, snapshot) / saleableHeads : 0;
    return `<tr><td class="primary-cell">${esc(band.name)}<span class="secondary-cell">${esc(band.strain || 'Souche non précisée')} · ${esc(band.supplier || 'Fournisseur non précisé')}</span></td>
      <td>${dateLabel(band.arrival_date)}</td><td>J${days} / ${Number(band.target_age_days || 42)} j</td><td>${dateLabel(`${forecast.getFullYear()}-${String(forecast.getMonth() + 1).padStart(2, '0')}-${String(forecast.getDate()).padStart(2, '0')}`)}</td>
      <td>${number(birds)}</td><td>${number(percent, 1)} %</td><td>${weightText}</td><td>${currency(unitCost)}</td>
      <td>${currency(bandCost(band, snapshot))}</td><td><span class="status-pill ${band.status === 'closed' ? 'neutral' : ''}">${band.status === 'closed' ? 'Clôturée' : 'En cours'}</span></td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Bandes de production</h1><p>Suivez vos lots de poulets de chair du démarrage à la vente.</p></div><button class="primary-button" data-action="new-band"><span class="plus">+</span> Nouvelle bande</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Tous les lots</h2><p>${snapshot.bands.length} bande${snapshot.bands.length > 1 ? 's' : ''} enregistrée${snapshot.bands.length > 1 ? 's' : ''}</p></div></div>
      ${rows ? `<div class="table-wrap"><table><thead><tr><th>Bande / souche</th><th>Arrivée</th><th>Âge</th><th>Vente cible estimée</th><th>En élevage</th><th>Mortalité</th><th>Poids réel / cible</th><th>Coût / sujet sorti</th><th>Coût cumulé</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Pas encore de bande', 'Ajoutez un lot pour calculer son coût de revient et suivre ses performances.', '<button class="primary-button" data-action="new-band">Créer la première bande</button>')}</section>`;
}

function renderDaily(snapshot) {
  const rows = [...snapshot.logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).map((log) => {
    const band = snapshot.bands.find((item) => item.id === log.batch_id);
    const totalFeed = Number(log.feed_starter_kg) + Number(log.feed_grower_kg) + Number(log.feed_finisher_kg);
    return `<tr><td>${dateLabel(log.log_date)}</td><td class="primary-cell">${esc(band?.name || 'Bande supprimée')}</td><td>${number(log.mortality)}</td><td>${number(log.culls)}</td><td>${number(totalFeed, 1)} kg</td><td>${number(log.water_liters, 1)} L</td><td>${log.avg_weight_kg ? `${number(log.avg_weight_kg, 3)} kg` : '—'}</td><td>${currency(Number(log.feed_cost) + Number(log.health_cost) + Number(log.other_cost))}</td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Suivi quotidien</h1><p>Consignez les performances au poulailler, même sans connexion.</p></div><button class="primary-button" data-action="new-daily"><span class="plus">+</span> Saisie du jour</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des relevés</h2><p>${snapshot.logs.length} relevé${snapshot.logs.length > 1 ? 's' : ''}</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Bande</th><th>Morts</th><th>Tri</th><th>Aliment</th><th>Eau</th><th>Poids moyen</th><th>Coût saisi</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucun relevé quotidien', 'Les mortalités, consommations et pesées se saisissent ici.', '<button class="primary-button" data-action="new-daily">Ajouter un relevé</button>')}</section>`;
}

function renderStock(snapshot) {
  const rows = [...snapshot.items].sort((a, b) => a.name.localeCompare(b.name)).map((item) => {
    const low = Number(item.quantity) <= Number(item.min_quantity);
    return `<tr><td class="primary-cell">${esc(item.name)}<span class="secondary-cell">${esc(CATEGORY_LABELS[item.category] || item.category)}</span></td><td>${number(item.quantity, 1)} ${esc(item.unit)}</td><td>${number(item.min_quantity, 1)} ${esc(item.unit)}</td><td>${currency(item.average_unit_cost)}/${esc(item.unit)}</td><td><span class="status-pill ${low ? 'warning' : 'neutral'}">${low ? 'À réapprovisionner' : 'Disponible'}</span></td></tr>`;
  }).join('');
  const value = sum(snapshot.items, (item) => Number(item.quantity) * Number(item.average_unit_cost));
  return `<div class="page-heading"><div><h1>Stocks & intrants</h1><p>Aliments, santé animale, litière et combustible de chauffage.</p></div><button class="primary-button" data-action="new-stock"><span class="plus">+</span> Entrée de stock</button></div>
    <section class="metrics-grid">
      ${metricCard('Références suivies', number(snapshot.items.length), 'Produits enregistrés', 'box')}
      ${metricCard('Valeur estimée', currency(value), 'Calculée au coût moyen pondéré', 'money')}
      ${metricCard('Alertes de stock', number(snapshot.items.filter((item) => Number(item.quantity) <= Number(item.min_quantity)).length), 'À réapprovisionner', 'stock')}
      ${metricCard('Mouvements', number(snapshot.movements.length), 'Entrées et consommations', 'daily')}
    </section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Inventaire actuel</h2><p>Les quantités sont mises à jour à chaque saisie de consommation.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Produit</th><th>Quantité</th><th>Seuil d’alerte</th><th>Coût moyen unitaire</th><th>État</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Inventaire vide', 'Enregistrez vos premières livraisons d’aliments ou d’intrants.', '<button class="primary-button" data-action="new-stock">Ajouter un produit</button>')}</section>`;
}

function renderSales(snapshot) {
  const rows = [...snapshot.sales].sort((a, b) => b.sale_date.localeCompare(a.sale_date)).map((sale) => {
    const band = snapshot.bands.find((item) => item.id === sale.batch_id);
    const client = snapshot.clients.find((item) => item.id === sale.client_id);
    const due = Number(sale.total_amount) - Number(sale.paid_amount);
    return `<tr><td>${dateLabel(sale.sale_date)}</td><td class="primary-cell">${esc(client?.name || 'Vente comptoir')}</td><td>${esc(band?.name || '—')}</td><td>${number(sale.heads)}</td><td>${number(sale.total_weight_kg, 1)} kg</td><td>${currency(sale.total_amount)}</td><td>${currency(due)}</td><td>${esc(PAYMENT_LABELS[sale.payment_method] || sale.payment_method)}</td><td><span class="status-pill ${due > 0 ? 'warning' : ''}">${due > 0 ? 'À encaisser' : 'Payée'}</span></td></tr>`;
  }).join('');
  const revenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const unpaid = sum(snapshot.sales, (sale) => Number(sale.total_amount) - Number(sale.paid_amount));
  return `<div class="page-heading"><div><h1>Ventes & commandes</h1><p>Associez chaque vente à son lot et suivez les règlements clients.</p></div><button class="primary-button" data-action="new-sale"><span class="plus">+</span> Nouvelle vente</button></div>
    <section class="metrics-grid">${metricCard('Ventes enregistrées', number(snapshot.sales.length), 'Toutes périodes', 'sales')}${metricCard('Chiffre d’affaires', currency(revenue), 'Montant total vendu', 'money')}${metricCard('Crédits clients', currency(unpaid), 'Reste à encaisser', 'daily')}${metricCard('Sujets vendus', number(sum(snapshot.sales, (sale) => sale.heads)), 'Poulets de chair', 'bird')}</section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des ventes</h2><p>Vente en gros, au détail ou sur commande.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Bande source</th><th>Sujets</th><th>Poids total</th><th>Montant</th><th>Solde</th><th>Mode de paiement</th><th>État</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucune vente enregistrée', 'Enregistrez une vente pour suivre les recettes et les sujets disponibles.', '<button class="primary-button" data-action="new-sale">Créer une vente</button>')}</section>`;
}

function renderExpenses(snapshot) {
  const rows = [...snapshot.charges].sort((a, b) => b.charge_date.localeCompare(a.charge_date)).map((charge) => {
    const band = snapshot.bands.find((item) => item.id === charge.batch_id);
    return `<tr><td>${dateLabel(charge.charge_date)}</td><td class="primary-cell">${esc(charge.description)}</td><td>${esc(CATEGORY_LABELS[charge.category] || charge.category)}</td><td>${esc(band?.name || 'Exploitation')}</td><td>${currency(charge.amount)}</td></tr>`;
  }).join('');
  const total = sum(snapshot.charges, (charge) => charge.amount);
  return `<div class="page-heading"><div><h1>Charges d’exploitation</h1><p>Centralisez les dépenses directes et communes de la ferme.</p></div><button class="primary-button" data-action="new-charge"><span class="plus">+</span> Ajouter une charge</button></div>
    <section class="metrics-grid">${metricCard('Charges enregistrées', number(snapshot.charges.length), 'Dépenses hors aliment', 'expenses')}${metricCard('Total des charges', currency(total), 'Depuis l’ouverture', 'money')}${metricCard('Coûts des bandes', currency(sum(snapshot.bands, (band) => bandCost(band, snapshot))), 'Poussins, transport, aliment et soins', 'bird')}${metricCard('Dépenses générales', currency(sum(snapshot.charges.filter((item) => !item.batch_id), (item) => item.amount)), 'Non affectées à un lot', 'stock')}</section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Journal des charges</h2><p>Les aliments consommés sont calculés dans le coût de chaque bande.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Affectation</th><th>Montant</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucune charge saisie', 'Ajoutez le chauffage, la main-d’œuvre, les soins ou les frais de livraison.', '<button class="primary-button" data-action="new-charge">Ajouter une charge</button>')}</section>`;
}

function renderClients(snapshot) {
  const rows = [...snapshot.clients].sort((a, b) => a.name.localeCompare(b.name)).map((client) => {
    const sales = snapshot.sales.filter((sale) => sale.client_id === client.id);
    const outstanding = sum(sales, (sale) => Number(sale.total_amount) - Number(sale.paid_amount));
    return `<tr><td class="primary-cell">${esc(client.name)}</td><td>${esc(client.phone || '—')}</td><td>${esc(client.email || '—')}</td><td>${number(sales.length)}</td><td>${currency(outstanding)}</td><td>${esc(CHANNEL_LABELS[client.channel] || client.channel || '—')}</td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Carnet clients</h1><p>Clients grossistes, revendeurs, restaurants et particuliers.</p></div><button class="primary-button" data-action="new-client"><span class="plus">+</span> Nouveau client</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Répertoire clients</h2><p>${snapshot.clients.length} client${snapshot.clients.length > 1 ? 's' : ''}</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Nom / entreprise</th><th>Téléphone</th><th>E-mail</th><th>Commandes</th><th>Crédit restant</th><th>Canal</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Votre carnet est vide', 'Ajoutez vos clients pour retrouver leurs coordonnées lors des ventes.', '<button class="primary-button" data-action="new-client">Ajouter un client</button>')}</section>`;
}

async function render() {
  const snapshot = await getSnapshot();
  window.snapshot = snapshot;
  const renderers = { dashboard: renderDashboard, bands: renderBands, daily: renderDaily, stock: renderStock, sales: renderSales, expenses: renderExpenses, clients: renderClients };
  $('#page-container').innerHTML = renderers[currentPage](snapshot);
  $('#page-container').setAttribute('aria-labelledby', `tab-${currentPage}`);
  $('#page-title').textContent = PAGE_LABELS[currentPage];
  $('#band-count').textContent = snapshot.bands.length;
  $('#pending-count').textContent = snapshot.outbox.length;
  $('#pending-count').classList.toggle('has-pending', snapshot.outbox.length > 0);
  $('#today-label').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  $('#connection-label').textContent = navigator.onLine ? 'Mode hors ligne prêt' : 'Connexion indisponible';
  $('#sync-label').textContent = snapshot.outbox.length ? `${snapshot.outbox.length} modification${snapshot.outbox.length > 1 ? 's' : ''} en attente` : 'Données enregistrées ici';
  $('.offline-dot').classList.toggle('offline', !navigator.onLine);
  $('#sync-button').disabled = syncInProgress || !snapshot.outbox.length;
  $('#sync-button').setAttribute('aria-label', snapshot.outbox.length
    ? `Synchroniser ${snapshot.outbox.length} modification${snapshot.outbox.length === 1 ? '' : 's'} en attente`
    : 'Aucune modification en attente de synchronisation');
  $('#sync-button').setAttribute('aria-busy', String(syncInProgress));
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

function openBandForm() {
  setDialog('Créer une bande', 'Renseignez le lot et le coût d’acquisition à la mise en place.', `
    <form class="dialog-form" id="band-form"><div class="form-grid">
      <div class="field"><label for="band-name">Nom de la bande *</label><input id="band-name" name="name" required maxlength="80" placeholder="Ex. Bande Mars — bâtiment 1" /></div>
      <div class="field"><label for="band-strain">Souche</label><select id="band-strain" name="strain"><option>Ross 308</option><option>Cobb 500</option><option>Hubbard</option><option>Autre</option></select></div>
      <div class="field"><label for="band-date">Date de mise en place *</label><input id="band-date" name="arrival_date" type="date" value="${today()}" required /></div>
      <div class="field"><label for="band-count-input">Nombre de poussins *</label><input id="band-count-input" name="initial_count" type="number" inputmode="numeric" min="1" step="1" required placeholder="Ex. 1 000" /></div>
      <div class="field"><label for="band-supplier">Fournisseur</label><input id="band-supplier" name="supplier" maxlength="100" placeholder="Couvoir / fournisseur" /></div>
      <div class="field"><label for="band-weight">Poids cible (kg / sujet)</label><input id="band-weight" name="target_weight_kg" type="number" inputmode="decimal" min="0" step="0.01" value="2.2" /></div>
      <div class="field"><label for="band-age">Cycle cible (jours)</label><input id="band-age" name="target_age_days" type="number" inputmode="numeric" min="1" max="120" step="1" value="42" /></div>
      <div class="field"><label for="chick-price">Prix unitaire du poussin (FCFA) *</label><input id="chick-price" name="chick_unit_cost" type="number" inputmode="decimal" min="0" step="1" required value="0" /></div>
      <div class="field"><label for="transport-cost">Transport initial (FCFA)</label><input id="transport-cost" name="transport_cost" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="cost-preview"><span>Coût initial (poussins + transport)</span><strong id="initial-cost-preview">0 FCFA</strong></div>
      <div class="field full"><span class="field-hint">Le coût total des poussins est calculé automatiquement : effectif × prix unitaire. Le transport est comptabilisé séparément dans le coût du lot.</span></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer la bande</button></div></form>`);

  const updatePreview = () => {
    const count = Number($('#band-count-input').value) || 0;
    const price = Number($('#chick-price').value) || 0;
    const transport = Number($('#transport-cost').value) || 0;
    $('#initial-cost-preview').textContent = currency(count * price + transport);
  };
  ['#band-count-input', '#chick-price', '#transport-cost'].forEach((selector) => $(selector).addEventListener('input', updatePreview));
}

async function openDailyForm() {
  const snapshot = await getSnapshot();
  const bands = snapshot.bands.filter((band) => band.status !== 'closed');
  if (!bands.length) { toast('Créez d’abord une bande avant de saisir un relevé.', true); return; }
  const items = snapshot.items;
  setDialog('Saisie quotidienne', 'Les données sont enregistrées sur cet appareil, même sans réseau.', `
    <form class="dialog-form" id="daily-form"><div class="form-grid">
      <div class="field"><label for="log-band">Bande *</label><select id="log-band" name="batch_id" required>${batchSelect(bands)}</select></div>
      <div class="field"><label for="log-date">Date du relevé *</label><input id="log-date" name="log_date" type="date" value="${today()}" max="${today()}" required /></div>
      <div class="field"><label for="log-mortality">Mortalité du jour (sujets)</label><input id="log-mortality" name="mortality" type="number" inputmode="numeric" min="0" step="1" value="0" /></div>
      <div class="field"><label for="log-culls">Tri / réformes (sujets)</label><input id="log-culls" name="culls" type="number" inputmode="numeric" min="0" step="1" value="0" /></div>
      <div class="field"><label for="log-starter">Aliment démarrage (kg)</label><input id="log-starter" name="feed_starter_kg" type="number" inputmode="decimal" min="0" step="0.1" value="0" /></div>
      <div class="field"><label for="log-grower">Aliment croissance (kg)</label><input id="log-grower" name="feed_grower_kg" type="number" inputmode="decimal" min="0" step="0.1" value="0" /></div>
      <div class="field"><label for="log-finisher">Aliment finition (kg)</label><input id="log-finisher" name="feed_finisher_kg" type="number" inputmode="decimal" min="0" step="0.1" value="0" /></div>
      <div class="field"><label for="log-water">Eau consommée (litres)</label><input id="log-water" name="water_liters" type="number" inputmode="decimal" min="0" step="0.1" value="0" /></div>
      <div class="field"><label for="log-weight">Poids moyen mesuré (kg / sujet)</label><input id="log-weight" name="avg_weight_kg" type="number" inputmode="decimal" min="0" step="0.001" placeholder="Facultatif" /></div>
      <div class="field"><label for="log-health-cost">Soins / prophylaxie (FCFA)</label><input id="log-health-cost" name="health_cost" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="field"><label for="log-other-cost">Autres coûts du jour (FCFA)</label><input id="log-other-cost" name="other_cost" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="field"><label for="log-treatment">Traitement / observation</label><input id="log-treatment" name="treatment" maxlength="200" placeholder="Vaccin, vitamines, observation…" /></div>
      <div class="field full"><label for="log-note">Note</label><textarea id="log-note" name="note" maxlength="1000" placeholder="Observation du bâtiment, température, incident…"></textarea></div>
      <div class="field full"><span class="field-hint">${items.length ? 'Les aliments consommés doivent être inventoriés en kg ; le stock et le coût moyen seront déduits automatiquement.' : 'Ajoutez les aliments dans Stocks, en kg, avant de saisir leur consommation afin de calculer le coût et l’indice de consommation.'}</span></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer le relevé</button></div></form>`);
}

function openStockForm() {
  setDialog('Entrée de stock', 'Ajoutez un produit ou réceptionnez une nouvelle livraison.', `
    <form class="dialog-form" id="stock-form"><div class="form-grid">
      <div class="field full"><label for="stock-name">Nom du produit *</label><input id="stock-name" name="name" required maxlength="100" placeholder="Ex. Aliment croissance — sac 50 kg" /></div>
      <div class="field"><label for="stock-category">Catégorie *</label><select id="stock-category" name="category"><option value="starter">Aliment démarrage</option><option value="grower">Aliment croissance</option><option value="finisher">Aliment finition</option><option value="veterinary">Produits vétérinaires</option><option value="bedding">Litière / copeaux</option><option value="heating">Gaz / chauffage</option><option value="other">Autre intrant</option></select></div>
      <div class="field"><label for="stock-unit">Unité *</label><select id="stock-unit" name="unit"><option value="kg">kg</option><option value="sac">sac</option><option value="litre">litre</option><option value="unité">unité</option></select></div>
      <div class="field"><label for="stock-quantity">Quantité reçue *</label><input id="stock-quantity" name="quantity" type="number" inputmode="decimal" min="0.01" step="0.01" required /></div>
      <div class="field"><label for="stock-threshold">Seuil d’alerte</label><input id="stock-threshold" name="min_quantity" type="number" inputmode="decimal" min="0" step="0.01" value="0" /></div>
      <div class="field"><label for="stock-unit-cost">Prix d’achat par unité (FCFA)</label><input id="stock-unit-cost" name="unit_cost" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="field"><label for="stock-transport">Transport de cette livraison (FCFA)</label><input id="stock-transport" name="transport_cost" type="number" inputmode="decimal" min="0" step="1" value="0" /></div>
      <div class="field"><label for="stock-date">Date de réception *</label><input id="stock-date" name="movement_date" type="date" value="${today()}" required /></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer la livraison</button></div></form>`);
}

async function openSaleForm() {
  const snapshot = await getSnapshot();
  const bands = snapshot.bands.filter((band) => band.status !== 'closed' && activeBirds(band, snapshot) > 0);
  if (!bands.length) { toast('Aucun sujet disponible à la vente. Créez une bande ou vérifiez vos effectifs.', true); return; }
  setDialog('Nouvelle vente', 'Associez la vente à un lot pour assurer la traçabilité.', `
    <form class="dialog-form" id="sale-form"><div class="form-grid">
      <div class="field"><label for="sale-band">Bande source *</label><select id="sale-band" name="batch_id" required>${batchSelect(bands)}</select></div>
      <div class="field"><label for="sale-date">Date de vente *</label><input id="sale-date" name="sale_date" type="date" value="${today()}" required /></div>
      <div class="field"><label for="sale-client">Client</label><select id="sale-client" name="client_id"><option value="">Vente comptoir / client ponctuel</option>${snapshot.clients.map((client) => `<option value="${esc(client.id)}">${esc(client.name)}</option>`).join('')}</select></div>
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
  const bands = (await readAll('bands')).filter((band) => band.status !== 'closed');
  setDialog('Ajouter une charge', 'Les dépenses peuvent être affectées à un lot ou à toute l’exploitation.', `
    <form class="dialog-form" id="charge-form"><div class="form-grid">
      <div class="field"><label for="charge-date">Date *</label><input id="charge-date" name="charge_date" type="date" value="${today()}" required /></div>
      <div class="field"><label for="charge-category">Catégorie *</label><select id="charge-category" name="category"><option value="health">Santé / prophylaxie</option><option value="heating">Chauffage / combustible</option><option value="labor">Main-d’œuvre</option><option value="water_energy">Eau / électricité</option><option value="delivery">Transport livraison client</option><option value="bedding">Litière</option><option value="maintenance">Entretien</option><option value="other">Autre</option></select></div>
      <div class="field full"><label for="charge-description">Libellé *</label><input id="charge-description" name="description" required maxlength="160" placeholder="Ex. Facture électricité du bâtiment 1" /></div>
      <div class="field"><label for="charge-amount">Montant (FCFA) *</label><input id="charge-amount" name="amount" type="number" inputmode="decimal" min="1" step="1" required /></div>
      <div class="field"><label for="charge-band">Affectation</label><select id="charge-band" name="batch_id"><option value="">Exploitation générale</option>${bands.map((band) => `<option value="${esc(band.id)}">${esc(band.name)}</option>`).join('')}</select></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer la charge</button></div></form>`);
}

function openClientForm() {
  setDialog('Nouveau client', 'Enregistrez les coordonnées de vos acheteurs habituels.', `
    <form class="dialog-form" id="client-form"><div class="form-grid">
      <div class="field full"><label for="client-name">Nom / entreprise *</label><input id="client-name" name="name" required maxlength="120" placeholder="Ex. Restaurant Le Marché" /></div>
      <div class="field"><label for="client-phone">Téléphone / WhatsApp</label><input id="client-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" placeholder="+221…" /></div>
      <div class="field"><label for="client-email">E-mail</label><input id="client-email" name="email" type="email" autocomplete="email" maxlength="160" placeholder="contact@entreprise.com" /></div>
      <div class="field"><label for="client-channel">Canal de vente</label><select id="client-channel" name="channel"><option value="wholesale">Grossiste / revendeur</option><option value="restaurant">Restaurant</option><option value="supermarket">Supermarché</option><option value="retail">Détail / comptoir</option><option value="other">Autre</option></select></div>
      <div class="field"><label for="client-note">Note</label><input id="client-note" name="note" maxlength="200" placeholder="Préférences, adresse…" /></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Annuler</button><button class="primary-button" type="submit">Enregistrer le client</button></div></form>`);
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const numericFields = ['initial_count', 'chick_unit_cost', 'transport_cost', 'target_weight_kg', 'target_age_days', 'mortality', 'culls', 'feed_starter_kg', 'feed_grower_kg', 'feed_finisher_kg', 'water_liters', 'avg_weight_kg', 'health_cost', 'other_cost', 'quantity', 'min_quantity', 'unit_cost', 'heads', 'unit_weight_kg', 'price_per_kg', 'paid_amount', 'amount'];
  for (const key of numericFields) {
    if (key in values) values[key] = key === 'avg_weight_kg' && values[key] === '' ? null : Number(values[key]) || 0;
  }
  const base = { id: uid(), organization_id: await readMeta('organization_id'), created_at: new Date().toISOString() };

  if (form.id === 'band-form') {
    const record = {
      ...base, ...values, chick_total_cost: values.initial_count * values.chick_unit_cost,
      status: 'active', target_age_days: 42,
    };
    await saveRecord('bands', record);
  } else if (form.id === 'daily-form') {
    const snapshot = await getSnapshot();
    const band = snapshot.bands.find((item) => item.id === values.batch_id);
    if (!band) throw new Error('La bande sélectionnée n’existe plus.');
    const used = values.mortality + values.culls;
    if (used > activeBirds(band, snapshot)) throw new Error('La mortalité et le tri dépassent le nombre de sujets présents.');
    if (snapshot.logs.some((log) => log.batch_id === values.batch_id && log.log_date === values.log_date)) {
      throw new Error('Un relevé existe déjà pour cette bande et cette date.');
    }
    const quantities = { starter: values.feed_starter_kg, grower: values.feed_grower_kg, finisher: values.feed_finisher_kg };
    let feedCost = 0;
    const stockPlan = [];
    for (const [category, requested] of Object.entries(quantities)) {
      if (!requested) continue;
      const categoryItems = snapshot.items.filter((item) => item.category === category);
      if (!categoryItems.length) throw new Error(`Ajoutez d’abord l’aliment ${CATEGORY_LABELS[category]} aux stocks pour enregistrer sa consommation et son coût.`);
      const kgItems = categoryItems.filter((item) => item.unit === 'kg');
      if (!kgItems.length) throw new Error(`L’aliment ${CATEGORY_LABELS[category]} doit être inventorié en kg pour suivre sa consommation quotidienne.`);
      let remaining = requested;
      for (const stock of kgItems) {
        const quantity = Math.min(remaining, Number(stock.quantity));
        if (quantity > 0) {
          feedCost += quantity * Number(stock.average_unit_cost || 0);
          stockPlan.push({ stock, requested: quantity });
          remaining -= quantity;
        }
        if (remaining <= 0) break;
      }
      if (remaining > 0) {
        const available = sum(kgItems, (item) => item.quantity);
        throw new Error(`Stock insuffisant pour ${CATEGORY_LABELS[category]} (${number(available, 1)} kg disponible).`);
      }
    }
    const record = { ...base, ...values, feed_cost: feedCost };
    const entries = [{ store: 'daily_logs', record }];
    for (const { stock, requested } of stockPlan) {
      entries.push({
        store: 'inventory_items',
        record: { ...stock, quantity: Number(stock.quantity) - requested, organization_id: stock.organization_id || base.organization_id },
      });
      entries.push({
        store: 'inventory_movements',
        record: {
        ...base, id: uid(), item_id: stock.id, batch_id: values.batch_id, movement_type: 'consumption',
        quantity_delta: -requested, unit_cost: Number(stock.average_unit_cost || 0), transport_cost: 0, movement_date: values.log_date,
        },
      });
    }
    await saveRecords(entries);
  } else if (form.id === 'stock-form') {
    const existing = (await readAll('inventory_items')).find((item) => item.name.toLowerCase() === values.name.trim().toLowerCase() && item.unit === values.unit);
    const costIncludingTransport = values.quantity ? ((values.quantity * values.unit_cost + values.transport_cost) / values.quantity) : 0;
    const totalQuantity = Number(existing?.quantity || 0) + values.quantity;
    const average = totalQuantity
      ? ((Number(existing?.quantity || 0) * Number(existing?.average_unit_cost || 0)) + (values.quantity * costIncludingTransport)) / totalQuantity
      : costIncludingTransport;
    const item = {
      ...base, id: existing?.id || uid(), organization_id: existing?.organization_id || base.organization_id,
      name: values.name.trim(), category: values.category, unit: values.unit, min_quantity: values.min_quantity,
      quantity: totalQuantity, average_unit_cost: average,
    };
    await saveRecord('inventory_items', item);
    await saveRecord('inventory_movements', {
      ...base, item_id: item.id, batch_id: null, movement_type: 'purchase', quantity_delta: values.quantity,
      unit_cost: values.unit_cost, transport_cost: values.transport_cost, movement_date: values.movement_date,
    });
  } else if (form.id === 'sale-form') {
    const snapshot = await getSnapshot();
    const band = snapshot.bands.find((item) => item.id === values.batch_id);
    if (!band || values.heads > activeBirds(band, snapshot)) throw new Error(`Quantité indisponible. ${band ? `${activeBirds(band, snapshot)} sujets` : 'Vérifiez la bande'} disponibles.`);
    const totalWeight = values.heads * values.unit_weight_kg;
    const totalAmount = totalWeight * values.price_per_kg;
    if (values.paid_amount > totalAmount) throw new Error('Le règlement ne peut pas dépasser le montant de la vente.');
    await saveRecord('sales', {
      ...base, ...values, client_id: values.client_id || null,
      total_weight_kg: totalWeight, total_amount: totalAmount, payment_status: values.paid_amount >= totalAmount ? 'paid' : 'partial',
    });
  } else if (form.id === 'charge-form') {
    await saveRecord('charges', { ...base, ...values, batch_id: values.batch_id || null });
  } else if (form.id === 'client-form') {
    await saveRecord('clients', { ...base, ...values, name: values.name.trim() });
  }
  closeDialog();
  await render();
  toast('Enregistré sur cet appareil.');
}

async function assignOrganization(organizationId) {
  const currentOrganization = await readMeta('organization_id');
  if (currentOrganization && currentOrganization !== organizationId) {
    throw new Error('Ces données locales sont déjà liées à une autre exploitation. Utilisez un navigateur/profil séparé pour éviter de mélanger les comptes.');
  }
  await writeMeta('organization_id', organizationId);
  const names = STORE_NAMES.filter((name) => !['outbox', 'meta'].includes(name));
  const all = await Promise.all(names.map((name) => readAll(name)));
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([...names, 'outbox'], 'readwrite');
    names.forEach((name, index) => all[index].forEach((record) => {
      if (!record.organization_id || record.organization_id !== organizationId) {
        transaction.objectStore(name).put({ ...record, organization_id: organizationId });
      }
    }));
    transaction.objectStore('outbox').getAll().onsuccess = (event) => {
      for (const entry of event.target.result) {
        if (CLOUD_TABLES[entry.entity]) transaction.objectStore('outbox').put({
          ...entry, record: { ...entry.record, organization_id: organizationId },
        });
      }
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Impossible d’associer les données à l’exploitation.'));
  });
}

async function supabaseFetch(path, options = {}, retry = true) {
  const config = JSON.parse(localStorage.getItem('poulet-supabase-config') || '{}');
  const accessToken = sessionStorage.getItem('poulet-access-token');
  if (!config.url || !config.anonKey || !accessToken) throw new Error('Connectez-vous à Supabase depuis Paramètres avant de synchroniser.');
  const response = await fetch(`${config.url.replace(/\/+$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (response.status === 401 && retry && sessionStorage.getItem('poulet-refresh-token')) {
    const refreshed = await fetch(`${config.url.replace(/\/+$/, '')}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sessionStorage.getItem('poulet-refresh-token') }),
    });
    if (refreshed.ok) {
      const session = await refreshed.json();
      sessionStorage.setItem('poulet-access-token', session.access_token);
      sessionStorage.setItem('poulet-refresh-token', session.refresh_token);
      return supabaseFetch(path, options, false);
    }
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase (${response.status}) : ${message.slice(0, 220)}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function connectSupabase(config, credentials, organizationName) {
  localStorage.setItem('poulet-supabase-config', JSON.stringify(config));
  const response = await fetch(`${config.url.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error(`Connexion refusée : ${(await response.text()).slice(0, 180)}`);
  const session = await response.json();
  sessionStorage.setItem('poulet-access-token', session.access_token);
  sessionStorage.setItem('poulet-refresh-token', session.refresh_token);
  const memberships = await supabaseFetch(`/rest/v1/organization_members?select=organization_id&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
  let organizationId = memberships?.[0]?.organization_id;
  if (!organizationId) {
    const created = await supabaseFetch('/rest/v1/rpc/create_farm', {
      method: 'POST', body: JSON.stringify({ p_name: organizationName || 'Mon exploitation' }),
    });
    organizationId = typeof created === 'string' ? created : created?.id;
  }
  if (!organizationId) throw new Error('Aucune exploitation associée à ce compte. Vérifiez le schéma SQL Supabase.');
  await assignOrganization(organizationId);
}

async function syncData() {
  if (syncInProgress || !navigator.onLine) {
    if (!navigator.onLine) toast('Pas de connexion Internet. Les données restent en attente sur cet appareil.', true);
    return;
  }
  syncInProgress = true;
  $('#sync-button').classList.add('sync-spinning');
  $('#sync-button').disabled = true;
  try {
    let queue = (await readAll('outbox')).sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const event of queue) {
      const table = CLOUD_TABLES[event.entity];
      if (!table) { await removeOutbox(event.id); continue; }
      const record = { ...event.record, organization_id: await readMeta('organization_id') || event.record.organization_id };
      if (!record.organization_id) throw new Error('Associez d’abord cette installation à une exploitation Supabase.');
      await supabaseFetch(`/rest/v1/${table}?on_conflict=id`, {
        method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(record),
      });
      await removeOutbox(event.id);
    }
    const organizationId = await readMeta('organization_id');
    if (organizationId) {
      for (const [store, table] of Object.entries(CLOUD_TABLES)) {
        let offset = 0;
        let page;
        do {
          page = await supabaseFetch(`/rest/v1/${table}?select=*&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1000&offset=${offset}`);
          if (page?.length) {
            await new Promise((resolve, reject) => {
              const transaction = db.transaction(store, 'readwrite');
              const objectStore = transaction.objectStore(store);
              for (const record of page) objectStore.put(record);
              transaction.oncomplete = resolve;
              transaction.onerror = () => reject(transaction.error || new Error(`Téléchargement impossible : ${table}.`));
            });
          }
          offset += page?.length || 0;
        } while (page?.length === 1000);
      }
    }
    toast('Synchronisation terminée.');
  } catch (error) {
    toast(error.message || 'Échec de la synchronisation.', true);
  } finally {
    syncInProgress = false;
    $('#sync-button').classList.remove('sync-spinning');
    await render();
  }
}

async function openSettings() {
  const config = { url: DEFAULT_SUPABASE_URL, ...JSON.parse(localStorage.getItem('poulet-supabase-config') || '{}') };
  const connected = Boolean(sessionStorage.getItem('poulet-access-token'));
  setDialog('Paramètres & synchronisation', 'Le mode local fonctionne sans compte. Connectez Supabase pour synchroniser plusieurs appareils.', `
    <form class="dialog-form" id="settings-form"><div class="form-grid">
      <div class="field full"><label for="farm-name">Nom de l’exploitation</label><input id="farm-name" name="organization_name" maxlength="100" value="Mon exploitation" /></div>
      <div class="field full"><label for="supabase-url">URL du projet Supabase</label><input id="supabase-url" name="url" type="url" value="${esc(config.url || '')}" placeholder="https://votre-projet.supabase.co" /></div>
      <div class="field full"><label for="supabase-key">Clé publique anon / publishable</label><input id="supabase-key" name="anon_key" value="${esc(config.anonKey || '')}" autocomplete="off" placeholder="eyJ…" /></div>
      <div class="field"><label for="supabase-email">E-mail du compte *</label><input id="supabase-email" name="email" type="email" autocomplete="username" required /></div>
      <div class="field"><label for="supabase-password">Mot de passe *</label><input id="supabase-password" name="password" type="password" autocomplete="current-password" required /></div>
      <div class="field full"><span class="field-hint">${connected ? 'Compte Supabase connecté dans cet onglet. Votre mot de passe n’est jamais enregistré.' : 'Projet préconfiguré : Volaillecheztall (avoktrlsmbnisxxvxogc). Renseignez sa clé publique anon/publishable ; ne saisissez jamais une clé service_role.'}</span></div>
    </div><div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Fermer</button>${connected ? '<button class="secondary-button danger-button" type="button" data-action="disconnect">Déconnecter</button>' : ''}<button class="primary-button" type="submit">${connected ? 'Reconnecter le compte' : 'Connecter et synchroniser'}</button></div></form>`);
}

async function handleAction(action) {
  if (action === 'new-band') openBandForm();
  else if (action === 'new-daily') await openDailyForm();
  else if (action === 'new-stock') openStockForm();
  else if (action === 'new-sale') await openSaleForm();
  else if (action === 'new-charge') await openChargeForm();
  else if (action === 'new-client') openClientForm();
  else if (action === 'settings') await openSettings();
  else if (action === 'disconnect') {
    sessionStorage.removeItem('poulet-access-token');
    sessionStorage.removeItem('poulet-refresh-token');
    closeDialog();
    toast('Compte Supabase déconnecté. Les données locales sont conservées.');
  }
}

async function routeEvent(event) {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) {
    await setPage(pageButton.dataset.page, { pushHistory: true, scrollToTop: true });
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) { await handleAction(actionButton.dataset.action); return; }
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

async function main() {
  db = await openDatabase();
  document.querySelectorAll('[data-icon]').forEach((node) => {
    if (ICONS[node.dataset.icon]) node.innerHTML = icon(node.dataset.icon);
  });
  document.addEventListener('click', routeEvent);
  $('#main-nav').addEventListener('keydown', handleTabKeydown);
  $('#dialog-content').addEventListener('submit', (event) => {
    if (event.target.id !== 'settings-form') {
      handleSubmit(event).catch((error) => toast(error.message || 'Échec de l’enregistrement.', true));
      return;
    }
    (async () => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      if (!data.url || !data.anon_key || !data.email || !data.password) {
        toast('Renseignez l’URL, la clé publique, l’e-mail et le mot de passe.', true);
        return;
      }
      try {
        await connectSupabase({ url: data.url, anonKey: data.anon_key }, { email: data.email, password: data.password }, data.organization_name);
        closeDialog();
        toast('Compte connecté. Synchronisation de vos données…');
        await syncData();
      } catch (error) {
        toast(error.message || 'Connexion Supabase impossible.', true);
      }
    })();
  });
  $('#sync-button').addEventListener('click', syncData);
  $('#settings-button').addEventListener('click', () => handleAction('settings'));
  $('#app-dialog').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  });
  $('#app-dialog').addEventListener('click', (event) => {
    if (event.target === $('#app-dialog')) closeDialog();
  });
  window.addEventListener('online', () => render().catch((error) => toast(error.message, true)));
  window.addEventListener('offline', () => render().catch((error) => toast(error.message, true)));
  const navigateFromHistory = () => {
    const page = location.hash.slice(1) || 'dashboard';
    setPage(page, { scrollToTop: true })
      .catch((error) => toast(error.message || 'Impossible de restaurer cette section.', true));
  };
  window.addEventListener('popstate', navigateFromHistory);
  window.addEventListener('hashchange', navigateFromHistory);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker non enregistré :', error));
  }
  const initialPage = PAGE_LABELS[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  if (!location.hash) history.replaceState({ page: initialPage }, '', `#${initialPage}`);
  await setPage(initialPage);
}

main().catch((error) => {
  console.error(error);
  $('#page-container').innerHTML = emptyState('Impossible de démarrer l’application', error.message || 'Le stockage local est indisponible.');
});
