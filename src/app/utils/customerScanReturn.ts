const storageKey = "anovra_customer_scan_return_until";
const returnWindowMs = 30 * 60 * 1000;

export function rememberCustomerScan() {
  try {
    localStorage.setItem(storageKey, String(Date.now() + returnWindowMs));
  } catch {
    // Authentication still works when browser storage is unavailable.
  }
}

export function clearCustomerScan() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage restrictions.
  }
}

export function consumeCustomerScan() {
  try {
    const expiresAt = Number(localStorage.getItem(storageKey) || 0);
    clearCustomerScan();
    return expiresAt > Date.now();
  } catch {
    return false;
  }
}
