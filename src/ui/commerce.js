import { COMMERCIAL_CONFIG } from "../config/Commercial.js";

export function mountCommerce(root) {
  if (!root) return;
  const ads = COMMERCIAL_CONFIG.ENABLE_ADS && COMMERCIAL_CONFIG.COMMERCIAL_MODE_ENABLED;
  const shop = COMMERCIAL_CONFIG.ENABLE_SKIN_SHOP && COMMERCIAL_CONFIG.COMMERCIAL_MODE_ENABLED;
  const cups = COMMERCIAL_CONFIG.ENABLE_TOURNAMENTS && COMMERCIAL_CONFIG.COMMERCIAL_MODE_ENABLED;
  root.hidden = !(ads || shop || cups);
  const ad = root.querySelector("[data-ad]");
  const shopBtn = root.querySelector("[data-shop]");
  const cup = root.querySelector("[data-cup]");
  if (ad) ad.hidden = !ads;
  if (shopBtn) shopBtn.hidden = !shop;
  if (cup) cup.hidden = !cups;
  if (ads && ad) ad.textContent = "Ad slot · " + (COMMERCIAL_CONFIG.AD_PROVIDER || "MockProvider");
}
