/**
 * Dremoy Store OMS — Frontend API Service Layer
 * Abstracts network calls to Google Apps Script Web App Endpoint.
 */

// Replace with your Google Apps Script Web App Deployment URL
const APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

export const ApiService = {
  /**
   * Fetch Store Settings
   */
  async getSettings() {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getSettings`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getSettings):", err);
      return { status: "error", message: "নেটওয়ার্ক ত্রুটি! অনুগ্রহ করে আবার চেষ্টা করুন।" };
    }
  },

  /**
   * Fetch Active Products
   */
  async getProducts() {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getProducts`);
      return await res.json();
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
      const res = await fetch(`${APPS_SCRIPT_URL}?action=trackOrder&query=${encodeURIComponent(query)}`);
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
