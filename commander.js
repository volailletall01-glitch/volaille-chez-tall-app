(() => {
  const config = window.SUPABASE_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const MIN_PRICE = Number(config.minPrice) || 2500;
  const MAX_PRICE = Number(config.maxPrice) || 4500;
  const REFRESH_MS = 20000;
  const state = { stock: null, busy: false, timer: null, thanks: false };

  const money = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)} FCFA`;
  const amount = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
  const configured = Boolean(config.url && config.anonKey && !/VOTRE|COLLEZ|COLLEZ_ICI/i.test(config.anonKey));

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

  function renderStock() {
    const stock = state.stock;
    const heads = stock ? Math.max(0, Number(stock.stock_heads) || 0) : 0;
    const min = stock && Number(stock.min_price) ? Number(stock.min_price) : MIN_PRICE;
    const max = stock && Number(stock.max_price) ? Number(stock.max_price) : MAX_PRICE;

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

    if (state.thanks) {
      $('#price-range').textContent = `Prix par tête : entre ${amount(min)} F et ${amount(max)} F`;
      $('#stock-value').textContent = `${amount(heads)} poulet${heads > 1 ? 's' : ''}`;
      $('#stock-state').textContent = heads > 0 ? 'Disponible' : 'Épuisé';
      $('#stock-state').className = `status-pill ${heads > 0 ? '' : 'warning'}`;
      $('#stock-note').textContent = heads > 0
        ? `Quantité totale de poulets disponibles aujourd’hui : ${amount(heads)}.`
        : 'Désolé, le stock est actuellement épuisé.';
      return;
    }

    $('#price-range').textContent = `Prix par tête : entre ${amount(min)} F et ${amount(max)} F`;
    $('#stock-value').textContent = heads > 0 ? `${amount(heads)} poulet${heads > 1 ? 's' : ''}` : '0 poulet';
    $('#stock-state').textContent = heads > 0 ? 'Disponible' : 'Épuisé';
    $('#stock-state').className = `status-pill ${heads > 0 ? '' : 'warning'}`;
    $('#stock-note').textContent = heads > 0
      ? `Quantité totale de poulets disponibles aujourd’hui : ${amount(heads)}.`
      : 'Désolé, le stock est actuellement épuisé.';
    $('#stock-updated').textContent = stock.updated_at
      ? `Mis à jour le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(stock.updated_at))}`
      : '';

    const priceInput = $('#order-price');
    priceInput.min = String(min);
    priceInput.max = String(max);
    priceInput.placeholder = `Entre ${amount(min)} et ${amount(max)}`;

    if (heads > 0) {
      setCardVisibility({ form: true, soldout: false, unavailable: false });
    } else {
      setCardVisibility({ form: false, soldout: true, unavailable: false });
      $('#soldout-message').textContent = 'Désolé, le stock est actuellement épuisé.';
    }
  }

  async function loadStock({ silent = false } = {}) {
    if (!configured) { renderStock(); return; }
    try {
      const rows = await request('/rest/v1/app_config?id=eq.1&select=stock_heads,min_price,max_price,updated_at');
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

  function validate(values) {
    const min = state.stock && Number(state.stock.min_price) ? Number(state.stock.min_price) : MIN_PRICE;
    const max = state.stock && Number(state.stock.max_price) ? Number(state.stock.max_price) : MAX_PRICE;
    const heads = state.stock ? Math.max(0, Number(state.stock.stock_heads) || 0) : 0;
    if (!values.client_name || values.client_name.trim().length < 2) return 'Indiquez votre nom et prénom.';
    if (!values.client_phone || values.client_phone.replace(/\D/g, '').length < 6) return 'Indiquez un numéro de téléphone valide.';
    if (!values.neighborhood || values.neighborhood.trim().length < 2) return 'Indiquez votre quartier de livraison.';
    if (!Number.isInteger(values.quantity) || values.quantity < 1) return 'Indiquez une quantité entière supérieure à zéro.';
    if (heads > 0 && values.quantity > heads) return `Il ne reste que ${amount(heads)} poulet${heads > 1 ? 's' : ''} disponibles.`;
    if (!Number.isFinite(values.price_per_head) || values.price_per_head < min || values.price_per_head > max) {
      return `Le prix par tête doit être compris entre ${amount(min)} FCFA et ${amount(max)} FCFA.`;
    }
    return '';
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (state.busy) return;
    const form = $('#order-form');
    const values = {
      client_name: form.client_name.value.trim(),
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
      await request('/rest/v1/orders', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(values),
      });
      const total = values.quantity * values.price_per_head;
      form.reset();
      updateTotal();
      $('#thanks-title').textContent = `Merci infiniment, ${values.client_name.split(' ')[0]} !`;
      $('#thanks-message').textContent = 'Votre commande a bien été reçue. Nous vous contactons très vite pour confirmer la livraison.';
      $('#thanks-recap').textContent = `${amount(values.quantity)} poulet${values.quantity > 1 ? 's' : ''} · ${money(values.price_per_head)} par tête · total estimé ${money(total)} · livraison à ${values.neighborhood} · ${values.client_phone}`;
      state.thanks = true;
      $('#form-card').hidden = true;
      $('#thanks-card').hidden = false;
      $('#thanks-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHint('');
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
    }, REFRESH_MS);
  }

  function init() {
    if (!configured) {
      renderStock();
      return;
    }
    $('#order-form').addEventListener('submit', submitOrder);
    ['#order-quantity', '#order-price'].forEach((selector) => $(selector).addEventListener('input', updateTotal));
    $('#thanks-again').addEventListener('click', () => {
      state.thanks = false;
      $('#thanks-card').hidden = true;
      $('#form-card').hidden = false;
      $('#order-name').focus();
      loadStock({ silent: true });
    });
    updateTotal();
    loadStock();
    startRefresh();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadStock({ silent: true });
    });
  }

  init();
})();
