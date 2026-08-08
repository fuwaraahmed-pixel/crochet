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
      headers: ["Product ID", "Product Name", "Description", "Category", "Price", "Discount", "Stock", "Status", "Image"]
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
    } else {
      sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]).setFontWeight("bold").setBackground("#F4ECE1");
    }
  });

  // Seed default products if empty
  const productsSheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (productsSheet && productsSheet.getLastRow() === 1) {
    const initialProducts = [
      ["PRD001", "Heart Crochet Bag Tag", 450, 0, 50, "Active", "assets/images/crochet-bag-tag.webp"],
      ["PRD002", "Double Calla Lily Charm", 950, 0, 30, "Active", "assets/images/crochet-flower-wall.webp"],
      ["PRD003", "Serene Sleeping Kitty Keychain", 550, 0, 40, "Active", "assets/images/sleeping-cat-keychain.webp"],
      ["PRD004", "Sleeping Kitty Bag Charm", 650, 0, 35, "Active", "assets/images/sleeping-cat-keychain.webp"],
      ["PRD005", "Pink Calla Car Mirror Pendant", 850, 0, 25, "Active", "assets/images/pink-calla-pendant.webp"],
      ["PRD006", "Kawaii Sleeping Bunny Charm", 600, 0, 45, "Active", "assets/images/sleeping-bunny-charm.webp"],
      ["PRD007", "Bloom Lily Mini Desk Accent", 750, 0, 20, "Active", "assets/images/crochet-flower-wall.webp"],
      ["PRD008", "Workshop Edition Calla Pendant", 1150, 0, 15, "Active", "assets/images/pink-calla-pendant.webp"]
    ];
    initialProducts.forEach(prod => productsSheet.appendRow(prod));

    // Data validation for Status column (Column F)
    const productStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Active", "Inactive"], true)
      .setAllowInvalid(true)
      .build();
    productsSheet.getRange("F2:F500").setDataValidation(productStatusRule);
  }

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
      "60",
      "হাতে বোনা প্রতিটি পিস পরম আদরে তৈরি | ফ্রি গিফট বক্স ও মেমোরেবল কার্ড সহ সারাদেশে ডেলিভারি",
      "2026-12-31"
    ]);
  }

  // Set Data Validation (Dropdown Menu) for Order Status (Column S - 19th Column)
  const ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  if (ordersSheet) {
    const statusOptions = [
      "Pending",
      "Confirmed",
      "Processing",
      "Packaging",
      "Shipped",
      "Out For Delivery",
      "Delivered",
      "Cancelled"
    ];
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(statusOptions, true)
      .setAllowInvalid(true)
      .build();
    ordersSheet.getRange("S2:S2000").setDataValidation(rule);
  }

  Logger.log("All sheets, headers, and dropdown validations initialized successfully!");
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
    const rowPhone = String(rows[i][4] || "").trim();
    const rowProd = String(rows[i][8] || "").trim();
    const rowDate = new Date(rows[i][2]);
    if (rowPhone === String(data.phone).trim() && rowProd === String(data.productName).trim()) {
      const diffMinutes = (now - rowDate) / (1000 * 60);
      if (diffMinutes < 2) {
        return { status: "error", message: "একটি অর্ডার ইতিমধ্যেই প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে ২ মিনিট পর পুনরায় চেষ্টা করুন。" };
      }
    }
  }

  // Count existing valid DRM orders & find first empty slot row
  let validOrderCount = 0;
  let targetRow = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowTrackingId = String(rows[i][0] || "").trim();
    if (rowTrackingId !== "") {
      validOrderCount++;
    } else if (targetRow === 0) {
      targetRow = i + 1; // 1-indexed sheet row number
    }
  }

  if (targetRow === 0) {
    targetRow = rows.length + 1;
  }

  // Tracking ID Generator (DRM000001 Format)
  const trackingId = "DRM" + String(validOrderCount + 1).padStart(6, "0");
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const formattedDate = Utilities.formatDate(now, "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");

  const quantity = parseInt(data.quantity) || 1;
  const unitPrice = parseFloat(data.unitPrice) || 600;
  const deliveryCharge = parseFloat(data.deliveryCharge) || (data.district && String(data.district).toLowerCase().includes("outside") ? 120 : 60);
  const total = (quantity * unitPrice) + deliveryCharge;
  const advancePaid = parseFloat(data.advancePaid) || 0;

  let paymentStatus = "Unpaid";
  if (advancePaid >= total && total > 0) {
    paymentStatus = "Paid";
  } else if (advancePaid > 0) {
    paymentStatus = "Partial (" + advancePaid + " Advance)";
  }

  const newRow = [
    trackingId,                                     // Col A (0): Tracking ID
    orderId,                                        // Col B (1): Order ID
    formattedDate,                                  // Col C (2): Date
    sanitizeInput(data.name),                       // Col D (3): Customer Name
    sanitizeInput(data.phone),                      // Col E (4): Phone
    sanitizeInput(data.address),                    // Col F (5): Address
    sanitizeInput(data.district || "Dhaka"),        // Col G (6): District
    sanitizeInput(data.area || ""),                 // Col H (7): Area
    sanitizeInput(data.productName),                // Col I (8): Product Name
    sanitizeInput(data.variant || "Standard"),      // Col J (9): Variant
    quantity,                                       // Col K (10): Quantity
    unitPrice,                                      // Col L (11): Unit Price
    deliveryCharge,                                 // Col M (12): Delivery Charge
    total,                                          // Col N (13): Total
    sanitizeInput(data.paymentMethod || "Cash on Delivery"), // Col O (14): Payment Method
    paymentStatus,                                  // Col P (15): Payment Status
    "Steadfast / Pathao",                           // Col Q (16): Courier
    "",                                             // Col R (17): Courier Tracking Number
    "Pending",                                      // Col S (18): Order Status
    sanitizeInput(data.note || ""),                 // Col T (19): Admin Note
    formattedDate                                   // Col U (20): Last Updated
  ];

  // Insert exactly into first empty row
  sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);

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
  const normalizePhone = function(num) {
    return String(num || "").replace(/\D/g, "").replace(/^880/, "0").replace(/^88/, "").replace(/^0+/, "");
  };
  const normQuery = normalizePhone(cleanQuery);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ORDERS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { status: "error", message: "কোনো অর্ডার পাওয়া যায়নি।" };

  const matchedOrders = [];
  // Search backwards for most recent orders first
  for (let i = rows.length - 1; i >= 1; i--) {
    const trackingId = String(rows[i][0] || "").trim().toLowerCase();
    const rawPhone = String(rows[i][4] || "").trim();
    const normPhone = normalizePhone(rawPhone);

    // Skip empty rows where tracking ID and phone are both empty
    if (!rows[i][0] && !rows[i][4]) continue;

    const isTrackingMatch = trackingId !== "" && trackingId === cleanQuery;
    const isPhoneMatch = normPhone !== "" && normQuery !== "" && normQuery.length >= 6 && (normPhone.includes(normQuery) || normQuery === normPhone);

    if (isTrackingMatch || isPhoneMatch) {
      const quantityVal = parseFloat(rows[i][10]) || 1;
      const unitPriceVal = parseFloat(rows[i][11]) || 600;
      const deliveryChargeVal = parseFloat(rows[i][12]) || 60;
      const totalVal = parseFloat(rows[i][13]) || ((quantityVal * unitPriceVal) + deliveryChargeVal);
      const paymentStatusStr = String(rows[i][15] || "").trim();

      // Extract advance paid if recorded in Payment Status e.g. "Partial (80 Advance)" or "80 Advance"
      let advancePaidVal = 0;
      if (paymentStatusStr.toLowerCase().includes("paid") && !paymentStatusStr.toLowerCase().includes("partial")) {
        advancePaidVal = totalVal;
      } else {
        const match = paymentStatusStr.match(/(\d+)/);
        if (match) advancePaidVal = parseFloat(match[1]);
      }
      const dueVal = totalVal - advancePaidVal;

      matchedOrders.push({
        trackingId: rows[i][0],
        orderId: rows[i][1],
        date: rows[i][2],
        customerName: maskName(rows[i][3]),
        productName: rows[i][8],
        variant: rows[i][9],
        quantity: quantityVal,
        unitPrice: unitPriceVal,
        deliveryCharge: deliveryChargeVal,
        total: totalVal,
        advancePaid: advancePaidVal,
        dueAmount: dueVal,
        paymentMethod: rows[i][14] || "Cash on Delivery",
        paymentStatus: paymentStatusStr || "Unpaid",
        courier: rows[i][16] || "Steadfast / Pathao",
        courierTrackingNo: rows[i][17] || "N/A",
        status: getStatusLabel(rows[i][18]),
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
  const normalizedStatus = normalizeStatusKey(currentStatus);
  const currentIdx = steps.indexOf(normalizedStatus);

  const statusMessages = {
    "Pending": "আপনার ভালোবাসা আমাদের কাছে পৌঁছেছে।",
    "Confirmed": "চিন্তা নেই, আপনার উপহারটি আমাদের যত্নে আছে।",
    "Processing": "ভালোবাসা দিয়ে আপনার উপহারটি তৈরি হচ্ছে।",
    "Packaging": "ভালোবাসা সুন্দর করে গুছিয়ে দেওয়া হয়েছে।",
    "Shipped": "আপনার উপহারটি এখন আপনারই পথে।",
    "Out For Delivery": "আজই হয়তো আপনার দরজায় কড়া নাড়বে।",
    "Delivered": "একটি উপহার পৌঁছাল, একটি হাসি ফুটল।",
    "Cancelled": "এইবার হয়নি, তবে ভালোবাসা থেমে নেই।"
  };

  return steps.map((step, idx) => {
    const isCompleted = currentIdx !== -1 && idx <= currentIdx && normalizedStatus !== "Cancelled";
    const isCurrent = step === normalizedStatus;
    const msg = statusMessages[step] || "";

    let timestampText = "অপেক্ষমাণ";
    if (idx === 0) {
      timestampText = `${msg} (${orderDate})`;
    } else if (isCompleted) {
      timestampText = msg;
    }

    return {
      step: step,
      label: getStatusLabel(step),
      completed: isCompleted,
      current: isCurrent,
      timestamp: timestampText
    };
  });
}

function normalizeStatusKey(status) {
  if (!status) return "Pending";
  const str = String(status).trim().toLowerCase();
  
  if (str === "pending" || str.includes("গৃহীত")) return "Pending";
  if (str === "confirmed" || str.includes("কনফার্মড") || str.includes("কনফার্ম")) return "Confirmed";
  if (str === "processing" || str.includes("প্রস্তুতি")) return "Processing";
  if (str === "packaging" || str.includes("প্যাকিং")) return "Packaging";
  if (str === "shipped" || str.includes("কুরিয়ারে") || str.includes("শিপড")) return "Shipped";
  if (str === "out for delivery" || str.includes("ডেলিভারির জন্য") || str.includes("ডেলিভারি")) return "Out For Delivery";
  if (str === "delivered" || str.includes("ডেলিভার্ড") || str.includes("ডেলিভারড")) return "Delivered";
  if (str === "cancelled" || str.includes("বাতিল")) return "Cancelled";
  
  return status;
}

function getStatusLabel(status) {
  const key = normalizeStatusKey(status);
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
  return map[key] || status;
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
    const statusVal = String(rows[i][7] || "").toLowerCase();
    if (statusVal === "active" || rows[i][7] === true) {
      products.push({
        id: rows[i][0],                 // Col A (0): Product ID
        name: rows[i][1],               // Col B (1): Product Name
        description: rows[i][2] || "",  // Col C (2): Description
        category: rows[i][3] || "",     // Col D (3): Category
        price: rows[i][4],              // Col E (4): Price
        discount: rows[i][5],           // Col F (5): Discount
        stock: rows[i][6],              // Col G (6): Stock
        status: rows[i][7],             // Col H (7): Status
        image: rows[i][8]               // Col I (8): Image
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

/**
 * Auto-populate all 8 real website products into the Products sheet
 * Run this function once from Apps Script editor!
 */
function populateProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!sheet) return;

  const initialProducts = [
    ["PRD001", "Heart Crochet Bag Tag", 450, 0, 50, "Active", "assets/images/crochet-bag-tag.webp"],
    ["PRD002", "Double Calla Lily Charm", 950, 0, 30, "Active", "assets/images/crochet-flower-wall.webp"],
    ["PRD003", "Serene Sleeping Kitty Keychain", 550, 0, 40, "Active", "assets/images/sleeping-cat-keychain.webp"],
    ["PRD004", "Sleeping Kitty Bag Charm", 650, 0, 35, "Active", "assets/images/sleeping-cat-keychain.webp"],
    ["PRD005", "Pink Calla Car Mirror Pendant", 850, 0, 25, "Active", "assets/images/pink-calla-pendant.webp"],
    ["PRD006", "Kawaii Sleeping Bunny Charm", 600, 0, 45, "Active", "assets/images/sleeping-bunny-charm.webp"],
    ["PRD007", "Bloom Lily Mini Desk Accent", 750, 0, 20, "Active", "assets/images/crochet-flower-wall.webp"],
    ["PRD008", "Workshop Edition Calla Pendant", 1150, 0, 15, "Active", "assets/images/pink-calla-pendant.webp"]
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Product ID", "Product Name", "Price", "Discount", "Stock", "Status", "Image"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#F4ECE1");
  }

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).clearContent();
  }

  initialProducts.forEach(prod => sheet.appendRow(prod));

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Active", "Inactive"], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange("F2:F500").setDataValidation(rule);

  Logger.log("All 8 products populated successfully!");
}
