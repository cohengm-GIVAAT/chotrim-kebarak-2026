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
  document.getElementById("payBtnAmt").textContent  = "₪" + grand;
}

// ── סיכום סופי ──────────────────────────────────────────────
function renderFinalSummary() {
  const fn = document.getElementById("firstName").value;
  const ln = document.getElementById("lastName").value;
  const id = document.getElementById("idNumber").value;
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
    const v = parseInt(document.getElementById("shirt_" + sz).value) || 0;
    if (v > 0) { shirtLines.push(sz + "×" + v); shirtTotal += v * CONFIG.PRICES.shirt; }
  });
  const hatQty   = parseInt(document.getElementById("hat_qty").value) || 0;
  const hatTotal = hatQty * CONFIG.PRICES.hat;
  const grand    = shirtTotal + hatTotal;

  document.getElementById("sum_total").textContent = "₪" + grand;

  // הצג תשלום או סיום חינמי לפי הסכום
  const paySection  = document.getElementById("paymentSection");
  const freeSection = document.getElementById("freeSection");
  if (grand > 0) {
    document.getElementById("payBtnAmt").textContent = "₪" + grand;
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

// ── אמצעי תשלום: PayBox בלבד ────────────────────────────────
function selectPay(method) {
  selectedPayMethod = "paybox";
  renderFinalSummary();
}

// ── שליחת הטופס ─────────────────────────────────────────────
async function submitForm() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "שולח...";

  // איסוף נתונים
  const shirtQtys = {};
  CONFIG.SHIRT_SIZES.forEach(sz => {
    shirtQtys[sz] = parseInt(document.getElementById("shirt_" + sz).value) || 0;
  });

  const equipQtys = {};
  CONFIG.EQUIPMENT_ITEMS.forEach(item => {
    const el = document.getElementById("equip_" + item.id);
    equipQtys[item.id] = el ? (parseInt(el.value) || 0) : 0;
  });

  const hatQty    = parseInt(document.getElementById("hat_qty").value) || 0;
  const shirtSum  = CONFIG.SHIRT_SIZES.reduce((s, sz) => s + shirtQtys[sz] * CONFIG.PRICES.shirt, 0);
  const total     = shirtSum + hatQty * CONFIG.PRICES.hat;

  const payload = {
    action:       "submit",
    firstName:    document.getElementById("firstName").value.trim(),
    lastName:     document.getElementById("lastName").value.trim(),
    idNumber:     document.getElementById("idNumber").value.trim(),
    age:          document.getElementById("age").value,
    phone:        document.getElementById("phone").value.trim(),
    email:        document.getElementById("email").value.trim(),
    street:       document.getElementById("street").value.trim(),
    houseNum:     document.getElementById("houseNum").value.trim(),
    city:         document.getElementById("city").value.trim(),
    zipCode:      document.getElementById("zipCode").value.trim(),
    participants: document.getElementById("participants").value,
    hearAbout:    document.getElementById("hearAbout").value,
    equip_kayak_single: equipQtys["kayak_single"] || 0,
    equip_sup_single:   equipQtys["sup_single"]   || 0,
    equip_kayak_double:   equipQtys["kayak_double"]   || 0,
    shirt_S:   shirtQtys["S"],
    shirt_M:   shirtQtys["M"],
    shirt_L:   shirtQtys["L"],
    shirt_XL:  shirtQtys["XL"],
    shirt_XXL: shirtQtys["XXL"],
    hat_qty:   hatQty,
    total:     total,
    payMethod: total > 0 ? 'paybox' : 'free',
    signature: signatureData || "",
    health:    "נחתם",
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(CONFIG.SHEET_URL, {
      method: "POST",
      body:   JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.status === "ok") {
      // הצלחה
      document.getElementById("step4").classList.remove("active");
      document.getElementById("stepSuccess").classList.add("active");
      document.getElementById("successEmail").textContent =
        "אישור נשלח לכתובת " + payload.email;
      document.getElementById("successSummary").innerHTML = `
        <div class="fs-row"><span>מס׳ הזמנה</span><span><strong>${data.orderNumber}</strong></span></div>
        <div class="fs-row"><span>שם</span><span>${payload.firstName} ${payload.lastName}</span></div>
        <div class="fs-row"><span>סה״כ שולם</span><span>₪${total}</span></div>
        <div class="fs-row"><span>הצהרת בריאות</span><span class="badge-green">נחתמה</span></div>
      `;
      // הפנייה ל-PayBox אם יש סכום לתשלום
      if (total > 0) {
        setTimeout(() => { window.open(CONFIG.PAYBOX_URL, "_blank"); }, 1200);
      }
    } else {
      throw new Error(data.message || "שגיאה");
    }
  } catch (err) {
    document.getElementById("submitMsg").textContent =
      "אירעה שגיאה בשליחה: " + err.message + ". נסה/י שוב.";
    document.getElementById("submitMsg").classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "נסה שוב";
  }
}
