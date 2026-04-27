// ════════════════════════════════════════════════════════════════
//  Google Apps Script — חותרים כברק 2026
//  הדבק קוד זה ב: script.google.com → New Project
//  לאחר מכן: Deploy → New deployment → Web app
// ════════════════════════════════════════════════════════════════

// ── הגדרות ───────────────────────────────────────────────────
const SHEET_ID      = SpreadsheetApp.getActiveSpreadsheet().getId();
const REG_SHEET     = "נרשמים";
const INV_SHEET     = "מלאי";
const EMAIL_FROM    = "חותרים כברק 2026";
const PAYBOX_URL    = "https://www.payboxapp.com/"; // ← שנה!

// ── GET: מידע לאפליקציה ──────────────────────────────────────
function doGet(e) {
  const action   = e.parameter.action || "inventory";
  const callback = e.parameter.callback; // JSONP support
  let result;

  if (action === "submit") {
    // קבלת הרשמה דרך GET (JSONP)
    result = saveRegistration(e.parameter);
  } else if (action === "inventory") {
    result = getInventory();
  } else if (action === "admin") {
    result = { rows: getRegistrations(), inventory: getInventory() };
  } else {
    result = { error: "unknown action" };
  }

  const json = JSON.stringify(result);

  // אם נשלח callback — מחזירים JSONP
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST: קבלת הגשות ─────────────────────────────────────────
function doPost(e) {
  const data   = JSON.parse(e.postData.contents);
  const action = data.action || "submit";
  let result;

  if (action === "submit") {
    result = saveRegistration(data);
  } else if (action === "update") {
    result = updateRow(data.row);
  } else {
    result = { status: "error", message: "unknown action" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── שמירת הרשמה חדשה ─────────────────────────────────────────
function saveRegistration(d) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);

  // מספר הזמנה: BL-XXXX
  const lastRow     = sheet.getLastRow();
  const orderNumber = "BL-" + String(lastRow).padStart(4, "0");

  const row = [
    orderNumber,
    d.firstName, d.lastName, d.idNumber, d.age,
    d.phone, d.email,
    `${d.street||""} ${d.houseNum||""} ${d.city||""} ${d.zipCode||""}`.trim(),
    d.participants,
    d.equip_kayak_single || 0,
    d.equip_sup_single   || 0,
    d.equip_kayak_double   || 0,
    d.shirt_S   || 0,
    d.shirt_M   || 0,
    d.shirt_L   || 0,
    d.shirt_XL  || 0,
    d.shirt_XXL || 0,
    d.hat_qty   || 0,
    d.total     || 0,
    d.payMethod === "paybox" ? "ממתין — PayBox" : "ממתין — העברה",
    d.health    || "נחתם",
    new Date().toLocaleString("he-IL"),
  ];

  sheet.appendRow(row);

  // שלח מייל אישור לנרשם
  sendConfirmationEmail(d, orderNumber);

  return { status: "ok", orderNumber };
}

// ── עדכון סטטוס שורה קיימת ───────────────────────────────────
function updateRow(row) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === row.orderNumber) {
      sheet.getRange(i + 1, 20).setValue(row.payStatus); // עמודה T
      sheet.getRange(i + 1, 21).setValue(row.health);    // עמודה U
      return { status: "ok" };
    }
  }
  return { status: "error", message: "row not found" };
}

// ── קריאת נרשמים ─────────────────────────────────────────────
function getRegistrations() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);
  if (!sheet) return [];
  const rows  = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const keys = [
    "orderNumber","firstName","lastName","idNumber","age",
    "phone","email","address","participants",
    "equip_kayak_single","equip_sup_single","equip_kayak_double",
    "shirt_S","shirt_M","shirt_L","shirt_XL","shirt_XXL",
    "hat_qty","total","payStatus","health","timestamp"
  ];

  return rows.slice(1).filter(r => r[0]).map(r =>
    Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""]))
  );
}

// ── קריאת מלאי ───────────────────────────────────────────────
function getInventory() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(INV_SHEET);
  if (!sheet) return {};

  const rows = sheet.getDataRange().getValues();
  const inv  = {};

  // מפת שמות פריטים → מפתח
  const keyMap = {
    "קייאק יחיד": "kayak_single",
    "סאפ יחיד":   "sup_single",
    "קייאק זוגי": "kayak_double",
    "חולצה S":    "shirt_s",
    "חולצה M":    "shirt_m",
    "חולצה L":    "shirt_l",
    "חולצה XL":   "shirt_xl",
    "חולצה XXL":  "shirt_xxl",
    "כובע":       "hat",
  };

  rows.forEach(r => {
    const name = String(r[0]).trim();
    const key  = keyMap[name];
    if (!key) return;
    inv[key]            = Number(r[3]) || 0;   // עמודה D = נותר
    inv[key + "_init"]  = Number(r[1]) || 0;   // עמודה B = התחלתי
  });

  return inv;
}

// ── מייל אישור ───────────────────────────────────────────────
function sendConfirmationEmail(d, orderNumber) {
  const to      = d.email;
  const subject = `אישור הרשמה — חותרים כברק 2026 | ${orderNumber}`;

  const shirtList = ["S","M","L","XL","XXL"]
    .filter(sz => (d["shirt_"+sz]||0) > 0)
    .map(sz => `${sz}×${d["shirt_"+sz]}`)
    .join(", ");

  const equipList = [
    d.equip_kayak_single > 0 ? `קייאק יחיד ×${d.equip_kayak_single}` : "",
    d.equip_sup_single   > 0 ? `סאפ יחיד ×${d.equip_sup_single}`   : "",
    d.equip_kayak_double   > 0 ? `קייאק זוגי ×${d.equip_kayak_double}`   : "",
  ].filter(Boolean).join(", ");

  const body = `
שלום ${d.firstName},

הרשמתך לאירוע חותרים כברק 2026 התקבלה בהצלחה!

━━━━━━━━━━━━━━━━━━━━━━
פרטי הרישום שלך:
━━━━━━━━━━━━━━━━━━━━━━
מספר הזמנה:   ${orderNumber}
שם מלא:        ${d.firstName} ${d.lastName}
מספר משתתפים: ${d.participants}
תאריך אירוע:  05/06/2026 | קיבוץ גנוסר

ציוד:    ${equipList || "—"}
חולצות:  ${shirtList || "—"}
כובעים:  ${d.hat_qty > 0 ? "×"+d.hat_qty : "—"}

סה"כ לתשלום: ₪${d.total}
אמצעי תשלום: ${d.payMethod === "paybox" ? "PayBox" : "העברה בנקאית"}
━━━━━━━━━━━━━━━━━━━━━━

${d.payMethod === "paybox"
  ? `לסיום התשלום לחץ/י כאן:\n${PAYBOX_URL}`
  : `להעברה בנקאית — פרטי חשבון ישלחו בנפרד.`}

הצהרת הבריאות נחתמה ✓

נתראה על המים!
צוות חותרים כברק
`;

  GmailApp.sendEmail(to, subject, body, { name: EMAIL_FROM });
}
