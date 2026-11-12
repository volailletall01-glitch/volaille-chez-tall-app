(() => {
  const config = window.SUPABASE_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const MIN_PRICE = Number(config.minPrice) || 2500;
  const MAX_PRICE = Number(config.maxPrice) || 25000;
  const REFRESH_MS = 20000;
  const ORDER_KEY = 'poulet-suivi-commande';
  const state = { stock: null, busy: false, timer: null, thanks: false, order: null };
  const GENDER_LABELS = { M: 'Homme', F: 'Femme' };
  const genderLabel = (value) => GENDER_LABELS[String(value || '').toUpperCase()] || '';

  const money = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)} FCFA`;
  const amount = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
  const configured = Boolean(config.url && config.anonKey && !/VOTRE|COLLEZ|COLLEZ_ICI/i.test(config.anonKey));

  function whatsappDigits(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length === 8) digits = `223${digits}`;
    return digits;
  }

  async function request(path, options = {}) {
    const headers = {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const response = await fetch(`${config.url}${path}`, { ...options, headers });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!response.ok) {
      const message = (data && (data.message || data.error_description || data.details)) || `Erreur ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setCardVisibility({ form, soldout, unavailable }) {
    $('#form-card').hidden = !form;
    $('#soldout-card').hidden = !soldout;
    $('#unavailable-card').hidden = !unavailable;
  }

  function saveOrder() {
    try {
      if (state.order) localStorage.setItem(ORDER_KEY, JSON.stringify(state.order));
      else localStorage.removeItem(ORDER_KEY);
    } catch {
      /* stockage local indisponible : le suivi reste affiché pour la visite en cours */
    }
  }

  function readOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null');
      if (!saved || !saved.id) return null;
      const done = saved.status === 'validee' || saved.status === 'refusee';
      const age = Date.now() - new Date(saved.created_at || 0).getTime();
      if (done && age > 7 * 24 * 3600 * 1000) {
        localStorage.removeItem(ORDER_KEY);
        return null;
      }
      return saved;
    } catch {
      return null;
    }
  }

  function recapLine(order) {
    const parts = [];
    if (order.client_name) parts.push(`${order.client_name}${order.client_gender ? ` (${order.client_gender})` : ''}`);
    if (order.band_name) parts.push(`bande ${order.band_name}`);
    if (order.quantity) parts.push(`${amount(order.quantity)} poulet${Number(order.quantity) > 1 ? 's' : ''}`);
    if (order.price_per_head) parts.push(`${money(order.price_per_head)} par tête`);
    if (order.neighborhood) parts.push(`livraison à ${order.neighborhood}`);
    if (order.created_at) {
      parts.push(`commande du ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(order.created_at))}`);
    }
    return parts.join(' · ');
  }

  function renderTrack({ highlight = false } = {}) {
    const card = $('#track-card');
    if (!card) return;
    const order = state.order;
    if (!order) { card.hidden = true; return; }
    const status = order.status === 'validee' ? 'validee' : order.status === 'refusee' ? 'refusee' : 'en_attente';
    const first = String(order.client_name || '').trim().split(/\s+/)[0];
    card.hidden = false;
    card.dataset.state = status;
    if (status === 'validee') {
      $('#track-badge').textContent = 'Commande confirmée';
      $('#track-title').textContent = first ? `Merci infiniment, ${first} !` : 'Merci infiniment !';
      $('#track-text').textContent = `Votre commande est confirmée. Merci de votre confiance : nous vous contactons très vite pour organiser la livraison${order.neighborhood ? ` à ${order.neighborhood}` : ''}.`;
    } else if (status === 'refusee') {
      $('#track-badge').textContent = 'Commande non retenue';
      $('#track-title').textContent = 'Nous sommes désolés';
      $('#track-text').textContent = 'Votre commande n’a pas pu être acceptée : le stock disponible ne nous permettait pas de la satisfaire. Merci de votre compréhension et à très bientôt.';
    } else {
      $('#track-badge').textContent = 'Suivi de commande';
      $('#track-title').textContent = 'Commande en traitement';
      $('#track-text').textContent = 'Veuillez patienter ou revenir plus tard pour vérifier l’état de votre commande.';
    }
    $('#track-recap').textContent = recapLine(order);
    if (highlight) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function refreshOrder() {
    const order = state.order;
    if (!order || !order.id || order.status === 'validee') return;
    try {
      const rows = await request(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}&select=id,status,handled_at`);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row || row.status === order.status) return;
      state.order = { ...order, status: row.status, handled_at: row.handled_at };
      saveOrder();
      renderTrack({ highlight: true });
    } catch (error) {
      console.error('Suivi de commande indisponible', error);
    }
  }

  function sellingConfig() {
    const stock = state.stock;
    const heads = stock ? Math.max(0, Math.floor(Number(stock.stock_heads) || 0)) : 0;
    const rawMin = stock && Number(stock.min_price) ? Number(stock.min_price) : MIN_PRICE;
    const rawMax = stock && Number(stock.max_price) ? Number(stock.max_price) : MAX_PRICE;
    const min = Math.min(rawMin, rawMax);
    const max = Math.max(rawMin, rawMax);
    return {
      stock,
      heads,
      min,
      max,
      fixed: min === max,
      bandId: stock?.band_id || null,
      bandName: stock?.band_name || '',
    };
  }

  function applyPriceMode({ fixed, min, max }) {
    const input = $('#order-price');
    const label = $('#price-label');
    const fixedNode = $('#order-fixed-price');
    const hint = $('#price-hint');
    const intro = $('#form-intro');
    if (fixed) {
      input.value = String(min);
      input.hidden = true;
      input.required = false;
      fixedNode.hidden = false;
      fixedNode.textContent = money(min);
      label.textContent = 'Prix unitaire (fixé par l’éleveur)';
      hint.textContent = 'Ce prix est fixe : il n’est pas modifiable.';
      intro.textContent = 'Tous les champs sont obligatoires. Le prix unitaire est fixé par l’éleveur.';
    } else {
      input.hidden = false;
      input.required = true;
      input.min = String(min);
      input.max = String(max);
      input.placeholder = `Entre ${amount(min)} et ${amount(max)}`;
      const current = Number(input.value);
      if (!current || current < min || current > max) input.value = '';
      fixedNode.hidden = true;
      label.textContent = 'Prix par tête proposé (FCFA) *';
      hint.textContent = `Choisissez votre prix entre ${amount(min)} FCFA et ${amount(max)} FCFA.`;
      intro.textContent = 'Tous les champs sont obligatoires. Le prix proposé doit rester dans la fourchette affichée.';
    }
  }

  function renderStock() {
    const { stock, heads, min, max, fixed, bandName } = sellingConfig();
    const priceText = fixed
      ? `Prix unitaire : ${money(min)}`
      : `Choisissez votre prix entre ${money(min)} et ${money(max)}`;

    const bandNode = $('#band-name');
    if (bandNode) {
      bandNode.hidden = !bandName;
      bandNode.textContent = bandName ? `Bande : ${bandName}` : '';
    }

    if (!configured) {
      $('#stock-state').textContent = 'Indisponible';
      $('#stock-value').textContent = '—';
      $('#stock-note').textContent = 'Le service de commande n’est pas encore activé.';
      $('#price-range').textContent = `Prix par tête : entre ${amount(min)} F et ${amount(max)} F`;
      setCardVisibility({ form: false, soldout: false, unavailable: true });
      return;
    }

    if (!stock) {
      $('#stock-state').textContent = 'Indisponible';
      $('#stock-value').textContent = '—';
      $('#stock-note').textContent = 'Impossible de lire le stock pour le moment.';
      return;
    }

    $('#price-range').textContent = priceText;
    $('#price-range').dataset.mode = fixed ? 'fixed' : 'range';
    $('#stock-value').textContent = `${amount(heads)} poulet${heads > 1 ? 's' : ''}`;
    $('#stock-state').textContent = heads > 0 ? 'Disponible' : 'Épuisé';
    $('#stock-state').className = `status-pill ${heads > 0 ? '' : 'warning'}`;
    $('#stock-note').textContent = heads > 0
      ? `Quantité totale de poulets disponibles aujourd’hui : ${amount(heads)}.`
      : 'Désolé, le stock est actuellement épuisé.';
    $('#stock-updated').textContent = stock.updated_at
      ? `Mis à jour le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(stock.updated_at))}`
      : '';

    applyPriceMode({ fixed, min, max });

    const quantity = $('#order-quantity');
    quantity.max = String(Math.max(1, heads));
    quantity.placeholder = heads > 0 ? `1 à ${amount(heads)}` : 'Nombre de poulets';
    $('#quantity-hint').textContent = heads > 0
      ? `${amount(heads)} poulet${heads > 1 ? 's' : ''} disponible${heads > 1 ? 's' : ''} · maximum ${amount(heads)} par commande.`
      : '';

    if (state.thanks) { updateTotal(); return; }

    if (heads > 0) {
      setCardVisibility({ form: true, soldout: false, unavailable: false });
    } else {
      setCardVisibility({ form: false, soldout: true, unavailable: false });
      $('#soldout-message').textContent = 'Désolé, le stock est actuellement épuisé.';
    }
    updateTotal();
  }

  async function loadStock({ silent = false } = {}) {
    if (!configured) { renderStock(); return; }
    try {
      const rows = await request('/rest/v1/app_config?id=eq.1&select=*');
      state.stock = Array.isArray(rows) && rows.length ? rows[0] : null;
      renderStock();
    } catch (error) {
      if (!silent) {
        $('#stock-state').textContent = 'Indisponible';
        $('#stock-note').textContent = 'Connexion impossible. Vérifiez votre réseau puis actualisez la page.';
      }
      console.error('Stock indisponible', error);
    }
  }

  function setHint(message, error = false) {
    const hint = $('#form-hint');
    hint.textContent = message || '';
    hint.classList.toggle('error', error);
  }

  function updateTotal() {
    const quantity = Number($('#order-quantity').value) || 0;
    const price = Number($('#order-price').value) || 0;
    $('#order-total').textContent = money(quantity * price);
  }

  function clampQuantity() {
    const { heads } = sellingConfig();
    const input = $('#order-quantity');
    const value = Math.round(Number(input.value) || 0);
    if (!value) return;
    if (value < 1) input.value = '1';
    else if (heads > 0 && value > heads) input.value = String(heads);
    updateTotal();
  }

  function clampPrice() {
    const { min, max, fixed } = sellingConfig();
    if (fixed) return;
    const input = $('#order-price');
    const value = Math.round(Number(input.value) || 0);
    if (!value) return;
    if (value < min) input.value = String(min);
    else if (value > max) input.value = String(max);
    updateTotal();
  }

  function syncGenderChoice() {
    document.querySelectorAll('.gender-option').forEach((label) => {
      const input = label.querySelector('input[name="client_gender"]');
      label.classList.toggle('is-selected', Boolean(input && input.checked));
    });
  }

  function validate(values) {
    const { min, max, heads } = sellingConfig();
    if (!values.client_name || values.client_name.trim().length < 2) return 'Indiquez votre nom et prénom.';
    if (!GENDER_LABELS[values.client_gender]) return 'Indiquez si vous êtes un homme ou une femme.';
    if (!values.client_phone || values.client_phone.replace(/\D/g, '').length < 6) return 'Indiquez un numéro de téléphone valide.';
    if (!values.neighborhood || values.neighborhood.trim().length < 2) return 'Indiquez votre quartier de livraison.';
    if (!Number.isInteger(values.quantity) || values.quantity < 1) return 'Indiquez une quantité entière supérieure à zéro.';
    if (heads > 0 && values.quantity > heads) return `Il ne reste que ${amount(heads)} poulet${heads > 1 ? 's' : ''} disponible${heads > 1 ? 's' : ''}.`;
    if (!Number.isFinite(values.price_per_head) || values.price_per_head < min || values.price_per_head > max) {
      return min === max
        ? `Le prix unitaire est fixé à ${amount(min)} FCFA.`
        : `Le prix par tête doit être compris entre ${amount(min)} FCFA et ${amount(max)} FCFA.`;
    }
    return '';
  }

  function showManagerAlert(values, total) {
    const link = $('#thanks-whatsapp');
    if (!link) return;
    const manager = whatsappDigits(state.stock?.manager_whatsapp);
    if (!manager) {
      link.hidden = true;
      link.removeAttribute('href');
      return;
    }
    const when = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    const message = [
      'Bonjour, nouvelle commande Volaille chez TALL :',
      `Client : ${values.client_name}`,
      values.client_gender ? `Sexe : ${genderLabel(values.client_gender)} (${values.client_gender})` : null,
      `Téléphone : ${values.client_phone}`,
      `Quartier : ${values.neighborhood}`,
      `Quantité : ${amount(values.quantity)} poulet${values.quantity > 1 ? 's' : ''}`,
      values.band_name ? `Bande : ${values.band_name}` : null,
      `Prix proposé : ${money(values.price_per_head)} par tête`,
      `Total estimé : ${money(total)}`,
      `Reçue le ${when}`,
    ].filter(Boolean).join('\n');
    link.href = `https://wa.me/${manager}?text=${encodeURIComponent(message)}`;
    link.hidden = false;
    window.setTimeout(() => {
      if (link.hidden || !link.href) return;
      try { link.click(); } catch { /* le bouton reste disponible */ }
    }, 700);
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (state.busy) return;
    const form = $('#order-form');
    const values = {
      client_name: form.client_name.value.trim(),
      client_gender: String(form.client_gender?.value || '').toUpperCase(),
      client_phone: form.client_phone.value.trim(),
      neighborhood: form.neighborhood.value.trim(),
      quantity: Math.round(Number(form.quantity.value) || 0),
      price_per_head: Math.round(Number(form.price_per_head.value) || 0),
    };
    const problem = validate(values);
    if (problem) { setHint(problem, true); return; }

    state.busy = true;
    const submit = $('#order-submit');
    submit.disabled = true;
    submit.textContent = 'Envoi en cours…';
    setHint('');
    try {
      // Vérifie le stock et le prix en temps réel avant d'enregistrer la commande.
      try {
        const fresh = await request('/rest/v1/app_config?id=eq.1&select=*');
        if (Array.isArray(fresh) && fresh.length) state.stock = fresh[0];
      } catch {
        /* on garde la dernière configuration connue */
      }
      const freshProblem = validate(values);
      if (freshProblem) {
        renderStock();
        setHint(freshProblem, true);
        return;
      }
      const { bandId, bandName } = sellingConfig();
      values.band_id = bandId;
      values.band_name = bandName || null;
      const rows = await request('/rest/v1/orders', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(values),
      });
      const created = Array.isArray(rows) ? rows[0] : null;
      const total = values.quantity * values.price_per_head;
      form.reset();
      updateTotal();
      syncGenderChoice();
      $('#thanks-title').textContent = `Merci infiniment, ${values.client_name.split(' ')[0]} !`;
      $('#thanks-message').textContent = 'Votre commande a bien été reçue. Nous vous contactons très vite pour confirmer la livraison.';
      $('#thanks-recap').textContent = `${values.client_name} (${values.client_gender}) · ${values.band_name ? `bande ${values.band_name} · ` : ''}${amount(values.quantity)} poulet${values.quantity > 1 ? 's' : ''} · ${money(values.price_per_head)} par tête · total estimé ${money(total)} · livraison à ${values.neighborhood} · ${values.client_phone}`;
      state.thanks = true;
      state.order = {
        ...values,
        id: created?.id || null,
        status: created?.status || 'en_attente',
        created_at: created?.created_at || new Date().toISOString(),
      };
      saveOrder();
      $('#form-card').hidden = true;
      $('#thanks-card').hidden = false;
      $('#thanks-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      renderTrack();
      setHint('');
      showManagerAlert(values, total);
      loadStock({ silent: true });
    } catch (error) {
      setHint(error.message || 'Envoi impossible. Vérifiez votre connexion puis réessayez.', true);
    } finally {
      state.busy = false;
      submit.disabled = false;
      submit.textContent = 'Envoyer ma commande';
    }
  }

  function startRefresh() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (!state.busy) loadStock({ silent: true });
      refreshOrder();
    }, REFRESH_MS);
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
    try { dismissed = localStorage.getItem(IOS_INSTALL_KEY) === '1'; } catch { /* stockage purgé */ }
    if (dismissed) return;
    banner.hidden = false;
    banner.querySelector('[data-dismiss-ios-install]')?.addEventListener('click', () => {
      banner.hidden = true;
      try { localStorage.setItem(IOS_INSTALL_KEY, '1'); } catch { /* stockage purgé */ }
    });
  }

  function init() {
    if (!configured) {
      renderStock();
      return;
    }
    $('#order-form').addEventListener('submit', submitOrder);
    document.querySelectorAll('input[name="client_gender"]').forEach((input) => {
      input.addEventListener('change', syncGenderChoice);
    });
    syncGenderChoice();
    ['#order-quantity', '#order-price'].forEach((selector) => $(selector).addEventListener('input', updateTotal));
    $('#order-quantity').addEventListener('blur', clampQuantity);
    $('#order-price').addEventListener('blur', clampPrice);
    $('#order-price').addEventListener('change', clampPrice);
    $('#order-quantity').addEventListener('change', clampQuantity);
    $('#thanks-again').addEventListener('click', () => {
      state.thanks = false;
      $('#thanks-card').hidden = true;
      const alertLink = $('#thanks-whatsapp');
      if (alertLink) { alertLink.hidden = true; alertLink.removeAttribute('href'); }
      $('#form-card').hidden = false;
      $('#order-name').focus();
      loadStock({ silent: true });
    });
    state.order = readOrder();
    renderTrack();
    refreshOrder();
    updateTotal();
    loadStock();
    startRefresh();
    setupIosInstallGuide();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker non enregistré :', error));
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        loadStock({ silent: true });
        refreshOrder();
      }
    });
  }

  init();
})();
