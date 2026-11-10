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
  feed: '<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v9l8 4 8-4V8M12 12v9"/>',
  water: '<path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z"/><path d="M9 16a3 3 0 0 0 3 2"/>',
  money: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/>',
  box: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
};
const PAGE_LABELS = { dashboard: 'Vue d’ensemble', bands: 'Bandes', daily: 'Suivi quotidien', sales: 'Ventes', expenses: 'Charges', annual: 'Statistiques annuelles' };
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

async function preloadLogo() {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = './icons/volaille-chez-tall-logo.png';
    });
    const scale = Math.min(1, 90 / (img.width || 90));
    const w = Math.max(1, Math.round((img.width || 90) * scale));
    const h = Math.max(1, Math.round((img.height || 90) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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

async function deleteRecord(storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Suppression impossible.'));
  });
}

async function deleteLogsForBand(bandId) {
  const logs = (await readAll('daily_logs')).filter((log) => log.batch_id === bandId);
  if (!logs.length) return;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('daily_logs', 'readwrite');
    const store = transaction.objectStore('daily_logs');
    for (const log of logs) store.delete(log.id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Suppression de l’historique impossible.'));
  });
}

async function saveRecords(entries) {
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

async function saveRecord(storeName, record) {
  const [saved] = await saveRecords([{ store: storeName, record }]);
  return saved;
}

async function getSnapshot() {
  const [bands, logs, items, movements, sales, charges, clients] = await Promise.all([
    readAll('bands'), readAll('daily_logs'), readAll('inventory_items'), readAll('inventory_movements'),
    readAll('sales'), readAll('charges'), readAll('clients'),
  ]);
  return { bands, logs, items, movements, sales, charges, clients };
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
  const mortalities = sum(snapshot.logs, (log) => log.mortality);
  const initial = sum(snapshot.bands, (band) => band.initial_count);
  const mortalityRate = initial ? (mortalities / initial) * 100 : 0;
  const revenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const totalCosts = sum(snapshot.bands, (band) => bandCost(band, snapshot))
    + sum(snapshot.charges.filter((charge) => !charge.batch_id), (charge) => charge.amount);
  const profit = revenue - totalCosts;
  return `<div class="page-heading"><div><h1>Bonjour, bienvenue</h1><p>Voici le résumé de votre exploitation avicole.</p></div></div>
    <section class="metrics-grid" aria-label="Indicateurs clés">
      ${metricCard('Sujets en élevage', number(live), `${active.length} bande${active.length > 1 ? 's' : ''} active${active.length > 1 ? 's' : ''}`, 'bird')}
      ${metricCard('Mortalité cumulée', `${number(mortalityRate, 1)} <small>%</small>`, `${number(mortalities)} sujet${mortalities > 1 ? 's' : ''} enregistré${mortalities > 1 ? 's' : ''}`, 'daily', mortalityRate > 5 ? 'low-stock' : '')}
      ${metricCard('Chiffre d’affaires', currency(revenue), `Marge estimée : ${currency(profit)}`, 'money', profit >= 0 ? 'positive' : 'low-stock')}
    </section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Par bande</h2><p>Sujets en élevage, mortalité cumulée, chiffre d’affaires, dépenses et bénéfice par bande.</p></div></div>
      ${snapshot.bands.length ? `<div class="table-wrap"><table><thead><tr><th>Bande</th><th>Sujets en élevage</th><th>Mortalité cumulée</th><th>Chiffre d’affaires</th><th>Dépenses</th><th>Bénéfice</th></tr></thead><tbody>${snapshot.bands.map((band) => {
        const birds = activeBirds(band, snapshot);
        const deaths = sum(snapshot.logs.filter((log) => log.batch_id === band.id), (log) => log.mortality);
        const bandRevenue = sum(snapshot.sales.filter((sale) => sale.batch_id === band.id), (sale) => sale.total_amount);
        const costs = bandCost(band, snapshot);
        const bandProfit = bandRevenue - costs;
        return `<tr><td class="primary-cell">${esc(band.name)}</td><td>${number(birds)}</td><td>${number(deaths)}</td><td>${currency(bandRevenue)}</td><td>${currency(costs)}</td><td class="${bandProfit >= 0 ? 'positive' : 'low-stock'}">${currency(bandProfit)}</td></tr>`;
      }).join('')}</tbody></table></div>` : emptyState('Aucune bande pour le moment', 'Créez votre premier lot pour commencer le suivi.', '<button class="primary-button" data-action="new-band">Créer une bande</button>')}</section>`;
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
    return `<tr data-band-detail="${esc(band.id)}" style="cursor:pointer"><td class="primary-cell">${esc(band.name)}<span class="secondary-cell">${esc(band.strain || 'Souche non précisée')} · ${esc(band.supplier || 'Fournisseur non précisé')}</span></td>
      <td>${dateLabel(band.arrival_date)}</td><td>J${days} / ${Number(band.target_age_days || 42)} j</td><td>${dateLabel(`${forecast.getFullYear()}-${String(forecast.getMonth() + 1).padStart(2, '0')}-${String(forecast.getDate()).padStart(2, '0')}`)}</td>
      <td>${number(birds)}</td><td>${number(percent, 1)} %</td><td>${weightText}</td><td>${currency(unitCost)}</td>
      <td>${currency(bandCost(band, snapshot))}</td><td><span class="status-pill ${band.status === 'closed' ? 'neutral' : ''}">${band.status === 'closed' ? 'Clôturée' : 'En cours'}</span></td>
      <td class="actions-cell">
        <button class="icon-button" type="button" data-action="edit-band" data-band-id="${esc(band.id)}" title="Modifier">✎</button>
        <button class="icon-button" type="button" data-action="delete-band-history" data-band-id="${esc(band.id)}" title="Supprimer l'historique">↺</button>
        <button class="icon-button danger-button" type="button" data-action="delete-band" data-band-id="${esc(band.id)}" title="Supprimer">✕</button>
      </td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Bandes de production</h1><p>Suivez vos lots de poulets de chair du démarrage à la vente.</p></div><button class="primary-button" data-action="new-band"><span class="plus">+</span> Nouvelle bande</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Tous les lots</h2><p>${snapshot.bands.length} bande${snapshot.bands.length > 1 ? 's' : ''} enregistrée${snapshot.bands.length > 1 ? 's' : ''}</p></div></div>
      ${rows ? `<div class="table-wrap"><table><thead><tr><th>Bande / souche</th><th>Arrivée</th><th>Âge</th><th>Vente cible estimée</th><th>En élevage</th><th>Mortalité</th><th>Poids réel / cible</th><th>Coût / sujet sorti</th><th>Coût cumulé</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Pas encore de bande', 'Ajoutez un lot pour calculer son coût de revient et suivre ses performances.', '<button class="primary-button" data-action="new-band">Créer la première bande</button>')}</section>`;
}

function renderDaily(snapshot) {
  const rows = [...snapshot.logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).map((log) => {
    const band = snapshot.bands.find((item) => item.id === log.batch_id);
    return `<tr><td>${dateLabel(log.log_date)}</td><td class="primary-cell">${esc(band?.name || 'Bande supprimée')}</td><td>${number(log.mortality)}</td><td>${number(log.culls)}</td><td>${esc(log.note || '—')}</td></tr>`;
  }).join('');
  return `<div class="page-heading"><div><h1>Suivi quotidien</h1><p>Consignez les mortalités et observations au poulailler.</p></div><button class="primary-button" data-action="new-daily"><span class="plus">+</span> Saisie du jour</button></div>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des relevés</h2><p>${snapshot.logs.length} relevé${snapshot.logs.length > 1 ? 's' : ''}</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Bande</th><th>Mortalité</th><th>Tri / réformes</th><th>Note / observation</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucun relevé quotidien', 'Les mortalités et observations se saisissent ici.', '<button class="primary-button" data-action="new-daily">Ajouter un relevé</button>')}</section>`;
}


function renderSales(snapshot) {
  const rows = [...snapshot.sales].sort((a, b) => b.sale_date.localeCompare(a.sale_date)).map((sale) => {
    const band = snapshot.bands.find((item) => item.id === sale.batch_id);
    const due = Number(sale.total_amount) - Number(sale.paid_amount);
    return `<tr><td>${dateLabel(sale.sale_date)}</td><td class="primary-cell">${esc(sale.client_name || 'Vente comptoir')}</td><td>${esc(band?.name || '—')}</td><td>${number(sale.heads)}</td><td>${number(sale.total_weight_kg, 1)} kg</td><td>${currency(sale.total_amount)}</td><td>${currency(due)}</td><td>${esc(PAYMENT_LABELS[sale.payment_method] || sale.payment_method)}</td><td><span class="status-pill ${due > 0 ? 'warning' : ''}">${due > 0 ? 'À encaisser' : 'Payée'}</span></td><td><button class="primary-button" type="button" data-action="download-receipt" data-sale-id="${esc(sale.id)}" data-client-name="${esc(sale.client_name || 'Vente comptoir')}" data-client-phone="${esc(sale.client_phone || '')}" data-client-address="${esc(sale.client_address || '')}" data-band-name="${esc(band?.name || '—')}" data-sale-date="${esc(sale.sale_date)}" data-heads="${esc(sale.heads)}" data-total-weight="${esc(sale.total_weight_kg)}" data-price="${esc(sale.price_per_kg)}" data-total="${esc(sale.total_amount)}" data-paid="${esc(sale.paid_amount)}">Télécharger le reçu</button></td></tr>`;
  }).join('');
  const revenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const unpaid = sum(snapshot.sales, (sale) => Number(sale.total_amount) - Number(sale.paid_amount));
  return `<div class="page-heading"><div><h1>Ventes & commandes</h1><p>Associez chaque vente à son lot et suivez les règlements clients.</p></div><button class="primary-button" data-action="new-sale"><span class="plus">+</span> Nouvelle vente</button></div>
    <section class="metrics-grid">${metricCard('Ventes enregistrées', number(snapshot.sales.length), 'Toutes périodes', 'sales')}${metricCard('Chiffre d’affaires', currency(revenue), 'Montant total vendu', 'money')}<article class="metric-card" data-action="show-credits" style="cursor:pointer"><div class="metric-top"><span>Crédits clients</span><span class="metric-icon">${icon('daily')}</span></div><div class="metric-value">${currency(unpaid)}</div><div class="metric-note">Reste à encaisser — cliquer pour justifier</div></article>${metricCard('Sujets vendus', number(sum(snapshot.sales, (sale) => sale.heads)), 'Poulets de chair', 'bird')}</section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Historique des ventes</h2><p>Vente en gros, au détail ou sur commande.</p></div></div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Bande source</th><th>Sujets</th><th>Poids total</th><th>Montant</th><th>Solde</th><th>Mode de paiement</th><th>État</th><th>Reçu</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('Aucune vente enregistrée', 'Enregistrez une vente pour suivre les recettes et les sujets disponibles.', '<button class="primary-button" data-action="new-sale">Créer une vente</button>')}</section>`;
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


function renderAnnualStats(snapshot) {
  const years = [...new Set([
    ...snapshot.bands.map((band) => (band.arrival_date || '').slice(0, 4)),
    ...snapshot.sales.map((sale) => (sale.sale_date || '').slice(0, 4)),
    ...snapshot.charges.map((charge) => (charge.charge_date || '').slice(0, 4)),
  ].filter(Boolean))].sort().reverse();
  if (!years.length) years.push(String(new Date().getFullYear()));
  const rows = years.map((year) => {
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
    return `<tr><td class="primary-cell">${esc(year)}</td><td>${number(bands.length)}</td><td>${number(initial)}</td><td>${number(deaths)}</td><td>${number(sold)}</td><td>${currency(revenue)}</td><td>${currency(costs)}</td><td class="${profit >= 0 ? 'positive' : 'low-stock'}">${currency(profit)}</td></tr>`;
  }).join('');
  const totalRevenue = sum(snapshot.sales, (sale) => sale.total_amount);
  const totalCosts = sum(snapshot.bands, (band) => bandCost(band, snapshot)) + sum(snapshot.charges.filter((c) => !c.batch_id), (c) => c.amount);
  return `<div class="page-heading"><div><h1>Statistiques annuelles</h1><p>Bilan par année de votre exploitation.</p></div></div>
    <section class="metrics-grid">
      ${metricCard('Chiffre d’affaires total', currency(totalRevenue), 'Toutes années', 'money')}
      ${metricCard('Dépenses totales', currency(totalCosts), 'Toutes années', 'expenses')}
      ${metricCard('Bénéfice total', currency(totalRevenue - totalCosts), 'Toutes années', 'money', (totalRevenue - totalCosts) >= 0 ? 'positive' : 'low-stock')}
      ${metricCard('Bandes créées', number(snapshot.bands.length), 'Toutes années', 'bands')}
    </section>
    <section class="panel table-panel"><div class="panel-header"><div><h2>Bilan par année</h2><p>Recettes, dépenses et résultats.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Année</th><th>Bandes</th><th>Sujets mis en place</th><th>Mortalité</th><th>Sujets vendus</th><th>Chiffre d’affaires</th><th>Dépenses</th><th>Bénéfice</th></tr></thead><tbody>${rows}</tbody></table></div>
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

function escapePdfText(value) {
  return normalizeAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildReceiptPdf(sale, band) {
  const total = Number(sale.total_amount) || 0;
  const paid = Number(sale.paid_amount) || 0;
  const due = total - paid;
  const lines = [];
  lines.push('RECU DE VENTE - VOLAILLE CHEZ TALL');
  lines.push('');
  lines.push(`Date : ${dateLabel(sale.sale_date)}`);
  lines.push(`Client : ${sale.client_name || 'Vente comptoir'}`);
  lines.push(`Telephone : ${sale.client_phone || '-'}`);
  lines.push(`Adresse : ${sale.client_address || '-'}`);
  lines.push(`Bande source : ${band?.name || '-'}`);
  lines.push(`Nombre de sujets : ${number(sale.heads)}`);
  lines.push(`Poids total : ${number(sale.total_weight_kg, 1)} kg`);
  lines.push(`Prix par kg : ${currency(sale.price_per_kg)}`);
  lines.push('');
  if (due > 0) {
    lines.push(`Montant paye : ${currency(paid)}`);
    lines.push(`Reste a payer (reliquat) : ${currency(due)}`);
    lines.push(`Montant global : ${currency(total)}`);
  } else {
    lines.push(`Montant global regle : ${currency(total)}`);
  }
  lines.push('');
  lines.push('Merci pour votre achat.');

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

  let pageObj = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >>';
  if (logoJpeg) pageObj += ' /XObject << /Im1 6 0 R >>';
  pageObj += ' >> >>\nendobj\n';
  objOffsets[3] = mark(); add(pageObj);

  const contentParts = [];
  let y = 700;
  if (logoJpeg) {
    const w = logoJpeg.width;
    const h = logoJpeg.height;
    contentParts.push('q');
    contentParts.push(`${w} 0 0 ${h} 50 ${y - h} cm`);
    contentParts.push('/Im1 Do');
    contentParts.push('Q');
    y -= (h + 12);
  }
  contentParts.push('BT');
  contentParts.push('/F1 14 Tf');
  for (const line of lines) {
    contentParts.push(`1 0 0 1 50 ${y} Tm`);
    contentParts.push(`(${escapePdfText(line)}) Tj`);
    y -= 18;
  }
  contentParts.push('ET');
  const stream = contentParts.join('\n');
  const streamBytes = strToBytes(stream);
  objOffsets[4] = mark();
  add(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  add(streamBytes);
  add('\nendstream\nendobj\n');

  objOffsets[5] = mark(); add('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const numObjs = logoJpeg ? 6 : 5;
  if (logoJpeg) {
    objOffsets[6] = mark();
    add(`6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logoJpeg.width} /Height ${logoJpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoJpeg.data.length} >>\nstream\n`);
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

function generateReceipt(sale, band) {
  const bytes = buildReceiptPdf(sale, band);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = normalizeAscii(sale.client_name || 'vente').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `recu-${safeName}-${sale.sale_date || 'vente'}.pdf`;
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
      total_amount: Number(btn.dataset.total) || 0,
      paid_amount: Number(btn.dataset.paid) || 0,
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
  const body = `
    <div class="dialog-form">
      <h3>${esc(band.name)}</h3>
      <p>${esc(band.strain || 'Souche non précisée')} · ${esc(band.supplier || 'Fournisseur non précisé')}</p>
      <div class="metrics-grid" style="margin:12px 0">
        ${metricCard('Sujets en élevage', number(birds), `Initial : ${number(band.initial_count)}`, 'bird')}
        ${metricCard('Mortalité cumulée', number(deaths), `${band.initial_count ? number((deaths / band.initial_count) * 100, 1) : 0} %`, 'daily')}
        ${metricCard('Chiffre d’affaires', currency(revenue), `${sales.length} vente(s)`, 'money')}
        ${metricCard('Dépenses', currency(costs), 'Coût cumulé du lot', 'expenses')}
        ${metricCard('Bénéfice', currency(revenue - costs), 'Après vente', 'money')}
      </div>
      <h3>Relevés (${logs.length})</h3>
      ${logs.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Mortalité</th><th>Tri</th><th>Note</th></tr></thead><tbody>${logs.map((log) => `<tr><td>${dateLabel(log.log_date)}</td><td>${number(log.mortality)}</td><td>${number(log.culls)}</td><td>${esc(log.note || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p>Aucun relevé.</p>'}
      <h3>Ventes (${sales.length})</h3>
      ${sales.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Sujets</th><th>Montant</th></tr></thead><tbody>${sales.map((sale) => `<tr><td>${dateLabel(sale.sale_date)}</td><td>${esc(sale.client_name || 'Vente comptoir')}</td><td>${number(sale.heads)}</td><td>${currency(sale.total_amount)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Aucune vente.</p>'}
      <h3>Charges (${charges.length})</h3>
      ${charges.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Libellé</th><th>Montant</th></tr></thead><tbody>${charges.map((charge) => `<tr><td>${dateLabel(charge.charge_date)}</td><td>${esc(charge.description)}</td><td>${currency(charge.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Aucune charge.</p>'}
      <div class="dialog-actions"><button class="secondary-button" type="button" data-close-dialog>Fermer</button></div>
    </div>`;
  setDialog(`Détail — ${band.name}`, 'Toutes les informations de la bande.', body);
}


async function render() {
  const snapshot = await getSnapshot();
  window.snapshot = snapshot;
  const renderers = { dashboard: renderDashboard, bands: renderBands, daily: renderDaily, sales: renderSales, expenses: renderExpenses, annual: renderAnnualStats };
  $('#page-container').innerHTML = renderers[currentPage](snapshot);
  $('#page-container').setAttribute('aria-labelledby', `tab-${currentPage}`);
  $('#page-title').textContent = PAGE_LABELS[currentPage];
  $('#band-count').textContent = snapshot.bands.length;
  $('#today-label').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  $('#connection-label').textContent = navigator.onLine ? 'Mode hors ligne prêt' : 'Connexion indisponible';
  $('.offline-dot').classList.toggle('offline', !navigator.onLine);
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
  const bands = snapshot.bands.filter((band) => band.status !== 'closed');
  if (!bands.length) { toast('Créez d’abord une bande avant de saisir un relevé.', true); return; }
  setDialog('Saisie quotidienne', 'Les données sont enregistrées sur cet appareil, même sans réseau.', `
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
  const bands = snapshot.bands.filter((band) => band.status !== 'closed' && activeBirds(band, snapshot) > 0);
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
    await saveRecord('sales', {
      ...base, ...values, client_id: values.client_id || null,
      total_weight_kg: totalWeight, total_amount: totalAmount, payment_status: values.paid_amount >= totalAmount ? 'paid' : 'partial',
    });
  } else if (formId === 'charge-form') {
    await saveRecord('charges', { ...base, ...values, batch_id: values.batch_id || null });
  }
  closeDialog();
  await render();
  toast('Enregistré sur cet appareil.');
}

async function handleAction(action, button = null) {
  if (action === 'new-band') openBandForm();
  else if (action === 'edit-band') { if (button?.dataset?.bandId) await openBandForm(button.dataset.bandId); }
  else if (action === 'delete-band') {
    const id = button?.dataset?.bandId;
    if (id && confirm('Supprimer cette bande ?')) {
      await deleteRecord('bands', id);
      toast('Bande supprimée.');
      await render();
    }
  }
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
  else if (action === 'record-credit-payment') { if (button?.dataset?.saleId) await recordCreditPayment(button.dataset.saleId, button); }
  else if (action === 'new-daily') await openDailyForm();
  else if (action === 'new-sale') await openSaleForm();
  else if (action === 'new-charge') await openChargeForm();
  else if (action === 'settings') toast('Paramètres locaux uniquement.');
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

async function main() {
  db = await openDatabase();
  await preloadLogo();
  document.querySelectorAll('[data-icon]').forEach((node) => {
    if (ICONS[node.dataset.icon]) node.innerHTML = icon(node.dataset.icon);
  });
  document.addEventListener('click', routeEvent);
  $('#main-nav').addEventListener('keydown', handleTabKeydown);
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
