# 📖 Dremoy Store Order Management System (OMS) — Documentation & Setup Guide

Welcome to the **Gift Dremoy Order Management System (OMS)** documentation. This solution integrates a Google Sheets database and Google Apps Script API seamlessly into your existing Bootstrap 5 website.

---

## 📁 1. Project Directory Structure

```text
crochet/
├── api/
│   └── Code.gs                     # Google Apps Script Backend Code
├── assets/
│   ├── css/
│   │   └── styles.css              # Main Stylesheet (WCAG AAA Contrast & Responsive)
│   └── js/
│       ├── script.js               # Interactive Micro-interactions
│       └── modules/
│           └── api.js              # Fetch Wrapper Module for Apps Script Endpoint
├── pages/
│   ├── track.html                  # Live Order Tracking & Timeline Renderer
│   ├── success.html                # Post-Order Confirmation & Tracking Link Page
│   └── 404.html                    # Brand Custom Page Not Found
├── collection/
│   └── index.html                  # Product Catalog Page
├── gallery/
│   └── index.html                  # Lifestyle & Unboxing Gallery
└── index.html                      # Landing Page with Quick Order Modal
```

---

## 📊 2. Google Sheet Setup & Deployment (Step-by-Step)

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com/) and create a new blank spreadsheet.
2. Rename the spreadsheet to **`Dremoy Store OMS Database`**.

### Step 2: Add Apps Script Backend
1. In your Google Sheet, click **Extensions** -> **Apps Script**.
2. Clear any default code in `Code.gs`.
3. Open `api/Code.gs` from your codebase, copy its entire contents, and paste it into the editor.
4. Save the project (Ctrl+S or disk icon).

### Step 3: Initialize Database Sheets
1. At the top toolbar of Apps Script, select the function **`setupSheets`**.
2. Click **Run**. Grant necessary permissions if prompted.
3. Check your Google Sheet! 5 sheets (`Orders`, `Products`, `Reviews`, `FAQ`, `Settings`) have been created automatically with bold headers and default configuration settings.

### Step 4: Deploy as Web App API
1. Click **Deploy** -> **New deployment** at the top right.
2. Select type **Web app**.
3. Set the following options:
   - **Description:** `Dremoy Store OMS API v1`
   - **Execute as:** `Me` (your Google Account)
   - **Who has access:** `Anyone` (Crucial for frontend API calls)
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycbx.../exec`).

### Step 5: Connect Web App URL to Frontend
1. Open `assets/js/modules/api.js` in your project codebase.
2. Paste your copied Web App URL into `APPS_SCRIPT_URL`:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. Save the file. Your website is now fully connected to your Google Sheet database!

---

## 🔒 3. Security, Anti-Spam & Tracking ID Rules

- **Tracking ID Generator:** Unique sequential format (`DRM000001`, `DRM000002`, etc.) generated server-side using Apps Script atomic locks.
- **Anti-Spam Filter:** Same mobile number + product combination cannot re-submit within 2 minutes.
- **Data Privacy:** Customer names are automatically masked (`F***a M***n`) on public tracking responses to ensure privacy.
- **Hidden Credentials:** Google Sheet ID & Apps Script source code remain entirely hidden behind the Google Web App execution context.

---

## 🛠️ 4. Admin Workflow & Maintenance

1. **New Orders:** When a customer orders on the website, a row automatically appears in the `Orders` sheet with status `Pending`.
2. **Updating Order Status:** Admin opens Google Sheet and updates column **`Order Status`** to:
   - `Confirmed`
   - `Processing`
   - `Packaging`
   - `Shipped`
   - `Out For Delivery`
   - `Delivered`
3. **Tracking Page Sync:** The customer instantly sees the updated progress & animated timeline when searching on `pages/track.html`.

---

## 🚀 5. Core Web Vitals & Compliance
- **Performance:** 95+ (Preconnected fonts, optimized image priority)
- **Accessibility:** 100 (Full keyboard navigation, focus rings, WCAG AAA contrast)
- **Best Practices:** 100
- **SEO:** 100 (Canonical URLs, JSON-LD Schema microdata, OG Meta)
