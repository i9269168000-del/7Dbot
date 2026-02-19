// ─── Auth ────────────────────────────────────────────────────────────────────
const SECRET = localStorage.getItem('adminSecret');
if (!SECRET) window.location.href = 'index.html';

function logout() {
    localStorage.removeItem('adminSecret');
    window.location.href = 'index.html';
}

// ─── API ─────────────────────────────────────────────────────────────────────
// ─── API ─────────────────────────────────────────────────────────────────────
const API = '';  // same origin

async function api(method, path, body = null) {
    // Добавляем secret в query-параметры для надежности
    const cleanPath = path.split('?')[0];
    const query = path.split('?')[1] || '';
    const params = new URLSearchParams(query);
    params.append('secret', SECRET);
    const url = `${API}${cleanPath}?${params.toString()}`;

    const opts = {
        method,
        headers: {
            'X-Admin-Secret': SECRET,
            'Content-Type': 'application/json',
        },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    const resp = await fetch(url, opts);
    if (resp.status === 403) { logout(); return null; }
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
    }
    if (resp.status === 204) return null;
    return resp.json();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    setTimeout(() => { el.className = ''; }, 3000);
}

// ─── State ────────────────────────────────────────────────────────────────────
let allOrders = [];
let allProducts = [];
let currentOrderFilter = null;
let editingProductId = null;
let currentTab = 'orders';

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('addProductBtn').style.display = tab === 'products' ? 'flex' : 'none';

    const titles = { orders: '📦 Заказы', products: '🛍️ Товары', settings: '⚙️ Настройки' };
    document.getElementById('topbarTitle').textContent = titles[tab];

    if (tab === 'orders') loadOrders();
    if (tab === 'products') loadProducts();
    if (tab === 'settings') loadSettings();
}

function refreshCurrent() { switchTab(currentTab); }

// ─── Stats ────────────────────────────────────────────────────────────────────
function renderStats(orders, products) {
    const total = orders.length;
    const newCount = orders.filter(o => o.status === 'new').length;
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_thb, 0);
    const productCount = products.length;

    document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Всего заказов</div>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">за всё время</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-label">Новых заказов</div>
      <div class="stat-value">${newCount}</div>
      <div class="stat-sub">ожидают обработки</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Выручка</div>
      <div class="stat-value">฿${revenue.toFixed(0)}</div>
      <div class="stat-sub">все оплаченные</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-label">Товаров</div>
      <div class="stat-value">${productCount}</div>
      <div class="stat-sub">в каталоге</div>
    </div>
  `;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
async function loadOrders() {
    document.getElementById('ordersTable').innerHTML = '<div class="loading">Загрузка...</div>';
    try {
        allOrders = await api('GET', '/admin/orders') || [];
        if (allProducts.length === 0) allProducts = await api('GET', '/admin/products') || [];
        renderStats(allOrders, allProducts);
        renderOrders(currentOrderFilter);
    } catch (e) {
        document.getElementById('ordersTable').innerHTML = `<div class="empty-state"><div class="emoji">❌</div><p>${e.message}</p></div>`;
    }
}

function filterOrders(status, btn) {
    currentOrderFilter = status;
    document.querySelectorAll('#tab-orders .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrders(status);
}

function renderOrders(status) {
    const orders = status ? allOrders.filter(o => o.status === status) : allOrders;
    const payLabels = { transfer: '🏦 Карта РФ', crypto: '💎 Крипта' };
    const statusBadge = {
        new: '<span class="badge badge-new">🆕 Новый</span>',
        paid: '<span class="badge badge-paid">✅ Оплачен</span>',
        delivering: '<span class="badge badge-delivering">🚴 Доставка</span>',
        done: '<span class="badge badge-done">🏁 Выполнен</span>',
        cancelled: '<span class="badge badge-cancelled">❌ Отменён</span>',
    };

    if (orders.length === 0) {
        document.getElementById('ordersTable').innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>Заказов нет</p></div>`;
        return;
    }

    const rows = orders.map(o => {
        const items = o.items ? o.items.map(i => {
            const name = i.product?.name_ru || i.product?.name || `#${i.product_id}`;
            return `${name} ×${i.quantity}`;
        }).join(', ') : '—';
        const dt = new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `<tr>
      <td><strong>#${o.id}</strong></td>
      <td>${dt}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${items}">${items}</td>
      <td><strong>฿${o.total_thb.toFixed(0)}</strong></td>
      <td>${payLabels[o.payment_method] || o.payment_method}</td>
      <td>${statusBadge[o.status] || o.status}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="openOrder(${o.id})">👁 Детали</button>
          ${o.status === 'new' ? `<button class="btn btn-primary btn-sm" onclick="setOrderStatus(${o.id},'paid')">✅ Оплачен</button>` : ''}
          ${o.status === 'paid' ? `<button class="btn btn-orange btn-sm" onclick="setOrderStatus(${o.id},'delivering')">🚴 Доставка</button>` : ''}
          ${o.status === 'delivering' ? `<button class="btn btn-primary btn-sm" onclick="setOrderStatus(${o.id},'done')">🏁 Выполнен</button>` : ''}
        </div>
      </td>
    </tr>`;
    }).join('');

    document.getElementById('ordersTable').innerHTML = `
    <table>
      <thead><tr>
        <th>#</th><th>Дата</th><th>Состав</th><th>Сумма</th><th>Оплата</th><th>Статус</th><th>Действия</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function setOrderStatus(id, status) {
    try {
        await api('POST', `/admin/orders/${id}/status`, { status });
        toast(`Заказ #${id} → ${status}`);
        await loadOrders();
    } catch (e) { toast(e.message, 'error'); }
}

function openOrder(id) {
    const o = allOrders.find(x => x.id === id);
    if (!o) return;
    const items = o.items ? o.items.map(i => {
        const name = i.product?.name_ru || i.product?.name || `#${i.product_id}`;
        return `<tr><td>${name}</td><td>${i.quantity}</td><td>฿${i.price_thb.toFixed(0)}</td><td>฿${(i.price_thb * i.quantity).toFixed(0)}</td></tr>`;
    }).join('') : '';
    const dt = new Date(o.created_at).toLocaleString('ru-RU');
    const payLabels = { transfer: '🏦 Перевод на карту РФ', crypto: '💎 Криптовалюта' };

    document.getElementById('orderModalTitle').textContent = `Заказ #${o.id}`;
    document.getElementById('orderModalBody').innerHTML = `
    <div style="font-size:13px;color:#6b7280;margin-bottom:16px">${dt}</div>
    <table style="margin-bottom:16px">
      <thead><tr><th>Товар</th><th>Кол-во</th><th>Цена</th><th>Итого</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div style="display:grid;gap:8px;font-size:14px">
      <div><strong>Итого:</strong> ฿${o.total_thb.toFixed(0)}</div>
      <div><strong>Оплата:</strong> ${payLabels[o.payment_method] || o.payment_method}</div>
      <div><strong>Адрес:</strong> ${o.address}</div>
      ${o.maps_url ? `<div><a href="${o.maps_url}" target="_blank" style="color:var(--green)">🗺 Открыть на карте</a></div>` : ''}
      ${o.receipt_url ? `<div><a href="${o.receipt_url}" target="_blank" class="receipt-link">📎 Фото чека</a></div>` : '<div style="color:#9ca3af">Чек не загружен</div>'}
    </div>
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-wrap:wrap">
      ${o.status === 'new' ? `<button class="btn btn-primary btn-sm" onclick="setOrderStatus(${o.id},'paid');closeModal('orderModal')">✅ Отметить оплаченным</button>` : ''}
      ${o.status === 'paid' ? `<button class="btn btn-orange btn-sm" onclick="setOrderStatus(${o.id},'delivering');closeModal('orderModal')">🚴 В доставку</button>` : ''}
      ${o.status === 'delivering' ? `<button class="btn btn-primary btn-sm" onclick="setOrderStatus(${o.id},'done');closeModal('orderModal')">🏁 Выполнен</button>` : ''}
    </div>
  `;
    openModal('orderModal');
}

// ─── Products ─────────────────────────────────────────────────────────────────
const CATEGORIES = {
    food: '🍱 Еда', drinks: '🥤 Напитки', snacks: '🍿 Снеки',
    bakery: '🍭 Сладкое', dairy: '🥛 Молочное', frozen: '🧊 Заморозка',
    household: '🧴 Хозтовары', other: '📦 Другое'
};

async function loadProducts() {
    document.getElementById('productsTable').innerHTML = '<div class="loading">Загрузка...</div>';
    try {
        allProducts = await api('GET', '/admin/products') || [];
        renderProducts(allProducts);
    } catch (e) {
        document.getElementById('productsTable').innerHTML = `<div class="empty-state"><div class="emoji">❌</div><p>${e.message}</p></div>`;
    }
}

function filterProductsSearch(q) {
    const lower = q.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        (p.name_ru || '').toLowerCase().includes(lower) ||
        (p.category || '').toLowerCase().includes(lower)
    );
    renderProducts(filtered);
}

function renderProducts(products) {
    if (products.length === 0) {
        document.getElementById('productsTable').innerHTML = `<div class="empty-state"><div class="emoji">🛍️</div><p>Товаров нет</p></div>`;
        return;
    }
    const rows = products.map(p => `<tr>
    <td>
      ${p.image_url ? `<img src="${p.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px" onerror="this.style.display='none'" />` : ''}
      <strong>${p.name_ru || p.name}</strong>
      <div style="font-size:12px;color:#9ca3af">${p.name}</div>
    </td>
    <td>${CATEGORIES[p.category] || p.category}</td>
    <td>฿${p.price_thb.toFixed(0)} <span style="color:#9ca3af;font-size:12px">→ ฿${p.sell_price_thb.toFixed(0)}</span></td>
    <td>
      <label class="toggle">
        <input type="checkbox" ${p.is_available ? 'checked' : ''} onchange="toggleAvailable(${p.id}, this.checked)" />
        <span class="toggle-slider"></span>
      </label>
    </td>
    <td>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="openEditProduct(${p.id})">✏️ Изменить</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑</button>
      </div>
    </td>
  </tr>`).join('');

    document.getElementById('productsTable').innerHTML = `
    <table>
      <thead><tr><th>Товар</th><th>Категория</th><th>Цена (закупка → продажа)</th><th>В наличии</th><th>Действия</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function openAddProduct() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Добавить товар';
    document.getElementById('p_name').value = '';
    document.getElementById('p_name_ru').value = '';
    document.getElementById('p_category').value = 'food';
    document.getElementById('p_price').value = '';
    document.getElementById('p_sell_price').value = '';
    document.getElementById('p_image').value = '';
    document.getElementById('p_available').checked = true;
    openModal('productModal');
}

function openEditProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'Редактировать товар';
    document.getElementById('p_name').value = p.name;
    document.getElementById('p_name_ru').value = p.name_ru || '';
    document.getElementById('p_category').value = p.category;
    document.getElementById('p_price').value = p.price_thb;
    document.getElementById('p_sell_price').value = p.sell_price_thb;
    document.getElementById('p_image').value = p.image_url || '';
    document.getElementById('p_available').checked = !!p.is_available;
    openModal('productModal');
}

function calcSellPrice() {
    const price = parseFloat(document.getElementById('p_price').value);
    if (!isNaN(price)) {
        document.getElementById('p_sell_price').value = (price * 1.30).toFixed(2);
    }
}

async function saveProduct() {
    const data = {
        name: document.getElementById('p_name').value.trim(),
        name_ru: document.getElementById('p_name_ru').value.trim(),
        category: document.getElementById('p_category').value,
        price_thb: parseFloat(document.getElementById('p_price').value),
        sell_price_thb: parseFloat(document.getElementById('p_sell_price').value),
        image_url: document.getElementById('p_image').value.trim() || null,
        is_available: document.getElementById('p_available').checked ? 1 : 0,
    };
    if (!data.name || isNaN(data.price_thb)) {
        toast('Заполните название и цену', 'error'); return;
    }
    try {
        if (editingProductId) {
            await api('PUT', `/admin/products/${editingProductId}`, data);
            toast('Товар обновлён ✓');
        } else {
            await api('POST', '/admin/products', data);
            toast('Товар добавлен ✓');
        }
        closeModal('productModal');
        await loadProducts();
    } catch (e) { toast(e.message, 'error'); }
}

async function toggleAvailable(id, val) {
    try {
        await api('PUT', `/admin/products/${id}`, { is_available: val ? 1 : 0 });
        toast(val ? 'Товар доступен' : 'Товар скрыт');
        allProducts = await api('GET', '/admin/products') || [];
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!confirm(`Удалить «${p?.name_ru || p?.name}»?`)) return;
    try {
        await api('DELETE', `/admin/products/${id}`);
        toast('Товар удалён');
        await loadProducts();
    } catch (e) { toast(e.message, 'error'); }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function loadSettings() {
    try {
        const d = await api('GET', '/admin/settings/transfer');
        document.getElementById('s_bank').value = d.bank || '';
        document.getElementById('s_phone').value = d.phone || '';
        document.getElementById('s_qr').value = d.qr_image_url || '';
        previewQR(d.qr_image_url || '');
    } catch (e) { toast(e.message, 'error'); }
}

async function saveTransferSettings() {
    try {
        await api('PUT', '/admin/settings/transfer', {
            bank: document.getElementById('s_bank').value.trim() || null,
            phone: document.getElementById('s_phone').value.trim() || null,
            qr_image_url: document.getElementById('s_qr').value.trim() || null,
        });
        toast('Реквизиты сохранены ✓');
    } catch (e) { toast(e.message, 'error'); }
}

function previewQR(url) {
    const img = document.getElementById('qrPreview');
    if (url && url.startsWith('http')) {
        img.src = url;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}
// Закрытие по клику вне модала
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    // Загружаем оба одновременно для stats
    try {
        [allOrders, allProducts] = await Promise.all([
            api('GET', '/admin/orders'),
            api('GET', '/admin/products'),
        ]);
        allOrders = allOrders || [];
        allProducts = allProducts || [];
        renderStats(allOrders, allProducts);
        renderOrders(null);
    } catch (e) {
        toast('Ошибка загрузки данных', 'error');
    }
})();
