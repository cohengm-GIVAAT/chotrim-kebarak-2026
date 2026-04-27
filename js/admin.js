// admin.js — לוח ניהול

let allRows = [];
let editingRow = null;

// ── טעינת נתונים ─────────────────────────────────────────────
async function loadData() {
  try {
    const res  = await fetch(CONFIG.SHEET_URL + "?action=admin");
    const data = await res.json();
    allRows = data.rows || [];
    renderKPIs();
    renderRegistrations();
    renderPayments();
    renderInventoryAdmin(data.inventory || {});
  } catch (e) {
    document.getElementById("regTableBody").innerHTML =
      `<tr><td colspan="12" class="error-cell">שגיאה בטעינה: ${e.message}</td></tr>`;
  }
}

function refreshData() { loadData(); }

// ── KPI ──────────────────────────────────────────────────────
function renderKPIs() {
  const total   = allRows.length;
  const paid    = allRows.filter(r => r.payStatus === "שולם").length;
  const pending = allRows.filter(r => r.payStatus === "ממתין").length;
  const revenue = allRows.filter(r => r.payStatus === "שולם")
                         .reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const noHealth = allRows.filter(r => r.health === "חסר").length;

  document.getElementById("kpiTotal").textContent   = total;
  document.getElementById("kpiPaid").textContent    = paid;
  document.getElementById("kpiPending").textContent = pending;
  document.getElementById("kpiRevenue").textContent = "₪" + revenue.toLocaleString();
  document.getElementById("kpiNoHealth").textContent = noHealth;
}

// ── טבלת נרשמים ─────────────────────────────────────────────
function renderRegistrations(rows) {
  rows = rows || allRows;
  const tbody = document.getElementById("regTableBody");
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="12" class="empty-cell">אין נרשמים עדיין</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    const payBadge    = r.payStatus === "שולם"
      ? '<span class="badge badge-green">שולם</span>'
      : '<span class="badge badge-amber">ממתין</span>';
    const healthBadge = r.health === "נחתם"
      ? '<span class="badge badge-green">נחתם</span>'
      : '<span class="badge badge-red">חסר</span>';
    const shirts = ["S","M","L","XL","XXL"]
      .filter(sz => (r["shirt_"+sz]||0) > 0)
      .map(sz => sz+"×"+(r["shirt_"+sz])).join(", ") || "—";
    return `
      <tr>
        <td>${r.orderNumber || "—"}</td>
        <td>${r.firstName} ${r.lastName}</td>
        <td>${r.idNumber}</td>
        <td>${r.phone}</td>
        <td>${r.participants}</td>
        <td>${[r.equip_kayak_single>0?"קייאק×"+r.equip_kayak_single:"",
               r.equip_sup_single>0?"סאפ×"+r.equip_sup_single:"",
               r.equip_kayak_double>0?"קייאק זוגי×"+r.equip_kayak_double:""]
               .filter(Boolean).join(", ")||"—"}</td>
        <td>${shirts}</td>
        <td>${r.hat_qty > 0 ? "×"+r.hat_qty : "—"}</td>
        <td>₪${r.total}</td>
        <td>${healthBadge}</td>
        <td>${payBadge}</td>
        <td><button class="btn btn-sm btn-ghost" onclick="openModal(${i})">עדכן</button></td>
      </tr>`;
  }).join("");
}

// ── סינון ───────────────────────────────────────────────────
function filterTable() {
  const q         = document.getElementById("searchInput").value.toLowerCase();
  const payFilter = document.getElementById("filterPay").value;
  const hFilter   = document.getElementById("filterHealth").value;
  const filtered  = allRows.filter(r => {
    const name = (r.firstName + " " + r.lastName + " " + r.idNumber + " " + r.orderNumber).toLowerCase();
    return name.includes(q)
      && (!payFilter || r.payStatus === payFilter)
      && (!hFilter   || r.health    === hFilter);
  });
  renderRegistrations(filtered);
}

// ── טבלת תשלומים ────────────────────────────────────────────
function renderPayments() {
  const tbody = document.getElementById("payTableBody");
  tbody.innerHTML = allRows.map((r, i) => {
    const badge = r.payStatus === "שולם"
      ? '<span class="badge badge-green">שולם</span>'
      : '<span class="badge badge-amber">ממתין</span>';
    return `
      <tr>
        <td>${r.orderNumber || "—"}</td>
        <td>${r.firstName} ${r.lastName}</td>
        <td>₪${r.total}</td>
        <td>${r.payMethod === "paybox" ? "PayBox" : "העברה בנקאית"}</td>
        <td>${r.timestamp ? r.timestamp.substring(0,10) : "—"}</td>
        <td>${badge}</td>
        <td>
          <select onchange="quickUpdatePay(${i}, this.value)">
            <option ${r.payStatus==="ממתין"?"selected":""} value="ממתין">ממתין</option>
            <option ${r.payStatus==="שולם" ?"selected":""} value="שולם">שולם</option>
          </select>
        </td>
      </tr>`;
  }).join("");
}

async function quickUpdatePay(i, val) {
  allRows[i].payStatus = val;
  renderKPIs();
  await saveToSheet(allRows[i]);
}

// ── מלאי (admin view) ────────────────────────────────────────
function renderInventoryAdmin(inv) {
  const equipDiv   = document.getElementById("equipInventory");
  const apparelDiv = document.getElementById("apparelInventory");
  if (!equipDiv || !apparelDiv) return;

  const equipItems = [
    { key: "kayak_single", label: "קייאק יחיד" },
    { key: "sup_single",   label: "סאפ יחיד" },
    { key: "kayak_double",   label: "קייאק זוגי" },
  ];
  const apparelItems = [
    { key: "shirt_s",   label: "חולצה S" },
    { key: "shirt_m",   label: "חולצה M" },
    { key: "shirt_l",   label: "חולצה L" },
    { key: "shirt_xl",  label: "חולצה XL" },
    { key: "shirt_xxl", label: "חולצה XXL" },
    { key: "hat",       label: "כובע" },
  ];

  function card(item) {
    const rem  = inv[item.key] !== undefined ? inv[item.key] : "?";
    const init = inv[item.key + "_init"] || "?";
    const pct  = (rem !== "?" && init !== "?" && init > 0) ? Math.round((1 - rem/init)*100) : 0;
    const cls  = rem === "?" ? "" : rem <= 0 ? "inv-out" : rem <= 4 ? "inv-low" : "inv-ok";
    return `
      <div class="inv-card ${cls}">
        <div class="inv-name">${item.label}</div>
        <div class="inv-bar-bg"><div class="inv-bar" style="width:${pct}%"></div></div>
        <div class="inv-nums">
          <span class="${cls}">${rem} נותרו</span>
          <span>${init} סה״כ</span>
        </div>
      </div>`;
  }

  equipDiv.innerHTML   = equipItems.map(card).join("");
  apparelDiv.innerHTML = apparelItems.map(card).join("");
}

// ── Modal עדכון ──────────────────────────────────────────────
function openModal(i) {
  editingRow = i;
  const r = allRows[i];
  document.getElementById("modalName").textContent =
    r.firstName + " " + r.lastName + " — " + (r.orderNumber || "");
  document.getElementById("modalPay").value    = r.payStatus || "ממתין";
  document.getElementById("modalHealth").value = r.health    || "חסר";
  document.getElementById("statusModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("statusModal").classList.add("hidden");
  editingRow = null;
}

async function saveStatus() {
  if (editingRow === null) return;
  allRows[editingRow].payStatus = document.getElementById("modalPay").value;
  allRows[editingRow].health    = document.getElementById("modalHealth").value;
  closeModal();
  renderKPIs();
  renderRegistrations();
  renderPayments();
  await saveToSheet(allRows[editingRow]);
}

async function saveToSheet(row) {
  try {
    await fetch(CONFIG.SHEET_URL, {
      method: "POST",
      body:   JSON.stringify({ action: "update", row }),
    });
  } catch (e) { console.error("שגיאה בשמירה", e); }
}

// ── ייצוא CSV ────────────────────────────────────────────────
function exportCSV() {
  const headers = ["מס הזמנה","שם פרטי","שם משפחה","ת.ז","גיל","טלפון","מייל",
    "כתובת","משתתפים","קייאק","סאפ יחיד","קייאק זוגי",
    "S","M","L","XL","XXL","כובע","סה'כ","תשלום","בריאות","תאריך"];
  const rows = allRows.map(r => [
    r.orderNumber, r.firstName, r.lastName, r.idNumber, r.age, r.phone, r.email,
    `${r.street||""} ${r.houseNum||""} ${r.city||""}`.trim(), r.participants,
    r.equip_kayak_single||0, r.equip_sup_single||0, r.equip_kayak_double||0,
    r.shirt_S||0, r.shirt_M||0, r.shirt_L||0, r.shirt_XL||0, r.shirt_XXL||0,
    r.hat_qty||0, r.total, r.payStatus, r.health, r.timestamp||""
  ]);
  const csv = [headers, ...rows].map(r => r.map(v =>
    `"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const bom  = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const a    = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "chotrim_kebarak_2026.csv"
  });
  a.click();
}

// ── Tabs ─────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  btn.classList.add("active");
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadData);
