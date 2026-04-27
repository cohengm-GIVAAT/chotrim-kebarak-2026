# מדריך הפעלה — חותרים כברק 2026
## ~15 דקות מהורדה לאוויר

---

## סקירה כללית

```
קבצי האפליקציה  →  GitHub Pages  →  חותרים פותחים קישור
                         ↕
                   Google Sheets  ←  נתונים + מלאי
                         ↕
                   מנהל פותח admin/
```

---

## שלב 1 — Google Sheets (בסיס הנתונים)

1. פתח **drive.google.com**
2. העלה את **`חותרים_כברק_2026_מלאי_ונרשמים.xlsx`**
3. לחץ עליו ימני → **"פתח עם" → "Google Sheets"**
4. לחץ **"שדרוג"** (כפתור כחול למעלה) — חשוב!
5. ודא שיש שני גיליונות בתחתית: **נרשמים** ו-**מלאי**

---

## שלב 2 — Apps Script (הגב המחובר)

1. בתוך Google Sheets: תפריט → **הרחבות → Apps Script**
2. מחק את כל הטקסט הקיים
3. פתח את **`google_apps_script.js`** מהתיקייה → העתק-הדבק
4. שנה שורה 9 לקישור PayBox שלך:
   ```
   const PAYBOX_URL = "https://payboxapp.page.link/YOUR_LINK";
   ```
5. שמור (Ctrl+S) → תן שם: "חותרים כברק"

**פרסום כ-Web App:**
1. לחץ **Deploy → New deployment**
2. לחץ גלגל שיניים → בחר **Web app**
3. מלא:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. לחץ **Deploy** → אשר הרשאות
5. **העתק את ה-Web App URL** (נראה כך):
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## שלב 3 — עדכן config.js

פתח את **`js/config.js`** בעורך טקסט (Notepad / VS Code):

```javascript
SHEET_URL:  "https://script.google.com/macros/s/AKfycb.../exec",
PAYBOX_URL: "https://payboxapp.page.link/YOUR_LINK",
```

שמור את הקובץ.

---

## שלב 4 — GitHub Pages (אחסון האפליקציה)

> ⚠️ Google Drive לא מריץ HTML — חייב שרת אמיתי. GitHub Pages חינמי לחלוטין.

**4א — פתח חשבון GitHub**
- כנס ל-**github.com** → Sign up (חינמי)

**4ב — צור Repository**
- לחץ **"New"** (כפתור ירוק)
- שם: `chotrim-kebarak-2026`
- סמן: **Public**
- לחץ **"Create repository"**

**4ג — העלה קבצים**
- לחץ **"uploading an existing file"**
- גרור את **כל תוכן התיקייה** `chotrim_kebarak`
  (את הקבצים שבתוך התיקייה — לא את התיקייה עצמה)
- לחץ **"Commit changes"**

**4ד — הפעל GitHub Pages**
- לחץ **Settings** (למעלה)
- בתפריט שמאל: **Pages**
- Source: **Deploy from a branch**
- Branch: **main** → לחץ **Save**
- המתן ~1 דקה

**4ה — קבל קישורים**

| מה | קישור |
|---|---|
| טופס לחותרים | `https://USERNAME.github.io/chotrim-kebarak-2026/` |
| לוח ניהול | `https://USERNAME.github.io/chotrim-kebarak-2026/admin/` |

---

## שלב 5 — הצהרת בריאות (PDF)

1. העלה את **`הצהרת_בריאות-מחתר-2026.pdf`** ל-GitHub
   (לאותו repository, שנה שם ל-**`health_declaration.pdf`**)
2. או: העלה ל-Google Drive → שתף → "כל מי שיש לו קישור"
   ועדכן את הקישור ב-`index.html`:
   ```html
   <a href="https://drive.google.com/file/d/YOUR_ID/view" ...>
   ```

---

## בדיקה שהכל עובד

1. פתח את קישור הטופס בדפדפן
2. מלא טופס דמה → שלח
3. בדוק ב-Google Sheets שנוספה שורה בגיליון **נרשמים**
4. בדוק שהגיע מייל אישור

---

## פתרון תקלות

| תופעה | פתרון |
|---|---|
| "שגיאה בשליחה" | ודא SHEET_URL נכון ב-config.js |
| לא מגיע מייל | הרץ `sendConfirmationEmail` ידנית ב-Apps Script לאישור הרשאות |
| מלאי לא נטען | ודא שהגיליון נקרא בדיוק "מלאי" |
| תמונות לא מופיעות | ודא שתיקיית `images/` הועלתה ל-GitHub |
| הצהרת בריאות לא נפתחת | ודא ששם הקובץ הוא `health_declaration.pdf` |
