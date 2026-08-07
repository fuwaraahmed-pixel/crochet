/**
 * ============================================================================
 * Gift Dremoy Store — Google Apps Script Backend Engine
 * Project: Order Management System (Google Sheets API)
 * ============================================================================
 * 
 * Instructions:
 * 1. Open Google Sheet -> Extensions -> Apps Script.
 * 2. Paste this entire code into Code.gs.
 * 3. Run setupSheets() once to create all required sheets & headers automatically.
 * 4. Deploy as Web App -> Execute as: Me -> Who has access: Anyone.
 * 5. Copy the Web App URL for frontend API integration.
 */

// Global Sheet Names Constants
const SHEET_ORDERS = "Orders";
const SHEET_PRODUCTS = "Products";
const SHEET_REVIEWS = "Reviews";
const SHEET_FAQ = "FAQ";
const SHEET_SETTINGS = "Settings";

/**
 * Automatically creates all sheets with required headers if missing.
 * Run this function once from the Apps Script editor!
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = [
    {
      name: SHEET_ORDERS,
      headers: [
        "Tracking ID", "Order ID", "Date", "Customer Name", "Phone",
        "Address", "District", "Area", "Product Name", "Variant",
        "Quantity", "Unit Price", "Delivery Charge", "Total",
        "Payment Method", "Payment Status", "Courier", "Courier Tracking Number",
        "Order Status", "Admin Note", "Last Updated"
      ]
    },
    {
      name: SHEET_PRODUCTS,
      headers: ["Product ID", "Product Name", "Price", "Discount", "Stock", "Status", "Image"]
    },
    {
      name: SHEET_REVIEWS,
      headers: ["Customer", "Rating", "Review", "Photo", "Date"]
    },
    {
      name: SHEET_FAQ,
      headers: ["Question", "Answer", "Status"]
    },
    {
      name: SHEET_SETTINGS,
      headers: ["Business Name", "Phone", "WhatsApp", "Messenger", "Facebook", "Email", "Address", "Delivery Charge", "Offer Text", "Offer End Date"]
    }
  ];

  sheetsConfig.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.getRange(1, 1, 1, config.headers.length).setFontWeight("bold").setBackground("#F4ECE1");
      sheet.setFrozenRows(1);
    }
  });

  // Seed default settings if empty
  const settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.appendRow([
      "Dremoy Store",
      "+8801622536026",
      "8801622536026",
      "dremoy.store",
      "https://facebook.com/dremoy.store",
      "dremoyit@gmail.com",
      "Dhaka, Bangladesh",
      "80",
      "হাতে বোনা প্রতিটি পিস পরম আদরে তৈরি | ফ্রি গিফট বক্স ও মেমোরেবল কার্ড সহ সারাদেশে ডেলিভারি",
      "2026-12-31"
    ]);
  }

  Logger.log("All sheets and headers initialized successfully!");
}

/**
 * Handle GET Requests (Read Settings, Products, Reviews, FAQ, Track Order)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case "getSettings":
        return jsonResponse(getSettingsData());
      case "getProducts":
        return jsonResponse(getProductsData());
      case "getReviews":
        return jsonResponse(getReviewsData());
      case "getFAQ":
        return jsonResponse(getFAQData());
      case "trackOrder":
        return jsonResponse(trackOrderData(e.parameter.query));
      default:
        return jsonResponse({ status: "error", message: "Invalid action parameter" });
    }
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Handle POST Requests (Create Order)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Lock for up to 10 seconds to prevent concurrent tracking ID collisions
  if (!lock.tryLock(10000)) {
    return jsonResponse({ status: "error", message: "Server busy. Please try again." });
  }

  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;

    if (action === "createOrder") {
      const orderResult = processCreateOrder(contents.data);
      return jsonResponse(orderResult);
    } else {
      return jsonResponse({ status: "error", message: "Unsupported POST action" });
    }
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Process New Order Creation & Unique Tracking ID Generator (DRM000001)
 */
function processCreateOrder(data) {
  if (!data.name || !data.phone || !data.address || !data.productName) {
    return { status: "error", message: "Missing required order fields." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  const rows = sheet.getDataRange().getValues();
  
  // Anti-Spam / Anti-Duplicate check: Same phone & product within 2 minutes
  const now = new Date();
  for (let i = rows.length - 1; i >= 1; i--) {
    const rowPhone = String(rows[i][4]).trim();
    const rowProd = String(rows[i][8]).trim();
    const rowDate = new Date(rows[i][2]);
    if (rowPhone === String(data.phone).trim() && rowProd === String(data.productName).trim()) {
      const diffMinutes = (now - rowDate) / (1000 * 60);
      if (diffMinutes < 2) {
        return { status: "error", message: "একটি অর্ডার ইতিমধ্যেই প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে ২ মিনিট পর পুনরায় চেষ্টা করুন।" };
      }
    }
  }

  // Tracking ID Generator (DRM000001 Format)
  const nextSeq = rows.length; // Row count minus header + 1
  const trackingId = "DRM" + String(nextSeq).padStart(6, "0");
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const formattedDate = Utilities.formatDate(now, "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");

  const quantity = parseInt(data.quantity) || 1;
  const unitPrice = parseFloat(data.unitPrice) || 0;
  const deliveryCharge = parseFloat(data.deliveryCharge) || 80;
  const total = (quantity * unitPrice) + deliveryCharge;

  const newRow = [
    trackingId,
    orderId,
    formattedDate,
    sanitizeInput(data.name),
    sanitizeInput(data.phone),
    sanitizeInput(data.address),
    sanitizeInput(data.district || "Dhaka"),
    sanitizeInput(data.area || ""),
    sanitizeInput(data.productName),
    sanitizeInput(data.variant || "Standard"),
    quantity,
    unitPrice,
    deliveryCharge,
    total,
    sanitizeInput(data.paymentMethod || "Cash on Delivery"),
    "Unpaid",
    "Steadfast / Pathao",
    "", // Courier Tracking Number
    "Pending", // Initial Order Status
    sanitizeInput(data.note || ""),
    formattedDate
  ];

  sheet.appendRow(newRow);

  return {
    status: "success",
    message: "অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!",
    trackingId: trackingId,
    orderId: orderId,
    total: total
  };
}

/**
 * Track Order Handler (Search by Tracking ID or Phone Number)
 */
function trackOrderData(query) {
  if (!query) return { status: "error", message: "Please provide a tracking ID or phone number." };

  const cleanQuery = String(query).trim().toLowerCase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ORDERS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { status: "error", message: "কোনো অর্ডার পাওয়া যায়নি।" };

  const matchedOrders = [];
  // Search backwards for most recent orders first
  for (let i = rows.length - 1; i >= 1; i--) {
    const trackingId = String(rows[i][0]).trim().toLowerCase();
    const phone = String(rows[i][4]).trim().toLowerCase();

    if (trackingId === cleanQuery || phone.includes(cleanQuery)) {
      matchedOrders.push({
        trackingId: rows[i][0],
        orderId: rows[i][1],
        date: rows[i][2],
        customerName: maskName(rows[i][3]),
        productName: rows[i][8],
        variant: rows[i][9],
        quantity: rows[i][10],
        total: rows[i][13],
        courier: rows[i][16],
        courierTrackingNo: rows[i][17] || "N/A",
        status: rows[i][18],
        adminNote: rows[i][19] || "",
        lastUpdated: rows[i][20],
        timeline: generateTimeline(rows[i][18], rows[i][2])
      });
    }
  }

  if (matchedOrders.length === 0) {
    return { status: "error", message: "প্রদত্ত ট্র্যাকিং আইডি বা মোবাইল নম্বরে কোনো অর্ডার পাওয়া যায়নি।" };
  }

  return { status: "success", orders: matchedOrders };
}

/**
 * Helper: Generate Order Progress Timeline
 */
function generateTimeline(currentStatus, orderDate) {
  const steps = ["Pending", "Confirmed", "Processing", "Packaging", "Shipped", "Out For Delivery", "Delivered"];
  const currentIdx = steps.indexOf(currentStatus);

  return steps.map((step, idx) => ({
    step: step,
    label: getStatusLabel(step),
    completed: idx <= currentIdx && currentStatus !== "Cancelled",
    current: step === currentStatus,
    timestamp: idx === 0 ? orderDate : (idx <= currentIdx ? "সম্পন্ন" : "অপেক্ষমাণ")
  }));
}

function getStatusLabel(status) {
  const map = {
    "Pending": "অর্ডার গৃহীত হয়েছে",
    "Confirmed": "অর্ডার কনফার্মড",
    "Processing": "প্রস্তুতি চলছে (হাতে বোনা)",
    "Packaging": "প্যাকিং সম্পন্ন",
    "Shipped": "কুরিয়ারে হস্তান্তরিত",
    "Out For Delivery": "ডেলিভারির জন্য বের হয়েছে",
    "Delivered": "সফলভাবে ডেলিভার্ড",
    "Cancelled": "বাতিলকৃত"
  };
  return map[status] || status;
}

function getSettingsData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "error", message: "Settings not configured." };
  const r = data[1];
  return {
    status: "success",
    settings: {
      businessName: r[0],
      phone: r[1],
      whatsapp: r[2],
      messenger: r[3],
      facebook: r[4],
      email: r[5],
      address: r[6],
      deliveryCharge: r[7],
      offerText: r[8],
      offerEndDate: r[9]
    }
  };
}

function getProductsData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][5]).toLowerCase() === "active" || rows[i][5] === true) {
      products.push({
        id: rows[i][0],
        name: rows[i][1],
        price: rows[i][2],
        discount: rows[i][3],
        stock: rows[i][4],
        image: rows[i][6]
      });
    }
  }
  return { status: "success", products: products };
}

function getReviewsData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REVIEWS);
  const rows = sheet.getDataRange().getValues();
  const reviews = [];
  for (let i = 1; i < rows.length; i++) {
    reviews.push({ customer: rows[i][0], rating: rows[i][1], review: rows[i][2], photo: rows[i][3], date: rows[i][4] });
  }
  return { status: "success", reviews: reviews };
}

function getFAQData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FAQ);
  const rows = sheet.getDataRange().getValues();
  const faqs = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === "active" || rows[i][2] === true) {
      faqs.push({ question: rows[i][0], answer: rows[i][1] });
    }
  }
  return { status: "success", faqs: faqs };
}

// Helpers
function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>?/gm, "").trim();
}

function maskName(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts.map(p => p.length > 2 ? p[0] + "***" + p[p.length - 1] : p[0] + "*").join(" ");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
