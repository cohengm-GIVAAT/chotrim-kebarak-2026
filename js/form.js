// form.js — טיפול בטופס הרישום

let currentStep = 1;
let formData = {};

// ── ניווט בין שלבים ──────────────────────────────────────────
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;
  document.getElementById("step" + currentStep).classList.remove("active");
  document.querySelectorAll(".step").forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
  });
  currentStep = n;
  const target = document.getElementById("step" + n) || document.getElementById("stepSuccess");
  target.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (n === 4) renderFinalSummary();
}

// ── ולידציה לפי שלב ─────────────────────────────────────────
function validateStep(step) {
  if (step === 1) {
    const fields = [
      { id: "firstName",    msg: "נא להזין שם פרטי" },
      { id: "lastName",     msg: "נא להזין שם משפחה" },
      { id: "idNumber",     msg: "נא להזין תעודת זהות" },
      { id: "age",          msg: "נא להזין גיל" },
      { id: "phone",        msg: "נא להזין טלפון" },
      { id: "email",        msg: "נא להזין כתובת מייל" },
      { id: "participants", msg: "נא להזין מספר משתתפים" },
    ];
    for (const f of fields) {
      const el = document.getElementById(f.id);
      if (!el || !el.value.trim()) { if(el) showError(el, f.msg); return false; }
      el.classList.remove("error");
    }
    const id = document.getElementById("idNumber").value;
    if (!/^\d{9}$/.test(id)) {
      showError(document.getElementById("idNumber"), "תעודת זהות חייבת להיות 9 ספרות");
      return false;
    }
    return true;
  }
  if (step === 3) {
    const agreed = document.getElementById("healthAgree").checked;
    const signed = signatureData !== null;
    if (!agreed) { alert("יש לקרוא ולאשר את הצהרת הבריאות"); return false; }
    if (!signed)  { alert("יש לחתום בחתימה דיגיטלית"); return false; }
    return true;
  }
  return true;
}

function showError(el, msg) {
  el.classList.add("error");
  el.focus();
  el.placeholder = msg;
}

// ── חישוב סכום ───────────────────────────────────────────────
function calcTotal() {
  let shirtTotal = 0;
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const el = document.getElementById("shirt_" + sz);
    const v  = el ? (parseInt(el.value) || 0) : 0;
    shirtTotal += v * CONFIG.PRICES.shirt;
  });
  const hatEl  = document.getElementById("hat_qty");
  const hatQty = hatEl ? (parseInt(hatEl.value) || 0) : 0;
  return { shirtTotal, hatTotal: hatQty * CONFIG.PRICES.hat, hatQty };
}

// ── עדכון סיכום בדף ציוד/ביגוד ──────────────────────────────
function updateSummary() {
  const { shirtTotal, hatTotal } = calcTotal();
  const grand = shirtTotal + hatTotal;
  const s = document.getElementById("sum_shirts");
  const h = document.getElementById("sum_hats");
  const t = document.getElementById("sum_total");
  const p = document.getElementById("payBtnAmt");
  if (s) s.textContent = "₪" + shirtTotal;
  if (h) h.textContent = "₪" + hatTotal;
  if (t) t.textContent = "₪" + grand;
  if (p) p.textContent = "₪" + grand;
}

// ── סיכום סופי בדף תשלום ─────────────────────────────────────
function renderFinalSummary() {
  const fn    = document.getElementById("firstName").value;
  const ln    = document.getElementById("lastName").value;
  const id    = document.getElementById("idNumber").value;
  const parts = document.getElementById("participants").value;

  // ציוד
  let equipLines = [];
  CONFIG.EQUIPMENT_ITEMS.forEach(item => {
    const el = document.getElementById("equip_" + item.id);
    if (el) {
      const v = parseInt(el.value) || 0;
      if (v > 0) equipLines.push(item.label + " ×" + v);
    }
  });

  // ביגוד
  let shirtLines = [], shirtTotal = 0;
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const el = document.getElementById("shirt_" + sz);
    const v  = el ? (parseInt(el.value) || 0) : 0;
    if (v > 0) { shirtLines.push(sz + "×" + v); shirtTotal += v * CONFIG.PRICES.shirt; }
  });
  const hatEl    = document.getElementById("hat_qty");
  const hatQty   = hatEl ? (parseInt(hatEl.value) || 0) : 0;
  const hatTotal = hatQty * CONFIG.PRICES.hat;
  const grand    = shirtTotal + hatTotal;

  // הצג/הסתר כפתור תשלום או סיום חינמי
  const paySection  = document.getElementById("paymentSection");
  const freeSection = document.getElementById("freeSection");
  if (grand > 0) {
    const p = document.getElementById("payBtnAmt");
    if (p) p.textContent = "₪" + grand;
    if (paySection)  paySection.classList.remove("hidden");
    if (freeSection) freeSection.classList.add("hidden");
  } else {
    if (paySection)  paySection.classList.add("hidden");
    if (freeSection) freeSection.classList.remove("hidden");
  }

  // סיכום פרטים
  const fs = document.getElementById("finalSummary");
  if (fs) fs.innerHTML = `
    <div class="fs-row"><span>שם</span><span>${fn} ${ln}</span></div>
    <div class="fs-row"><span>ת.ז</span><span>${id}</span></div>
    <div class="fs-row"><span>מספר משתתפים</span><span>${parts}</span></div>
    ${equipLines.length ? `<div class="fs-row"><span>ציוד</span><span>${equipLines.join(", ")}</span></div>` : ""}
    ${shirtLines.length ? `<div class="fs-row"><span>חולצות</span><span>${shirtLines.join(", ")}</span></div>` : ""}
    ${hatQty > 0        ? `<div class="fs-row"><span>כובעים</span><span>×${hatQty}</span></div>` : ""}
    <div class="fs-row total"><span>סה״כ לתשלום</span><span>₪${grand}</span></div>
  `;
}

// ── שליחת הטופס ─────────────────────────────────────────────
async function submitForm() {
  // מצא את הכפתור הפעיל
  const submitBtn = document.getElementById("submitBtn");
  const freeBtn   = document.querySelector("#freeSection button");
  const payHidden = document.getElementById("paymentSection") &&
                    document.getElementById("paymentSection").classList.contains("hidden");
  const activeBtn = payHidden ? freeBtn : submitBtn;
  if (activeBtn) { activeBtn.disabled = true; activeBtn.textContent = "שולח..."; }

  const shirtQtys = {};
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const el = document.getElementById("shirt_" + sz);
    shirtQtys[sz] = el ? (parseInt(el.value) || 0) : 0;
  });

  const equipQtys = {};
  CONFIG.EQUIPMENT_ITEMS.forEach(item => {
    const el = document.getElementById("equip_" + item.id);
    equipQtys[item.id] = el ? (parseInt(el.value) || 0) : 0;
  });

  const hatEl    = document.getElementById("hat_qty");
  const hatQty   = hatEl ? (parseInt(hatEl.value) || 0) : 0;
  const shirtSum = CONFIG.SHIRT_SIZES.reduce((s, sz) => s + shirtQtys[sz] * CONFIG.PRICES.shirt, 0);
  const total    = shirtSum + hatQty * CONFIG.PRICES.hat;

  const payload = {
    action:             "submit",
    firstName:          document.getElementById("firstName").value.trim(),
    lastName:           document.getElementById("lastName").value.trim(),
    idNumber:           document.getElementById("idNumber").value.trim(),
    age:                document.getElementById("age").value,
    phone:              document.getElementById("phone").value.trim(),
    email:              document.getElementById("email").value.trim(),
    street:             (document.getElementById("street")   || {value:""}).value.trim(),
    houseNum:           (document.getElementById("houseNum") || {value:""}).value.trim(),
    city:               (document.getElementById("city")     || {value:""}).value.trim(),
    zipCode:            (document.getElementById("zipCode")  || {value:""}).value.trim(),
    participants:       document.getElementById("participants").value,
    hearAbout:          (document.getElementById("hearAbout") || {value:""}).value,
    equip_kayak_single: equipQtys["kayak_single"] || 0,
    equip_sup_single:   equipQtys["sup_single"]   || 0,
    equip_kayak_double: equipQtys["kayak_double"] || 0,
    shirt_S:            shirtQtys["S"],
    shirt_M:            shirtQtys["M"],
    shirt_L:            shirtQtys["L"],
    shirt_XL:           shirtQtys["XL"],
    shirt_XXL:          shirtQtys["XXL"],
    hat_qty:            hatQty,
    total:              total,
    payMethod:          total > 0 ? "paybox" : "free",
    health:             "נחתם",
    timestamp:          new Date().toLocaleString("he-IL"),
  };

  try {
    const orderNumber = await sendToSheet(payload);
    showSuccess(orderNumber, payload, total);
    if (total > 0) {
      setTimeout(() => { window.open(CONFIG.PAYBOX_URL, "_blank"); }, 800);
    }
  } catch (err) {
    console.error("submitForm error:", err);
    const msgEl = document.getElementById("submitMsg");
    if (msgEl) {
      msgEl.textContent = "אירעה שגיאה בשליחה. נסה/י שוב.";
      msgEl.classList.remove("hidden");
    }
    if (activeBtn) { activeBtn.disabled = false; activeBtn.textContent = "נסה שוב"; }
  }
}

// ── שליחה ל-Google Sheets ───────────────────────────────────
async function sendToSheet(payload) {
  // בנה URL עם הפרמטרים
  const params = new URLSearchParams({
    action:             payload.action,
    firstName:          payload.firstName,
    lastName:           payload.lastName,
    idNumber:           payload.idNumber,
    age:                payload.age,
    phone:              payload.phone,
    email:              payload.email,
    city:               payload.city || "",
    participants:       payload.participants,
    equip_kayak_single: payload.equip_kayak_single || 0,
    equip_sup_single:   payload.equip_sup_single   || 0,
    equip_kayak_double: payload.equip_kayak_double || 0,
    shirt_S:            payload.shirt_S   || 0,
    shirt_M:            payload.shirt_M   || 0,
    shirt_L:            payload.shirt_L   || 0,
    shirt_XL:           payload.shirt_XL  || 0,
    shirt_XXL:          payload.shirt_XXL || 0,
    hat_qty:            payload.hat_qty   || 0,
    total:              payload.total     || 0,
    payMethod:          payload.payMethod,
    health:             payload.health,
    street:             (payload.street || "").substring(0, 30),
    houseNum:           payload.houseNum  || "",
    zipCode:            payload.zipCode   || "",
    hearAbout:          payload.hearAbout || "",
    timestamp:          payload.timestamp,
  });

  const url = CONFIG.SHEET_URL + "?" + params.toString();

  // שלח עם no-cors — לא מקבלים תגובה אבל הנתונים נשמרים
  await fetch(url, { method: "GET", mode: "no-cors" });

  // מספר הזמנה מקומי (no-cors לא מאפשר לקרוא תגובה)
  const orderNumber = "BL-" + String(Date.now()).slice(-4);
  return orderNumber;
}

// ── הצגת הצלחה ──────────────────────────────────────────────
function showSuccess(orderNumber, payload, total) {
  document.getElementById("step4").classList.remove("active");
  document.getElementById("stepSuccess").classList.add("active");
  const emailEl = document.getElementById("successEmail");
  if (emailEl) emailEl.textContent = "אישור נשלח לכתובת " + payload.email;
  const sumEl = document.getElementById("successSummary");
  // בנה פירוט ציוד
  const equipLines = CONFIG.EQUIPMENT_ITEMS
    .filter(item => (payload["equip_" + item.id] || 0) > 0)
    .map(item => item.label + " ×" + payload["equip_" + item.id]);

  // בנה פירוט חולצות
  const shirtLines = CONFIG.SHIRT_SIZES
    .filter(sz => (payload["shirt_" + sz] || 0) > 0)
    .map(sz => sz + "×" + payload["shirt_" + sz]);

  if (sumEl) sumEl.innerHTML = `
    <div class="fs-row"><span>מס׳ הזמנה</span><span><strong>${orderNumber}</strong></span></div>
    <div class="fs-row"><span>שם</span><span>${payload.firstName} ${payload.lastName}</span></div>
    <div class="fs-row"><span>ת.ז</span><span>${payload.idNumber}</span></div>
    <div class="fs-row"><span>מספר משתתפים</span><span>${payload.participants}</span></div>
    ${equipLines.length ? `<div class="fs-row"><span>ציוד</span><span>${equipLines.join(", ")}</span></div>` : ""}
    ${shirtLines.length ? `<div class="fs-row"><span>חולצות</span><span>${shirtLines.join(", ")}</span></div>` : ""}
    ${(payload.hat_qty||0) > 0 ? `<div class="fs-row"><span>כובעים</span><span>×${payload.hat_qty}</span></div>` : ""}
    <div class="fs-row total"><span>סה״כ לתשלום</span><span>₪${total}</span></div>
    <div class="fs-row"><span>הצהרת בריאות</span><span class="badge-green">נחתמה ✓</span></div>
    ${total > 0 ? `<div class="fs-row"><span>תשלום</span><span class="badge-green">נפתח PayBox בטאב חדש ✓</span></div>` : `<div class="fs-row"><span>תשלום</span><span>ללא תשלום</span></div>`}
  `;

  // כפתור סגירה
  const closeWrap = document.getElementById("successCloseBtn");
  if (closeWrap) closeWrap.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
