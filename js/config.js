// ─────────────────────────────────────────────────────────────
//  config.js  —  חותרים כברק 2026
//  שנה רק את SHEET_URL לאחר הגדרת Google Apps Script
// ─────────────────────────────────────────────────────────────

const CONFIG = {

  // ► שנה לכתובת ה-Apps Script Web App שלך (ראה SETUP.md)
SHEET_URL: "https://script.google.com/macros/s/AKfycbzKga2nD_JaLvt_GyZ7CfKE5_D7biwV4oN4fhJBgc1CM9jDAQ7PxT1FC7w-dFZ8T_rI/exec",
  
  // ► קישור ל-PayBox האישי שלך
  PAYBOX_URL: "https://www.payboxapp.com/",

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
    { id: "kayak_single", label: "קייאק יחיד", image: "kayak_single", photo: "images/kayak_single.jpg" },
    { id: "sup_single",   label: "סאפ יחיד",   image: "sup_single",   photo: "images/sup_single.jpg"   },
    { id: "kayak_double", label: "קייאק זוגי", image: "kayak_double", photo: "images/kayak_double.jpg" },
  ],

  // מידות חולצה
  SHIRT_SIZES: ["S", "M", "L", "XL", "XXL"],
};
