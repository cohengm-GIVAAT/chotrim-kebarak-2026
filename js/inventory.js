// inventory.js — טעינת מלאי מ-Google Sheets בזמן אמת

let inventoryCache = {};

async function loadInventory() {
  try {
    const res  = await fetch(CONFIG.SHEET_URL + "?action=inventory");
    const data = await res.json();
    // Apps Script מחזיר את המלאי ישירות (לא עטוף ב-{inventory:...})
    inventoryCache = data.inventory || data || {};
    renderEquipCards();
    renderStockBadges();
  } catch (e) {
    console.warn("לא ניתן לטעון מלאי — ממשיך ללא נתוני מלאי", e);
    renderEquipCards();
  }
}

function getStock(key) {
  return inventoryCache[key] !== undefined ? inventoryCache[key] : "?";
}

function stockClass(qty) {
  if (qty === "?")  return "stock-unknown";
  if (qty <= 0)     return "stock-out";
  if (qty <= 3)     return "stock-low";
  return "stock-ok";
}

function stockLabel(qty) {
  if (qty === "?") return "...";
  if (qty <= 0)    return "אזל";
  if (qty <= 3)    return "נמוך: " + qty;
  return "זמין: " + qty;
}

// ── כרטיסי ציוד ─────────────────────────────────────────────
function renderEquipCards() {
  const grid = document.getElementById("equipGrid");
  if (!grid) return;
  grid.innerHTML = CONFIG.EQUIPMENT_ITEMS.map(item => {
    const qty = getStock(item.id);
    const disabled = qty !== "?" && qty <= 0 ? "disabled" : "";
    const imgContent = item.photo
      ? `<img src="${item.photo}" alt="${item.label}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`
      : `<span style="font-size:11px;color:#888">${item.label}</span>`;
    return `
      <div class="equip-card ${qty <= 0 && qty !== "?" ? "out-of-stock" : ""}">
        <div class="equip-img equip-img-${item.image}">${imgContent}</div>
        <div class="equip-name">${item.label}</div>
        <div class="equip-stock ${stockClass(qty)}">${stockLabel(qty)}</div>
        <div class="equip-qty-row">
          <label>כמות:</label>
          <input type="number" id="equip_${item.id}" min="0" max="${qty !== "?" ? qty : 99}"
                 value="0" oninput="updateSummary()" ${disabled}>
        </div>
      </div>`;
  }).join("");
}

// ── תגי מלאי לביגוד ─────────────────────────────────────────
function renderStockBadges() {
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const el = document.getElementById("stock_shirt_" + sz);
    if (!el) return;
    const key = "shirt_" + sz.toLowerCase();
    const qty = getStock(key);
    el.textContent  = stockLabel(qty);
    el.className    = "stock-badge " + stockClass(qty);
    const input = document.getElementById("shirt_" + sz);
    if (input && qty !== "?" && qty <= 0) input.disabled = true;
  });

  const hatEl = document.getElementById("stock_hat");
  if (hatEl) {
    const qty = getStock("hat");
    hatEl.textContent = stockLabel(qty);
    hatEl.className   = "stock-badge " + stockClass(qty);
    const hi = document.getElementById("hat_qty");
    if (hi && qty !== "?" && qty <= 0) hi.disabled = true;
  }
}

// ── טעינה ראשונית ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // הצג כרטיסי ציוד מיד עם תמונות, לפני טעינת מלאי
  renderEquipCards();
  renderStockBadges();
  // טען מלאי בפסקול
  loadInventory();
});
