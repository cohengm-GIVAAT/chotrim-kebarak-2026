// form.js — טיפול בטופס הרישום

let currentStep = 1;
let formData = {};

// ── עדכון שדות משתתפים נוספים ───────────────────────────────
function updateGuests() {
  const n = parseInt(document.getElementById("participants").value) || 1;
  updateItemCounters();
  document.getElementById("guest2").style.display = n >= 2 ? "block" : "none";
  document.getElementById("guest3").style.display = n >= 3 ? "block" : "none";
  // נקה שדות שנסגרו
  if (n < 2) { 
    document.getElementById("guest2Name").value = ""; 
    document.getElementById("guest2Id").value = ""; 
    document.getElementById("guest2Age").value = ""; 
  }
  if (n < 3) { 
    document.getElementById("guest3Name").value = ""; 
    document.getElementById("guest3Id").value = ""; 
    document.getElementById("guest3Age").value = ""; 
  }
}

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

// ── בדיקת תקינות ת.ז ישראלית (אלגוריתם לון) ─────────────────
function isValidIsraeliID(id) {
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(id[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}

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

    // ת.ז — 9 ספרות + בדיקת תקינות (אלגוריתם לון)
    const idEl = document.getElementById("idNumber");
    if (!/^\d{9}$/.test(idEl.value)) {
      showError(idEl, "תעודת זהות חייבת להיות 9 ספרות");
      return false;
    }
    if (!isValidIsraeliID(idEl.value)) {
      showError(idEl, "תעודת זהות אינה תקינה — נא לבדוק שוב");
      return false;
    }

    // גיל — מינימום 9
    const ageEl = document.getElementById("age");
    const age = parseInt(ageEl.value);
    if (isNaN(age) || age < 9) {
      showError(ageEl, "גיל מינימלי להרשמה הוא 9");
      alert("גיל מינימלי להרשמה הוא 9 שנים.");
      return false;
    }

    // טלפון — חייב להתחיל ב-05 ו-10 ספרות
    const phoneEl = document.getElementById("phone");
    const phone = phoneEl.value.replace(/[-\s]/g, "");
    if (!/^05\d{8}$/.test(phone)) {
      showError(phoneEl, "טלפון חייב להתחיל ב-05 ולכלול 10 ספרות");
      alert("מספר הטלפון חייב להתחיל בקידומת 05 ולכלול 10 ספרות.");
      return false;
    }

    // מייל — אותיות אנגלית בלבד (לא עברית/ערבית)
    const emailEl = document.getElementById("email");
    if (/[^ -]/.test(emailEl.value)) {
      showError(emailEl, "כתובת המייל חייבת להיות באותיות אנגלית בלבד");
      alert("כתובת המייל חייבת להיות באותיות אנגלית בלבד.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      showError(emailEl, "כתובת מייל לא תקינה");
      alert("נא להזין כתובת מייל תקינה.");
      return false;
    }

    // מספר משתתפים — מקסימום 3
    const partEl = document.getElementById("participants");
    const parts = parseInt(partEl.value);
    if (isNaN(parts) || parts < 1 || parts > 3) {
      showError(partEl, "מקסימום 3 משתתפים להזמנה");
      alert("מספר המשתתפים המקסימלי להזמנה הוא 3.");
      return false;
    }

    // ולידציה משתתפים נוספים
    if (parts >= 2) {
      const g2name = document.getElementById("guest2Name").value.trim();
      const g2id   = document.getElementById("guest2Id").value.trim();
      const g2age  = parseInt(document.getElementById("guest2Age").value);
      if (!g2name) { alert("נא להזין שם מלא למשתתף 2"); return false; }
      if (!/^\d{9}$/.test(g2id)) { alert("ת.ז של משתתף 2 חייבת להיות 9 ספרות"); return false; }
      if (!isValidIsraeliID(g2id)) { alert("ת.ז של משתתף 2 אינה תקינה — נא לבדוק שוב"); return false; }
      if (isNaN(g2age) || g2age < 9) { alert("גיל מינימלי למשתתף 2 הוא 9"); return false; }
    }
    if (parts >= 3) {
      const g3name = document.getElementById("guest3Name").value.trim();
      const g3id   = document.getElementById("guest3Id").value.trim();
      const g3age  = parseInt(document.getElementById("guest3Age").value);
      if (!g3name) { alert("נא להזין שם מלא למשתתף 3"); return false; }
      if (!/^\d{9}$/.test(g3id)) { alert("ת.ז של משתתף 3 חייבת להיות 9 ספרות"); return false; }
      if (!isValidIsraeliID(g3id)) { alert("ת.ז של משתתף 3 אינה תקינה — נא לבדוק שוב"); return false; }
      if (isNaN(g3age) || g3age < 9) { alert("גיל מינימלי למשתתף 3 הוא 9"); return false; }
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
  if (step === 2) {
    const participants = parseInt(document.getElementById("participants")?.value) || 1;

    // בדיקת סך חולצות
    let shirtCount = 0;
    CONFIG.SHIRT_SIZES.forEach(sz => {
      const el = document.getElementById("shirt_" + sz);
      shirtCount += el ? (parseInt(el.value) || 0) : 0;
    });
    if (shirtCount > participants) {
      alert("סך החולצות (" + shirtCount + ") לא יכול לעלות על מספר המשתתפים (" + participants + ")");
      return false;
    }

    // בדיקת סך כובעים
    const hatEl = document.getElementById("hat_qty");
    const hatCount = hatEl ? (parseInt(hatEl.value) || 0) : 0;
    if (hatCount > participants) {
      alert("סך הכובעים (" + hatCount + ") לא יכול לעלות על מספר המשתתפים (" + participants + ")");
      return false;
    }
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
  updateItemCounters();
}

// ── מונה חולצות וכובעים בזמן אמת ──────────────────────────────
function updateItemCounters() {
  const participants = parseInt(document.getElementById("participants")?.value) || 1;

  // סכום חולצות
  let shirtCount = 0;
  CONFIG.SHIRT_SIZES.forEach(sz => {
    const el = document.getElementById("shirt_" + sz);
    shirtCount += el ? (parseInt(el.value) || 0) : 0;
  });

  // סכום כובעים
  const hatEl = document.getElementById("hat_qty");
  const hatCount = hatEl ? (parseInt(hatEl.value) || 0) : 0;

  // עדכון מונה חולצות
  const shirtCounter = document.getElementById("shirt_counter");
  if (shirtCounter) {
    const shirtOver = shirtCount > participants;
    shirtCounter.textContent = "בחרת " + shirtCount + " מתוך " + participants + " מותר";
    shirtCounter.style.color = shirtOver ? "#E24B4A" : "#2A7A4F";
    shirtCounter.style.fontWeight = shirtOver ? "bold" : "normal";
  }

  // עדכון מונה כובעים
  const hatCounter = document.getElementById("hat_counter");
  if (hatCounter) {
    const hatOver = hatCount > participants;
    hatCounter.textContent = "בחרת " + hatCount + " מתוך " + participants + " מותר";
    hatCounter.style.color = hatOver ? "#E24B4A" : "#2A7A4F";
    hatCounter.style.fontWeight = hatOver ? "bold" : "normal";
  }

  // חסום/שחרר כפתור המשך
  const nextBtn = document.getElementById("btn_step2_next");
  if (nextBtn) {
    const blocked = shirtCount > participants || hatCount > participants;
    nextBtn.disabled = blocked;
    nextBtn.style.opacity = blocked ? "0.5" : "1";
    nextBtn.title = blocked ? "יש להפחית כמות חולצות או כובעים" : "";
  }
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
    notes:              (document.getElementById("notes")     || {value:""}).value.trim(),
    participants:       document.getElementById("participants").value,
    guest2Name:         (document.getElementById("guest2Name") || {value:""}).value.trim(),
    guest2Id:           (document.getElementById("guest2Id")   || {value:""}).value.trim(),
    guest2Age:          (document.getElementById("guest2Age")  || {value:""}).value.trim(),
    guest3Name:         (document.getElementById("guest3Name") || {value:""}).value.trim(),
    guest3Id:           (document.getElementById("guest3Id")   || {value:""}).value.trim(),
    guest3Age:          (document.getElementById("guest3Age")  || {value:""}).value.trim(),
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
    // שלב 1 — בדיקת כפילות ת.ז דרך JSONP (מקבלים תגובה)
    const dupResult = await checkDuplicateJsonp(payload.idNumber);
    if (dupResult && dupResult.duplicate) {
      const msgEl = document.getElementById("submitMsg");
      if (msgEl) {
        msgEl.textContent = "תעודת זהות " + payload.idNumber + " כבר רשומה במערכת (" + dupResult.orderNumber + "). לא ניתן להירשם פעמיים.";
        msgEl.classList.remove("hidden");
      }
      if (activeBtn) { activeBtn.disabled = false; activeBtn.textContent = "נסה שוב"; }
      return;
    }

    // שלב 2 — שמירה
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

// ── שליחה ל-Google Sheets דרך POST + no-cors ───────────────
async function sendToSheet(payload) {
  const data = {
    action:             payload.action,
    firstName:          payload.firstName,
    lastName:           payload.lastName,
    idNumber:           payload.idNumber,
    age:                payload.age,
    phone:              payload.phone,
    email:              payload.email,
    city:               payload.city || "",
    street:             payload.street || "",
    houseNum:           payload.houseNum || "",
    zipCode:            payload.zipCode || "",
    notes:              payload.notes || "",
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
    timestamp:          payload.timestamp,
    guest2Name:         payload.guest2Name || "",
    guest2Id:           payload.guest2Id   || "",
    guest2Age:          payload.guest2Age  || "",
    guest3Name:         payload.guest3Name || "",
    guest3Id:           payload.guest3Id   || "",
    guest3Age:          payload.guest3Age  || "",
  };

  // שלח כ-POST עם text/plain (עובר no-cors בלי preflight)
  await fetch(CONFIG.SHEET_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "text/plain" },
    body:    JSON.stringify(data),
  });

  // no-cors לא מחזיר תגובה — מספר הזמנה מקומי
  const orderNumber = "BL-" + String(Date.now()).slice(-4);
  return orderNumber;
}

// ── בדיקת כפילות ת.ז דרך JSONP ─────────────────────────────
function checkDuplicateJsonp(idNumber) {
  return new Promise((resolve) => {
    const cbName = "dup_" + Date.now();
    const url    = CONFIG.SHEET_URL + "?action=checkDuplicate&idNumber=" + encodeURIComponent(idNumber) + "&callback=" + cbName;
    let script;

    window[cbName] = function(data) {
      delete window[cbName];
      if (script && script.parentNode) script.parentNode.removeChild(script);
      resolve(data);
    };

    script         = document.createElement("script");
    script.src     = url;
    script.onerror = () => {
      delete window[cbName];
      if (script && script.parentNode) script.parentNode.removeChild(script);
      resolve(null); // אם נכשל — ממשיך בלי בדיקה
    };

    setTimeout(() => {
      if (window[cbName]) {
        delete window[cbName];
        try { document.head.removeChild(script); } catch(e) {}
        resolve(null);
      }
    }, 5000);

    document.head.appendChild(script);
  });
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
    ${total > 0 ? `
    <div style="border:2px solid #E24B4A;border-radius:8px;padding:12px 16px;background:#FCEBEB;margin-bottom:14px;text-align:center;">
      <div style="font-size:15px;font-weight:bold;color:#A32D2D;margin-bottom:4px;">⚠️ יש להשלים תשלום ב-PayBox</div>
      <div style="font-size:13px;color:#A32D2D;">במידה ולא יתקבל תשלום — הפריטים לא יישמרו!</div>
    </div>` : ""}
    <div style="border:2px solid #0F6E56;border-radius:8px;padding:12px 16px;background:#EAF3DE;margin-bottom:14px;text-align:center;">
      <div style="font-size:14px;font-weight:bold;color:#0F6E56;margin-bottom:6px;">📱 הצטרף לקבוצת הוואטסאפ</div>
      <div style="font-size:12px;color:#555;margin-bottom:8px;">קבוצה שקטה של משתתפי האירוע</div>
      <a href="https://chat.whatsapp.com/KWmKgysyg9DC7amseoo4Y5" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;">הצטרף לקבוצה</a>
    </div>
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
