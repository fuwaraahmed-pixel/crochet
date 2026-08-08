/**
 * Dremoy Store OMS — Frontend API Service Layer
 * Abstracts network calls to Google Apps Script Web App Endpoint.
 */

// Google Apps Script Web App Deployment URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyWD8TMbk4tO5EYjikoKvDOhlouZqCnWInjFQMYc-xNFYbQ2wM3zCnItmSo-dteArfpMQ/exec";

export const ApiService = {
  /**
   * Fetch Store Settings
   */
  async getSettings() {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getSettings&_t=${Date.now()}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getSettings):", err);
      return { status: "error", message: "নেটওয়ার্ক ত্রুটি! অনুগ্রহ করে আবার চেষ্টা করুন।" };
    }
  },

  /**
   * Fetch Active Products from Google Sheet API with optional caching & cache-busting
   * @param {boolean} forceRefresh - Skip client cache if true
   */
  async getProducts(forceRefresh = false) {
    const CACHE_KEY = "dremoy_products_cache";
    const CACHE_TIME_KEY = "dremoy_products_cache_time";
    const TTL_MS = 3 * 60 * 1000; // 3 minutes cache

    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        if (cached && cachedTime && (Date.now() - Number(cachedTime) < TTL_MS)) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.status === "success" && Array.isArray(parsed.products)) {
            return parsed;
          }
        }
      } catch (e) {
        // Ignore cache read errors
      }
    }

    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getProducts&_t=${Date.now()}`);
      const data = await res.json();
      if (data && data.status === "success" && Array.isArray(data.products)) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch (e) {}
      }
      return data;
    } catch (err) {
      console.error("API Error (getProducts):", err);
      return { status: "error", message: "প্রোডাক্ট লোড করতে সমস্যা হয়েছে।" };
    }
  },

  /**
   * Track Order by Tracking ID or Phone Number
   */
  async trackOrder(query) {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=trackOrder&query=${encodeURIComponent(query)}&_t=${Date.now()}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (trackOrder):", err);
      return { status: "error", message: "ট্র্যাকিং সার্ভিস বর্তমানে উপলব্ধ নয়।" };
    }
  },

  /**
   * Create New Order (POST)
   */
  async createOrder(orderPayload) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "createOrder",
          data: orderPayload
        })
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (createOrder):", err);
      return { status: "error", message: "অর্ডার সাবমিট করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।" };
    }
  }
};

if (typeof window !== "undefined") {
  window.ApiService = ApiService;
}

