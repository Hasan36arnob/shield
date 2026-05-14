// --- SHIELD Store (local demo ecommerce) ---

const STORAGE_KEYS = {
  cart: "shield_cart_v1",
  orders: "shield_orders_v1",
};

const currency = (n) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return "$" + Number(n).toFixed(2);
  }
};

const PRODUCTS = [
  {
    id: "p-hoodie",
    title: "Discipline Hoodie",
    category: "apparel",
    price: 49.99,
    stock: 24,
    image: "🧥",
    description:
      "Heavyweight hoodie with a clean, minimal mark. Built for early mornings and long nights.",
    tags: ["hoodie", "discipline", "soft"],
  },
  {
    id: "p-tee",
    title: "Focus Tee",
    category: "apparel",
    price: 24.0,
    stock: 40,
    image: "👕",
    description:
      "Breathable tee for daily reps. When you wear it, you remember the mission.",
    tags: ["t-shirt", "focus"],
  },
  {
    id: "p-bottle",
    title: "Steel Water Bottle",
    category: "gear",
    price: 19.5,
    stock: 60,
    image: "💧",
    description:
      "Insulated bottle to keep you in the zone—hydrate, progress, repeat.",
    tags: ["bottle", "hydration"],
  },
  {
    id: "p-mat",
    title: "Training Mat",
    category: "gear",
    price: 39.99,
    stock: 18,
    image: "🧘",
    description:
      "Grip + comfort for workouts, stretching, and calm resets.",
    tags: ["mat", "training"],
  },
  {
    id: "p-book",
    title: "The Private Battle",
    category: "books",
    price: 14.99,
    stock: 120,
    image: "📘",
    description:
      "A short read on consistency, friction, and building the mind you want.",
    tags: ["book", "consistency"],
  },
  {
    id: "p-journal",
    title: "Clean Days Journal",
    category: "books",
    price: 12.5,
    stock: 80,
    image: "📓",
    description:
      "Daily prompts to track wins, learn patterns, and stay honest.",
    tags: ["journal", "habits"],
  },
  {
    id: "p-cap",
    title: "Shield Cap",
    category: "accessories",
    price: 16.75,
    stock: 55,
    image: "🧢",
    description:
      "Lightweight cap for the walk to your next level.",
    tags: ["cap", "shade"],
  },
  {
    id: "p-stickers",
    title: "Discipline Sticker Pack",
    category: "accessories",
    price: 7.99,
    stock: 200,
    image: "✨",
    description:
      "Motivation you can see. Add it to your laptop, bottle, or notebook.",
    tags: ["stickers", "motivation"],
  },
];

let state = {
  cart: loadCart(),
  orders: loadOrders(),
  modal: { productId: null, qty: 1 },
  filters: { q: "", category: "all" },
};

function navigate(view) {
  const views = ["catalog", "cart", "checkout", "orders"];
  for (const v of views) {
    const el = document.getElementById(`view-${v}`);
    if (el) el.hidden = v !== view;
  }
  refreshCartUI();
  refreshOrdersUI();
  if (view === "catalog") renderCatalog();
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.orders);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
}

function getCartCount() {
  return state.cart.reduce((acc, it) => acc + (it.qty || 0), 0);
}

function findProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function cartSubtotal() {
  return state.cart.reduce((acc, it) => {
    const p = findProductById(it.productId);
    return p ? acc + p.price * it.qty : acc;
  }, 0);
}

function taxEstimate(subtotal) {
  return subtotal * 0.08;
}

function upsertCartItem(productId, qtyToAdd) {
  const p = findProductById(productId);
  if (!p) return;
  const qty = Math.max(0, Math.floor(qtyToAdd));
  if (qty <= 0) return;

  const existing = state.cart.find((x) => x.productId === productId);
  if (existing) existing.qty = Math.min(p.stock, existing.qty + qty);
  else state.cart.push({ productId, qty: Math.min(p.stock, qty) });
}

function setCartQty(productId, qty) {
  const p = findProductById(productId);
  if (!p) return;
  const next = Math.max(0, Math.floor(Number(qty)));
  if (next <= 0) {
    state.cart = state.cart.filter((x) => x.productId !== productId);
    return;
  }
  state.cart = state.cart.map((x) =>
    x.productId === productId ? { ...x, qty: Math.min(p.stock, next) } : x
  );
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((x) => x.productId !== productId);
}

function clearCart() {
  state.cart = [];
  saveCart();
  refreshCartUI();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """)
    .replaceAll("'", "&#039;");
}

function capitalize(s) {
  return String(s).replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function onSearch() {
  state.filters.q = (document.getElementById("searchInput")?.value || "").trim();
  renderCatalog();
}

function onCategoryChange() {
  state.filters.category = document.getElementById("categorySelect")?.value || "all";
  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("catalogEmpty");
  const resultsMeta = document.getElementById("resultsMeta");
  if (!grid) return;

  const q = (state.filters.q || "").toLowerCase();
  const cat = state.filters.category;

  const filtered = PRODUCTS.filter((p) => {
    const matchesCat = cat === "all" ? true : p.category === cat;
    const matchesQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQ;
  });

  grid.innerHTML = "";
  if (resultsMeta)
    resultsMeta.innerText = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  for (const p of filtered) {
    const card = document.createElement("div");
    card.className = "productCard";
    card.innerHTML = `
      <button class="productCard__btn" onclick="openProductModal('${p.id}')" aria-label="View ${escapeHtml(p.title)}">
        <div class="productCard__img">${escapeHtml(p.image)}</div>
        <div class="productCard__title">${escapeHtml(p.title)}</div>
        <div class="productCard__meta">${escapeHtml(capitalize(p.category))}</div>
        <div class="productCard__bottom">
          <div class="productCard__price">${currency(p.price)}</div>
          <div class="productCard__stock">${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</div>
        </div>
      </button>
      <div class="productCard__actions">
        <button class="secondaryBtn secondaryBtn--small" ${p.stock <= 0 ? "disabled" : ""} onclick="addToCart('${p.id}')">Add</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

function refreshCartUI() {
  const itemsEl = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartCountEl = document.getElementById("cartCount");

  if (cartCountEl) cartCountEl.innerText = String(getCartCount());
  if (!itemsEl) return;

  const count = getCartCount();
  if (count <= 0) {
    if (cartEmptyEl) cartEmptyEl.hidden = false;
    if (summaryEl) summaryEl.hidden = true;
    itemsEl.innerHTML = "";
    return;
  }

  if (cartEmptyEl) cartEmptyEl.hidden = true;
  if (summaryEl) summaryEl.hidden = false;

  itemsEl.innerHTML = "";

  for (const it of state.cart) {
    const p = findProductById(it.productId);
    if (!p) continue;

    const row = document.createElement("div");
    row.className = "cartItem";
    row.innerHTML = `
      <div class="cartItem__img">${escapeHtml(p.image)}</div>
      <div class="cartItem__info">
        <div class="cartItem__title">${escapeHtml(p.title)}</div>
        <div class="cartItem__price">${currency(p.price)} each</div>
        <div class="cartItem__sub">Category: ${escapeHtml(capitalize(p.category))}</div>
      </div>
      <div class="cartItem__right">
        <div class="qtyRow qtyRow--sm">
          <button class="qtyBtn" onclick="setQty('${p.id}', ${it.qty - 1})">-</button>
          <input class="qtyInput" type="number" min="1" value="${it.qty}" oninput="onCartQtyInput('${p.id}', this.value)" />
          <button class="qtyBtn" onclick="setQty('${p.id}', ${it.qty + 1})">+</button>
        </div>
        <div class="cartItem__total">${currency(p.price * it.qty)}</div>
        <button class="linkBtn" onclick="removeItem('${p.id}')">Remove</button>
      </div>
    `;
    itemsEl.appendChild(row);
  }

  const subtotal = cartSubtotal();
  const tax = taxEstimate(subtotal);
  const total = subtotal + tax;

  document.getElementById("sumSubtotal").innerText = currency(subtotal);
  document.getElementById("sumTax").innerText = currency(tax);
  document.getElementById("sumTotal").innerText = currency(total);

  renderCheckoutSummary();
}

function addToCart(productId) {
  const p = findProductById(productId);
  if (!p || p.stock <= 0) return;
  upsertCartItem(productId, 1);
  saveCart();
  refreshCartUI();
}

function setQty(productId, qty) {
  setCartQty(productId, qty);
  saveCart();
  refreshCartUI();
}

function onCartQtyInput(productId, value) {
  setCartQty(productId, value);
  saveCart();
  refreshCartUI();
}

function removeItem(productId) {
  removeFromCart(productId);
  saveCart();
  refreshCartUI();
}

function openProductModal(productId) {
  const p = findProductById(productId);
  if (!p) return;

  state.modal.productId = productId;
  state.modal.qty = 1;

  const modalQty = document.getElementById("modalQty");
  if (modalQty) modalQty.value = "1";

  document.getElementById("modalTitle").innerText = p.title;
  document.getElementById("modalMeta").innerText = capitalize(p.category);
  document.getElementById("modalDescription").innerText = p.description;
  document.getElementById("modalImage").innerText = p.image;
  document.getElementById("modalPrice").innerText = currency(p.price);
  document.getElementById("modalStock").innerText = p.stock > 0 ? `${p.stock} in stock` : "Out of stock";

  const overlay = document.getElementById("productModalOverlay");
  if (overlay) overlay.hidden = false;
  state.modal.open = true;
}

function closeProductModal() {
  const overlay = document.getElementById("productModalOverlay");
  if (overlay) overlay.hidden = true;
  state.modal.open = false;
  state.modal.productId = null;
}

function changeQty(delta) {
  const p = findProductById(state.modal.productId);
  if (!p) return;
  const next = Math.max(1, Math.min(p.stock, (state.modal.qty || 1) + delta));
  state.modal.qty = next;
  const modalQty = document.getElementById("modalQty");
  if (modalQty) modalQty.value = String(next);
}

function onModalQtyInput() {
  const p = findProductById(state.modal.productId);
  if (!p) return;

  const raw = Number(document.getElementById("modalQty").value || 1);
  const next = Math.max(1, Math.min(p.stock, Math.floor(raw)));
  state.modal.qty = next;
  document.getElementById("modalQty").value = String(next);
}

function addModalToCart(buyNow = false) {
  const p = findProductById(state.modal.productId);
  if (!p || p.stock <= 0) return;

  const qty = Math.max(1, Math.floor(state.modal.qty || 1));
  upsertCartItem(p.id, qty);
  saveCart();
  refreshCartUI();
  closeProductModal();

  if (buyNow) navigate("checkout");
}

function renderCheckoutSummary() {
  const container = document.getElementById("checkoutSummary");
  if (!container) return;

  const subtotal = cartSubtotal();
  const tax = taxEstimate(subtotal);
  const total = subtotal + tax;

  const lines = state.cart
    .map((it) => {
      const p = findProductById(it.productId);
      if (!p) return null;
      return `<div class="sumLine"><span>${escapeHtml(p.title)} <span class="muted">x${it.qty}</span></span><span>${currency(p.price * it.qty)}</span></div>`;
    })
    .filter(Boolean)
    .join("");

  container.innerHTML = `
    ${lines}
    <div class="divider"></div>
    <div class="sumRow"><span>Subtotal</span><span>${currency(subtotal)}</span></div>
    <div class="sumRow"><span>Estimated tax</span><span>${currency(tax)}</span></div>
    <div class="sumRow sumRow--total"><span>Total</span><span>${currency(total)}</span></div>
  `;
}

function validateCheckout() {
  const name = document.getElementById("shipName").value.trim();
  const email = document.getElementById("shipEmail").value.trim();
  const address = document.getElementById("shipAddress").value.trim();
  const phone = document.getElementById("shipPhone").value.trim();
  const agree = document.getElementById("agreeTerms").checked;

  if (!name) return "Enter your full name.";
  if (!email || !email.includes("@")) return "Enter a valid email.";
  if (!address) return "Enter your address.";
  if (!phone) return "Enter your phone.";
  if (!agree) return "Please accept the demo checkout terms.";
  return null;
}

function placeOrder() {
  const errEl = document.getElementById("checkoutError");
  if (!errEl) return;
  errEl.hidden = true;
  errEl.innerText = "";

  if (state.cart.length === 0) {
    errEl.innerText = "Your cart is empty.";
    errEl.hidden = false;
    return;
  }

  const error = validateCheckout();
  if (error) {
    errEl.innerText = error;
    errEl.hidden = false;
    return;
  }

  const subtotal = cartSubtotal();
  const tax = taxEstimate(subtotal);
  const total = subtotal + tax;

  const orderId = `ORD-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: "Placed",
    customer: {
      name: document.getElementById("shipName").value.trim(),
      email: document.getElementById("shipEmail").value.trim(),
      address: document.getElementById("shipAddress").value.trim(),
      phone: document.getElementById("shipPhone").value.trim(),
    },
    items: state.cart.map((it) => ({
      productId: it.productId,
      qty: it.qty,
      unitPrice: findProductById(it.productId)?.price || 0,
    })),
    totals: { subtotal, tax, total },
  };

  state.orders = [order, ...state.orders];
  saveOrders();

  state.cart = [];
  saveCart();
  refreshCartUI();

  document.getElementById("shipName").value = "";
  document.getElementById("shipEmail").value = "";
  document.getElementById("shipAddress").value = "";
  document.getElementById("shipPhone").value = "";

  navigate("orders");
}

function refreshOrdersUI() {
  const list = document.getElementById("ordersList");
  const empty = document.getElementById("ordersEmpty");
  if (!list) return;

  const orders = state.orders || [];
  list.innerHTML = "";

  if (orders.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  for (const o of orders) {
    const card = document.createElement("div");
    card.className = "orderCard";

    const itemsHtml = (o.items || [])
      .map((it) => {
        const p = findProductById(it.productId);
        return `<div class="orderItem"><span>${escapeHtml(p?.title || it.productId)}</span><span class="muted">x${it.qty}</span><span>${currency((it.unitPrice || 0) * it.qty)}</span></div>`;
      })
      .join("");

    card.innerHTML = `
      <div class="orderCard__top">
        <div>
          <div class="orderId">${escapeHtml(o.id)}</div>
          <div class="orderDate">${new Date(o.createdAt).toLocaleString()}</div>
        </div>
        <div class="orderStatus">${escapeHtml(o.status || "Placed")}</div>
      </div>
      <div class="divider"></div>
      <div class="orderItems">${itemsHtml}</div>
      <div class="divider"></div>
      <div class="orderTotals">
        <div class="sumRow"><span>Subtotal</span><span>${currency(o.totals.subtotal)}</span></div>
        <div class="sumRow"><span>Tax</span><span>${currency(o.totals.tax)}</span></div>
        <div class="sumRow sumRow--total"><span>Total</span><span>${currency(o.totals.total)}</span></div>
      </div>
      <div class="orderActions">
        <button class="secondaryBtn secondaryBtn--small" onclick="reorder('${escapeHtml(o.id)}')">Reorder</button>
      </div>
    `;

    list.appendChild(card);
  }
}

function reorder(orderId) {
  const o = (state.orders || []).find((x) => x.id === orderId);
  if (!o) return;
  for (const it of o.items || []) upsertCartItem(it.productId, it.qty);
  saveCart();
  refreshCartUI();
  navigate("cart");
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEYS.orders);
  localStorage.removeItem(STORAGE_KEYS.cart);
  state.cart = [];
  state.orders = [];
  saveCart();
  saveOrders();
  refreshCartUI();
  refreshOrdersUI();
  navigate("catalog");
}

function init() {
  const overlay = document.getElementById("productModalOverlay");
  if (overlay) overlay.hidden = true;
  navigate("catalog");
  renderCatalog();
  refreshCartUI();
  refreshOrdersUI();
}

window.navigate = navigate;
window.onSearch = onSearch;
window.onCategoryChange = onCategoryChange;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeQty = changeQty;
window.onModalQtyInput = onModalQtyInput;
window.addModalToCart = addModalToCart;
window.addToCart = addToCart;
window.setQty = setQty;
window.onCartQtyInput = onCartQtyInput;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.placeOrder = placeOrder;
window.resetDemoData = resetDemoData;
window.reorder = reorder;

init();

