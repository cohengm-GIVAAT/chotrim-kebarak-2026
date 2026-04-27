// form.js — טיפול בטופס הרישום

let currentStep = 1;
let selectedPayMethod = "paybox";
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
      if (!el.value.trim()) { showError(el, f.msg); return false; }
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

// ── עדכון סיכום ─────────────────────────────────────────────
function updateSummary() {
  const prices = CONFIG.PRICES;
  let shirtTotal = 0;
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const v = parseInt(document.getElementById("shirt_" + sz).value) || 0;
    shirtTotal += v * prices.shirt;
  });
  const hatQty   = parseInt(document.getElementById("hat_qty").value) || 0;
  const hatTotal = hatQty * prices.hat;
  const grand    = shirtTotal + hatTotal;
  document.getElementById("sum_shirts").textContent = "₪" + shirtTotal;
  document.getElementById("sum_hats").textContent   = "₪" + hatTotal;
  document.getElementById("sum_total").textContent  = "₪" + grand;
  const payBtn = document.getElementById("payBtnAmt");
  if (payBtn) payBtn.textContent = "₪" + grand;
}

// ── סיכום סופי ──────────────────────────────────────────────
function renderFinalSummary() {
  const fn    = document.getElementById("firstName").value;
  const ln    = document.getElementById("lastName").value;
  const id    = document.getElementById("idNumber").value;
  const parts = document.getElementById("participants").value;

  let equipLines = [];
  CONFIG.EQUIPMENT_ITEMS.forEach(item => {
    const el = document.getElementById("equip_" + item.id);
    if (el) {
      const v = parseInt(el.value) || 0;
      if (v > 0) equipLines.push(item.label + " ×" + v);
    }
  });

  let shirtLines = [], shirtTotal = 0;
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const v = parseInt(document.getElementById("shirt_" + sz).value) || 0;
    if (v > 0) { shirtLines.push(sz + "×" + v); shirtTotal += v * CONFIG.PRICES.shirt; }
  });
  const hatQty   = parseInt(document.getElementById("hat_qty").value) || 0;
  const hatTotal = hatQty * CONFIG.PRICES.hat;
  const grand    = shirtTotal + hatTotal;

  const paySection  = document.getElementById("paymentSection");
  const freeSection = document.getElementById("freeSection");
  if (grand > 0) {
    const payBtn = document.getElementById("payBtnAmt");
    if (payBtn) payBtn.textContent = "₪" + grand;
    if (paySection)  paySection.classList.remove("hidden");
    if (freeSection) freeSection.classList.add("hidden");
  } else {
    if (paySection)  paySection.classList.add("hidden");
    if (freeSection) freeSection.classList.remove("hidden");
  }

  document.getElementById("finalSummary").innerHTML = `
    <div class="fs-row"><span>שם</span><span>${fn} ${ln}</span></div>
    <div class="fs-row"><span>ת.ז</span><span>${id}</span></div>
    <div class="fs-row"><span>מספר משתתפים</span><span>${parts}</span></div>
    ${equipLines.length ? `<div class="fs-row"><span>ציוד</span><span>${equipLines.join(", ")}</span></div>` : ""}
    ${shirtLines.length ? `<div class="fs-row"><span>חולצות</span><span>${shirtLines.join(", ")}</span></div>` : ""}
    ${hatQty > 0 ? `<div class="fs-row"><span>כובעים</span><span>×${hatQty}</span></div>` : ""}
    <div class="fs-row total"><span>סה״כ לתשלום</span><span>₪${grand}</span></div>
  `;
}

// ── שליחת הטופס — JSONP עוקף CORS ───────────────────────────
async function submitForm() {
  const submitBtn  = document.getElementById("submitBtn");
  const freeBtn    = document.querySelector("#freeSection .btn-primary");
  const activeBtn  = submitBtn && !submitBtn.closest(".hidden") ? submitBtn : freeBtn;
  if (activeBtn) { activeBtn.disabled = true; activeBtn.textContent = "שולח..."; }

  const shirtQtys = {};
  CONFIG.SHIRT_SIZES.forEach(sz => {
    shirtQtys[sz] = parseInt(document.getElementById("shirt_" + sz).value) || 0;
  });

  const equipQtys = {};
  CONFIG.EQUIPMENT_ITEMS.forEach(item => {
    const el = document.getElementById("equip_" + item.id);
    equipQtys[item.id] = el ? (parseInt(el.value) || 0) : 0;
  });

  const hatQty   = parseInt(document.getElementById("hat_qty").value) || 0;
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
    street:             document.getElementById("street").value.trim(),
    houseNum:           document.getElementById("houseNum").value.trim(),
    city:               document.getElementById("city").value.trim(),
    zipCode:            document.getElementById("zipCode").value.trim(),
    participants:       document.getElementById("participants").value,
    hearAbout:          document.getElementById("hearAbout").value,
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
    const orderNumber = await sendViaJsonp(payload);
    showSuccess(orderNumber, payload, total);
    if (total > 0) {
      setTimeout(() => { window.open(CONFIG.PAYBOX_URL, "_blank"); }, 1200);
    }
  } catch (err) {
    const msgEl = document.getElementById("submitMsg");
    if (msgEl) {
      msgEl.textContent = "אירעה שגיאה בשליחה. נסה/י שוב.";
      msgEl.classList.remove("hidden");
    }
    if (activeBtn) { activeBtn.disabled = false; activeBtn.textContent = "נסה שוב"; }
    console.error(err);
  }
}

// ── JSONP — עוקף CORS ────────────────────────────────────────
function sendViaJsonp(payload) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Date.now();
    const params = new URLSearchParams({ ...payload, callback: cbName });
    const url    = CONFIG.SHEET_URL + "?" + params.toString();

    window[cbName] = function(data) {
      delete window[cbName];
      try { document.head.removeChild(script); } catch(e) {}
      if (data && data.status === "ok") {
        resolve(data.orderNumber || "BL-0000");
      } else {
        reject(new Error(data && data.message ? data.message : "שגיאה"));
      }
    };

    const script   = document.createElement("script");
    script.src     = url;
    script.onerror = () => {
      delete window[cbName];
      try { document.head.removeChild(script); } catch(e) {}
      reject(new Error("שגיאת רשת"));
    };

    setTimeout(() => {
      if (window[cbName]) {
        delete window[cbName];
        try { document.head.removeChild(script); } catch(e) {}
        reject(new Error("timeout"));
      }
    }, 15000);

    document.head.appendChild(script);
  });
}

// ── הצגת הצלחה ──────────────────────────────────────────────
function showSuccess(orderNumber, payload, total) {
  document.getElementById("step4").classList.remove("active");
  document.getElementById("stepSuccess").classList.add("active");
  document.getElementById("successEmail").textContent =
    "אישור נשלח לכתובת " + payload.email;
  document.getElementById("successSummary").innerHTML = `
    <div class="fs-row"><span>מס׳ הזמנה</span><span><strong>${orderNumber}</strong></span></div>
    <div class="fs-row"><span>שם</span><span>${payload.firstName} ${payload.lastName}</span></div>
    <div class="fs-row"><span>סה״כ לתשלום</span><span>₪${total}</span></div>
    <div class="fs-row"><span>הצהרת בריאות</span><span class="badge-green">נחתמה ✓</span></div>
  `;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
