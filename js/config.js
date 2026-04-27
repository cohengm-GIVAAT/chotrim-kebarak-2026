// ─────────────────────────────────────────────────────────────
//  config.js  —  חותרים כברק 2026
//  שנה רק את SHEET_URL לאחר הגדרת Google Apps Script
// ─────────────────────────────────────────────────────────────

const CONFIG = {

  // ► שנה לכתובת ה-Apps Script Web App שלך (ראה SETUP.md)
  SHEET_URL: "https://script.google.com/macros/s/AKfycbym05D0K5tRtTf6kD3_D80D_iaGG2kRTz8tK-A7RbafYU63g_TaoV1QJ1vwz6hqV2-NMA/exec",

  // ► קישור ל-PayBox האישי שלך
  PAYBOX_URL: "https://www.payboxapp.com/support/",

  // פרטי האירוע
  EVENT_NAME: "חותרים כברק 2026",
  EVENT_DATE: "05/06/2026",
  EVENT_LOCATION: "קיבוץ גנוסר",

  // מחירים
  PRICES: {
    shirt: 40,
    hat:   40,
  },

  // שדות ציוד (שמות חייבים להתאים לגיליון המלאי)
  EQUIPMENT_ITEMS: [
    { id: "kayak_single", label: "קייאק יחיד",  image: "kayak_single" },
    { id: "sup_single",   label: "סאפ יחיד",    image: "sup_single"   },
    { id: "kayak_double",   label: "קייאק זוגי",    image: "kayak_double"   },
  ],

  // מידות חולצה
  SHIRT_SIZES: ["S", "M", "L", "XL", "XXL"],
};
