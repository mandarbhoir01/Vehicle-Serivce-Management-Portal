const STORAGE_KEY = "motordesk-demo-v1";
const PROFILE_STORAGE_PREFIX = "mgm-profile-v1";
const PUBLIC_REVIEWS_KEY = "mgm-public-reviews-v1";
const currentUser = { id: "aarav", name: "Aarav Patel", initials: "AP" };
const starterData = {
  vehicles: [
    { id: "v1", owner: "aarav", type: "Car", make: "Honda", model: "City ZX", year: 2022, plate: "MH 02 KL 4821", mileage: "28,450 km" },
    { id: "v2", owner: "aarav", type: "Bike", make: "Royal Enfield", model: "Hunter 350", year: 2023, plate: "MH 02 MQ 1108", mileage: "8,210 km" },
    { id: "v3", owner: "meera", type: "Car", make: "Hyundai", model: "Creta SX", year: 2021, plate: "MH 01 AB 8274", mileage: "41,900 km" },
  ],
  requests: [
    { id: "MD-1048", owner: "aarav", vehicleId: "v1", service: "Full service & oil change", notes: "Annual maintenance, oil and filter replacement", date: "2026-10-16", status: "Approved", amount: 4850 },
    { id: "MD-1046", owner: "meera", vehicleId: "v3", service: "Front brake inspection", notes: "Squeaking when braking", date: "2026-10-15", status: "In progress", amount: 2200 },
    { id: "MD-1042", owner: "aarav", vehicleId: "v2", service: "Chain adjustment & inspection", notes: "Chain has started to feel loose", date: "2026-10-10", status: "Completed", amount: 1250 },
    { id: "MD-1039", owner: "meera", vehicleId: "v3", service: "Ceramic coating", notes: "Exterior paint protection", date: "2026-10-08", status: "Awaiting approval", amount: 12000 },
    { id: "MD-1032", owner: "aarav", vehicleId: "v1", service: "Rear camera installation", notes: "Install customer-supplied camera", date: "2026-09-26", status: "Completed", amount: 3500 },
    { id: "MD-1029", owner: "aarav", vehicleId: "v2", service: "Tubeless tyre conversion", notes: "Convert both wheels", date: "2026-09-18", status: "Completed", amount: 4200 },
  ],
  payments: [
    { id: "INV-2408", owner: "aarav", requestId: "MD-1042", description: "Chain adjustment & inspection", amount: 1250, date: "2026-10-10", status: "Paid" },
    { id: "INV-2391", owner: "aarav", requestId: "MD-1032", description: "Rear camera installation", amount: 3500, date: "2026-09-26", status: "Paid" },
    { id: "INV-2412", owner: "meera", requestId: "MD-1046", description: "Front brake inspection", amount: 2200, date: "2026-10-15", status: "Due" },
    { id: "INV-2377", owner: "aarav", requestId: "MD-1029", description: "Tubeless tyre conversion", amount: 4200, date: "2026-09-18", status: "Paid" },
  ],
  records: [
    { id: "MD-1042", owner: "aarav", vehicleId: "v2", service: "Chain adjustment & inspection", date: "2026-10-10", notes: "Chain tension adjusted; safety check completed.", mileage: "8,210 km" },
    { id: "MD-1032", owner: "aarav", vehicleId: "v1", service: "Rear camera installation", date: "2026-09-26", notes: "Camera fitted and reverse display tested.", mileage: "27,980 km" },
    { id: "MD-1029", owner: "aarav", vehicleId: "v2", service: "Tubeless tyre conversion", date: "2026-09-18", notes: "Both wheels converted; pressure check completed.", mileage: "7,960 km" },
  ],
};

function emptyAccountData() {
  return { vehicles: [], requests: [], payments: [], records: [] };
}

function scopeAccountData(source, userId) {
  return {
    vehicles: (source.vehicles || []).filter((item) => item.owner === userId),
    requests: (source.requests || []).filter((item) => item.owner === userId),
    payments: (source.payments || []).filter((item) => item.owner === userId),
    records: (source.records || []).filter((item) => item.owner === userId),
  };
}

function loadAccountData(userId) {
  try {
    const saved = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}:${userId}`);
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy) return scopeAccountData(JSON.parse(legacy), userId);
  } catch {
    return userId === "aarav" ? scopeAccountData(structuredClone(starterData), userId) : emptyAccountData();
  }
  return userId === "aarav" ? scopeAccountData(structuredClone(starterData), userId) : emptyAccountData();
}

let data = loadAccountData(currentUser.id);
let cloudAccountId = null;
let cloudAdmin = false;
let cloudAccounts = [];
function ensureDemoInvoice() {
  if (currentUser.id !== "aarav" || data.payments.some((payment) => payment.id === "INV-DEMO-UPI")) return;
  data.payments.unshift({ id: "INV-DEMO-UPI", owner: "aarav", requestId: "MD-1048", description: "Demo UPI checkout", amount: 1, date: new Date().toISOString().slice(0, 10), status: "Due", demoOnly: true });
}
ensureDemoInvoice();
let role = "customer";
let activeView = "overview";
let toastTimer;
let vehicleType = "Car";
let selectedMake = "";
let continueToRequestAfterVehicle = false;
const vehicleBrands = {
  Car: [
    { name: "Acura", slug: "acura", mark: "A" }, { name: "Audi", slug: "audi", mark: "A" },
    { name: "BMW", slug: "bmw", mark: "BMW" }, { name: "BYD", mark: "BYD" },
    { name: "Chevrolet", slug: "chevrolet", mark: "C" }, { name: "Citroën", slug: "citroen", mark: "C" },
    { name: "Ferrari", slug: "ferrari", mark: "F" }, { name: "Fiat", slug: "fiat", mark: "FIAT" },
    { name: "Ford", slug: "ford", mark: "F" }, { name: "Honda", slug: "honda", mark: "H" },
    { name: "Hyundai", slug: "hyundai", mark: "H" }, { name: "Jaguar", slug: "jaguar", mark: "J" },
    { name: "Jeep", slug: "jeep", mark: "J" }, { name: "Kia", mark: "KIA" },
    { name: "Land Rover", slug: "landrover", mark: "LR" }, { name: "Lexus", mark: "L" },
    { name: "Mahindra", mark: "M" }, { name: "Maruti Suzuki", mark: "MS" },
    { name: "Mazda", slug: "mazda", mark: "M" }, { name: "Mercedes-Benz", mark: "MB" },
    { name: "MG", slug: "mg", mark: "MG" }, { name: "Mitsubishi", slug: "mitsubishi", mark: "M" },
    { name: "Nissan", slug: "nissan", mark: "N" }, { name: "Porsche", slug: "porsche", mark: "P" },
    { name: "Renault", slug: "renault", mark: "R" }, { name: "Škoda", slug: "skoda", mark: "S" },
    { name: "Subaru", slug: "subaru", mark: "S" }, { name: "Suzuki", slug: "suzuki", mark: "S" },
    { name: "Tata Motors", slug: "tata", mark: "T" }, { name: "Tesla", slug: "tesla", mark: "T" },
    { name: "Toyota", slug: "toyota", mark: "T" }, { name: "Volkswagen", slug: "volkswagen", mark: "VW" },
    { name: "Volvo", slug: "volvo", mark: "V" }, { name: "Other / custom", mark: "+" },
  ],
  Bike: [
    { name: "Aprilia", mark: "A" }, { name: "Ather", mark: "A" }, { name: "Bajaj", mark: "B" },
    { name: "Benelli", mark: "B" }, { name: "BMW Motorrad", slug: "bmw", mark: "BMW" },
    { name: "Ducati", slug: "ducati", mark: "D" }, { name: "Harley-Davidson", mark: "HD" },
    { name: "Hero MotoCorp", mark: "H" }, { name: "Honda", slug: "honda", mark: "H" },
    { name: "Husqvarna", mark: "H" }, { name: "Indian Motorcycle", mark: "IM" },
    { name: "Jawa", mark: "J" }, { name: "Kawasaki", mark: "K" }, { name: "KTM", slug: "ktm", mark: "KTM" },
    { name: "Ola Electric", mark: "O" }, { name: "Royal Enfield", mark: "RE" },
    { name: "Suzuki", slug: "suzuki", mark: "S" }, { name: "Triumph", mark: "T" },
    { name: "TVS Motor", mark: "TVS" }, { name: "Vespa", mark: "V" },
    { name: "Yamaha", mark: "Y" }, { name: "Yezdi", mark: "Y" },
    { name: "Zero Motorcycles", mark: "Z" }, { name: "Other / custom", mark: "+" },
  ],
};
const el = {
  stats: document.querySelector("#stats-grid"), requests: document.querySelector("#recent-requests"), upcoming: document.querySelector("#upcoming-service"),
  vehicles: document.querySelector("#vehicle-list"), payments: document.querySelector("#payment-list"), paymentSummary: document.querySelector("#payment-summary"),
  fullPanel: document.querySelector("#full-view-panel"), fullTitle: document.querySelector("#full-view-title"), fullKicker: document.querySelector("#full-view-kicker"),
  fullContent: document.querySelector("#full-view-content"), viewAction: document.querySelector("#view-action-button"), modal: document.querySelector("#modal-backdrop"),
  form: document.querySelector("#request-form"), toast: document.querySelector("#toast"),
};

function save() {
  try {
    localStorage.setItem(`${PROFILE_STORAGE_PREFIX}:${currentUser.id}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Local data save failed; continuing with cloud storage", error);
  }
  const cloud = window.MGM_CLOUD;
  if (!cloud || !cloudAccountId) return;
  const savePromise = cloudAdmin
    ? cloud.saveAllAccounts(cloudAccounts.map((account) => {
      const accountData = { vehicles: [], requests: [], payments: [], records: [] };
      for (const key of Object.keys(accountData)) accountData[key] = data[key].filter((item) => item.owner === account.id);
      return { id: account.id, data: { ...account, data: accountData } };
    }))
    : cloud.saveAccount(cloudAccountId, { data });
  savePromise.catch((error) => {
    console.error("Cloud data save failed", error);
    toast("Cloud save failed. Check Firestore setup and try again.");
  });
}
async function setCustomerProfile(profile, options = {}) {
  const nextId = String(profile.id || "customer");
  const changed = currentUser.id !== nextId;
  Object.assign(currentUser, { id: nextId, name: profile.name || "Customer", initials: profile.initials || "CU" });
  cloudAccountId = options.cloud ? nextId : null;
  cloudAdmin = Boolean(options.admin);
  if (changed || options.cloud) data = loadAccountData(nextId);
  if (options.cloud && window.MGM_CLOUD) {
    try {
      if (options.admin) {
        cloudAccounts = await window.MGM_CLOUD.loadAllAccounts();
        data = emptyAccountData();
        for (const account of cloudAccounts) {
          for (const key of Object.keys(data)) data[key].push(...(account.data?.[key] || []));
        }
      } else {
        const account = await window.MGM_CLOUD.loadAccount(nextId);
        if (account?.data) data = account.data;
        else await window.MGM_CLOUD.saveAccount(nextId, { data });
      }
    } catch (error) {
      console.error("Cloud data load failed", error);
      toast("Could not load cloud data. Check Firestore setup and access rules.");
    }
  }
  ensureDemoInvoice();
  render();
}
function esc(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function money(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
function date(value, options = { day: "numeric", month: "short" }) { return value ? new Intl.DateTimeFormat("en-IN", options).format(new Date(`${value}T12:00:00`)) : "Date pending"; }
function vehicleFor(id) { return data.vehicles.find((vehicle) => vehicle.id === id); }
function vehicleName(vehicle) { return vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle removed"; }
function requests() { return data.requests.filter((item) => role === "admin" || item.owner === currentUser.id).sort((a, b) => b.date.localeCompare(a.date)); }
function vehicles() { return data.vehicles.filter((item) => role === "admin" || item.owner === currentUser.id); }
function payments() { return data.payments.filter((item) => role === "admin" || item.owner === currentUser.id).sort((a, b) => b.date.localeCompare(a.date)); }
function statusClass(status) { return `status-${status.toLowerCase().replaceAll(" ", "-")}`; }
function pill(status) { return `<span class="status-pill ${statusClass(status)}">${esc(status)}</span>`; }

function submittedReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem(PUBLIC_REVIEWS_KEY));
    return Array.isArray(reviews) ? reviews : [];
  } catch {
    return [];
  }
}

function renderPublicReviews() {
  const container = document.querySelector("#public-review-list");
  if (!container) return;
  container.querySelectorAll("[data-user-review]").forEach((review) => review.remove());
  submittedReviews().slice().reverse().forEach((review) => {
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
    const stars = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
    const vehicle = review.vehicle ? `<small>${esc(review.vehicle)} · Customer review</small>` : "<small>Customer review</small>";
    container.insertAdjacentHTML("afterbegin", `<article class="review-card user-review-card" data-user-review="${esc(review.owner)}"><div class="review-stars" aria-label="${rating} out of 5 stars">${stars}</div><blockquote>${esc(review.message)}</blockquote><div class="review-by"><span class="review-avatar">${esc(review.initials || "CU")}</span><span><strong>${esc(review.name || "Customer")}</strong>${vehicle}</span><span class="review-mark">${date(review.date)}</span></div></article>`);
  });
}

function renderReviewVehicleOptions() {
  const select = document.querySelector("#review-vehicle");
  if (!select) return;
  select.innerHTML = `<option value="">General workshop experience</option>${vehicles().map((vehicle) => `<option value="${esc(vehicle.id)}">${esc(vehicleName(vehicle))}</option>`).join("")}`;
}

function renderStats() {
  const open = requests().filter((item) => ["Awaiting approval", "Approved", "In progress"].includes(item.status)).length;
  const due = payments().filter((item) => item.status === "Due").reduce((sum, item) => sum + item.amount, 0);
  const stats = [
    [role === "admin" ? "TOTAL REQUESTS" : "OPEN REQUESTS", open, role === "admin" ? "across all customers" : "being looked after", "◷"],
    ["IN THE GARAGE", vehicles().length, "registered vehicles", "⌑"],
    [role === "admin" ? "COMPLETED VISITS" : "SERVICE VISITS", requests().filter((item) => item.status === "Completed").length, "service history", "✓"],
    ["PAYMENTS DUE", money(due), due ? "needs attention" : "all caught up", "＄"],
  ];
  el.stats.innerHTML = stats.map(([label, value, caption, icon]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}<span class="stat-caption">${caption}</span></div></article>`).join("");
  document.querySelector("#request-count").textContent = open;
}

function renderUpcoming() {
  const next = requests().filter((item) => !["Completed", "Cancelled"].includes(item.status) && item.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date))[0];
  document.querySelector("#schedule-heading").textContent = role === "admin" ? "Next scheduled visit" : "Upcoming service";
  if (!next) { el.upcoming.innerHTML = '<div class="empty-state">Nothing scheduled just yet. Your next visit will appear here.</div>'; return; }
  const vehicle = vehicleFor(next.vehicleId), d = new Date(`${next.date}T12:00:00`);
  el.upcoming.innerHTML = `<div class="appointment"><div class="date-tile"><span>${d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</span><strong>${d.getDate()}</strong></div><div class="appointment-copy"><strong>${esc(next.service)}</strong><p>${esc(next.notes)}</p><p class="appointment-vehicle">${esc(vehicleName(vehicle))} ${vehicle ? `· ${esc(vehicle.plate)}` : ""}</p></div><div class="appointment-time">${pill(next.status)}</div></div>`;
}

function renderRecent() {
  el.requests.innerHTML = requests().slice(0, 4).map((item) => `<tr><td>${esc(item.service)}</td><td>${esc(vehicleName(vehicleFor(item.vehicleId)))}</td><td>${date(item.date)}</td><td>${pill(item.status)}</td></tr>`).join("") || '<tr><td colspan="4" class="empty-state">No requests yet. Start with a service request.</td></tr>';
}

function renderVehicles() {
  el.vehicles.innerHTML = vehicles().slice(0, 3).map((item) => `<div class="vehicle-row"><span class="vehicle-symbol">${item.type === "Bike" ? "⌁" : "▰"}</span><div class="vehicle-details"><strong>${esc(item.make)} ${esc(item.model)}</strong><span>${esc(item.plate)} · ${item.year}</span></div></div>`).join("") || '<div class="empty-state">No vehicles added yet.</div>';
}

function renderPayments() {
  const list = payments(), due = list.filter((item) => item.status === "Due").reduce((sum, item) => sum + item.amount, 0);
  el.paymentSummary.innerHTML = `<span>Outstanding balance</span><strong>${money(due)}</strong>`;
  const rows = list.slice(0, 3).map((item) => `<div class="payment-row"><div class="payment-copy"><strong>${esc(item.description)}</strong><span>${esc(item.id)} · ${date(item.date)}</span></div><div class="payment-amount">${money(item.amount)}<div class="payment-pill ${item.status === "Due" ? "due" : ""}">${esc(item.status)}</div>${role === "customer" && item.status === "Due" ? `<button class="payment-action" type="button" data-pay-invoice="${esc(item.id)}">Pay with UPI</button>` : ""}</div></div>`).join("");
  const demoButton = role === "customer" ? '<button class="payment-action payment-demo-action" type="button" data-pay-invoice="__demo__">Try UPI demo · ₹1</button>' : "";
  el.payments.innerHTML = `${rows || '<div class="empty-state">No payments on record.</div>'}${demoButton}`;
}

function requestRows(list) {
  return list.map((item) => `<tr><td>${esc(item.service)}<br><span class="table-subtext">${esc(item.id)} · ${esc(item.notes || "No extra details")}</span></td><td>${esc(vehicleName(vehicleFor(item.vehicleId)))}</td><td>${date(item.date, { day: "numeric", month: "short", year: "numeric" })}${item.time ? `<br><span class="table-subtext">${esc(item.time)}</span>` : ""}</td><td>${role === "admin" ? `<select class="admin-select" data-request-status="${esc(item.id)}" aria-label="Update ${esc(item.id)} status">${["Awaiting approval", "Approved", "In progress", "Completed", "Cancelled"].map((status) => `<option ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>` : pill(item.status)}</td><td>${money(item.amount)}</td></tr>`).join("");
}

function renderFullView() {
  if (activeView === "overview") { el.fullPanel.classList.add("hidden"); return; }
  el.fullPanel.classList.remove("hidden");
  const config = {
    requests: [role === "admin" ? "SERVICE DESK" : "YOUR ACTIVITY", role === "admin" ? "All service requests" : "Service requests"],
    vehicles: ["YOUR GARAGE", role === "admin" ? "Registered vehicles" : "My vehicles"],
    records: ["YOUR VEHICLE HISTORY", "Service records"],
    payments: ["BILLING", role === "admin" ? "Customer payments" : "Payments"],
  }[activeView];
  [el.fullKicker.textContent, el.fullTitle.textContent] = config;
  el.viewAction.classList.toggle("hidden", activeView !== "vehicles" || role === "admin");
  el.viewAction.textContent = "+ Add vehicle";
  if (activeView === "requests") {
    const list = requests();
    el.fullContent.innerHTML = list.length ? `<div class="table-wrap view-table"><table><thead><tr><th>SERVICE</th><th>VEHICLE</th><th>REQUESTED</th><th>STATUS</th><th>ESTIMATE</th></tr></thead><tbody>${requestRows(list)}</tbody></table></div>` : '<div class="empty-state">No service requests yet.</div>';
  } else if (activeView === "vehicles") {
    const list = vehicles();
    el.fullContent.innerHTML = list.length ? `<div class="vehicle-manage-list">${list.map((item) => `<div class="vehicle-manage-row"><span class="vehicle-symbol">${item.type === "Bike" ? "⌁" : "▰"}</span><div class="vehicle-details"><strong>${esc(item.make)} ${esc(item.model)} (${item.year})</strong><span>${esc(item.plate)} · ${esc(item.mileage)}</span></div>${role === "admin" ? `<span class="text-button">${item.owner === currentUser.id ? "Aarav Patel" : "Meera Shah"}</span>` : `<button class="text-button" data-remove-vehicle="${esc(item.id)}">Remove</button>`}</div>`).join("")}</div>` : '<div class="empty-state">No vehicles yet. Add a car or bike to get started.</div>';
  } else if (activeView === "records") {
    const list = data.records.filter((item) => role === "admin" || item.owner === currentUser.id).sort((a, b) => b.date.localeCompare(a.date));
    el.fullContent.innerHTML = list.length ? `<div class="record-list">${list.map((item) => `<div class="record-item"><span class="record-date">${date(item.date, { day: "numeric", month: "short", year: "numeric" })}</span><div><strong>${esc(item.service)} · ${esc(vehicleName(vehicleFor(item.vehicleId)))}</strong><p>${esc(item.notes)}</p></div><span class="record-mileage">${esc(item.mileage)}</span></div>`).join("")}</div>` : '<div class="empty-state">Completed services will be added to your history.</div>';
  } else {
    const list = payments();
    el.fullContent.innerHTML = list.length ? `<div class="table-wrap view-table"><table><thead><tr><th>INVOICE</th><th>SERVICE</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${list.map((item) => `<tr><td>${esc(item.id)}</td><td>${esc(item.description)}</td><td>${date(item.date, { day: "numeric", month: "short", year: "numeric" })}</td><td>${money(item.amount)}</td><td><span class="payment-pill ${item.status === "Due" ? "due" : ""}">${esc(item.status)}</span></td><td>${role === "customer" && item.status === "Due" ? `<button class="payment-action" type="button" data-pay-invoice="${esc(item.id)}">Pay with UPI</button>` : "—"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state">No payments on record.</div>';
    if (role === "customer") el.fullContent.insertAdjacentHTML("beforeend", '<button class="payment-action payment-demo-action" type="button" data-pay-invoice="__demo__">Try UPI demo · ₹1</button>');
  }
}

function render() {
  const admin = role === "admin";
  const customerGreeting = currentUser.name.includes("@") ? "there" : currentUser.name.split(/\s+/)[0];
  document.querySelector("#welcome-eyebrow").textContent = admin ? "ADMIN WORKSPACE" : "CUSTOMER PORTAL";
  document.querySelector("#page-title").innerHTML = admin ? 'Good morning, service team<span class="title-period">.</span>' : `Good morning, ${esc(customerGreeting)}<span class="title-period">.</span>`;
  document.querySelector("#page-subtitle").textContent = admin ? "A clear view of today's work across the service desk." : "Your vehicles, service visits, and payments in one place.";
  document.querySelector("#profile-name").textContent = admin ? "Mandar" : currentUser.name;
  document.querySelector("#profile-role").textContent = admin ? "Administrator" : "Customer account";
  document.querySelector("#profile-avatar").textContent = document.querySelector("#top-avatar").textContent = admin ? "MA" : currentUser.initials;
  document.querySelector("#new-request-button").classList.toggle("hidden", admin);
  document.querySelectorAll(".role-option").forEach((button) => button.classList.toggle("active", button.dataset.role === role));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
  document.querySelector(".customer-review-nav").classList.toggle("hidden", admin);
  document.querySelector("#breadcrumb-current").textContent = activeView === "overview" ? "Overview" : activeView[0].toUpperCase() + activeView.slice(1);
  document.querySelector("#recent-heading").textContent = admin ? "Latest service requests" : "Recent requests";
  document.querySelector("#add-vehicle-button").classList.toggle("hidden", admin);
  document.querySelector(".garage-footer").innerHTML = admin ? "View registered vehicles <span>↗</span>" : "Manage vehicles <span>↗</span>";
  document.querySelector("#review-submit-panel").classList.toggle("hidden", admin);
  renderReviewVehicleOptions();
  renderPublicReviews();
  renderStats(); renderUpcoming(); renderRecent(); renderVehicles(); renderPayments(); renderFullView();
}

function toast(message) {
  el.toast.textContent = message; el.toast.classList.add("visible"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("visible"), 2700);
}

function openPaymentModal(invoiceId) {
  if (role !== "customer") return;
  const isDemo = invoiceId === "__demo__";
  const invoice = isDemo ? null : payments().find((item) => item.id === invoiceId && item.status === "Due");
  if (!isDemo && !invoice) return;
  document.querySelector("#payment-form").reset();
  document.querySelector("#payment-form-error").classList.add("hidden");
  document.querySelector("#payment-invoice-summary").innerHTML = isDemo ? `<span>MGM Automotive · test checkout</span><strong>${money(1)}</strong>` : `<span>${esc(invoice.id)} · ${esc(invoice.description)}</span><strong>${money(invoice.amount)}</strong>`;
  document.querySelector("#payment-modal-backdrop").dataset.invoiceId = isDemo ? "" : invoice.id;
  document.querySelector("#payment-modal-backdrop").classList.remove("hidden");
  document.querySelector("#payment-upi-id").focus();
}

function closePaymentModal() {
  document.querySelector("#payment-modal-backdrop").classList.add("hidden");
  delete document.querySelector("#payment-modal-backdrop").dataset.invoiceId;
  document.querySelector("#payment-form").reset();
}

function renderBrandPicker() {
  const query = document.querySelector("#vehicle-make-search").value.trim().toLowerCase();
  const brands = vehicleBrands[vehicleType];
  const list = brands.filter((brand) => brand.name !== "Other / custom" && brand.name.toLowerCase().includes(query));
  const customBrand = brands.find((brand) => brand.name === "Other / custom");
  document.querySelector("#brand-picker").innerHTML = `${list.map((brand) => {
    const isSelected = selectedMake === brand.name;
    const logo = brand.slug ? `<img class="brand-logo-image" src="https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/${brand.slug}.svg" alt="" loading="lazy"><span class="brand-logo-fallback hidden">${esc(brand.mark)}</span>` : `<span class="brand-logo-fallback">${esc(brand.mark)}</span>`;
    return `<button type="button" class="brand-option ${isSelected ? "selected" : ""}" role="option" aria-selected="${isSelected}" data-brand="${esc(brand.name)}"><span class="brand-logo">${logo}</span><span class="brand-option-name">${esc(brand.name)}</span></button>`;
  }).join("")}${customBrand ? `<button type="button" class="brand-option custom-brand-option ${selectedMake === customBrand.name ? "selected" : ""}" role="option" aria-selected="${selectedMake === customBrand.name}" data-brand="${esc(customBrand.name)}"><span class="brand-logo"><span class="brand-logo-fallback">+</span></span><span class="brand-option-name">Other / custom</span></button>` : ""}${list.length ? "" : '<p class="brand-empty">No matching make. Add it as a custom brand.</p>'}`;
  document.querySelectorAll(".brand-option").forEach((button) => button.addEventListener("click", () => {
    selectedMake = button.dataset.brand;
    const custom = selectedMake === "Other / custom";
    document.querySelector("#custom-make-field").classList.toggle("hidden", !custom);
    document.querySelector("#vehicle-custom-make").required = custom;
    if (custom) document.querySelector("#vehicle-custom-make").focus();
    renderBrandPicker();
  }));
}

function setVehicleType(type) {
  vehicleType = type;
  selectedMake = "";
  document.querySelectorAll(".vehicle-type-option").forEach((button) => {
    const selected = button.dataset.vehicleType === type;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#custom-make-field").classList.add("hidden");
  document.querySelector("#vehicle-custom-make").required = false;
  renderBrandPicker();
}

function addVehicle() {
  document.querySelector("#vehicle-form").reset();
  document.querySelector("#vehicle-year").value = new Date().getFullYear();
  document.querySelector("#vehicle-year").max = new Date().getFullYear() + 1;
  document.querySelector("#vehicle-make-search").value = "";
  setVehicleType("Car");
  document.querySelector("#vehicle-modal-backdrop").classList.remove("hidden");
  document.querySelector("#vehicle-make-search").focus();
}

function closeVehicleModal() {
  document.querySelector("#vehicle-modal-backdrop").classList.add("hidden");
  continueToRequestAfterVehicle = false;
}

function openModal() {
  const list = vehicles();
  if (!list.length) { continueToRequestAfterVehicle = true; toast("Add a vehicle before requesting a service."); addVehicle(); return; }
  document.querySelector("#request-vehicle").innerHTML = list.map((item) => `<option value="${esc(item.id)}">${esc(vehicleName(item))} · ${esc(item.plate)}</option>`).join("");
  el.form.reset();
  const dateInput = document.querySelector("#request-date"); dateInput.min = new Date().toISOString().slice(0, 10);
  dateInput.value = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  document.querySelector("#request-time").value = "09:00–11:00";
  el.modal.classList.remove("hidden"); document.querySelector("#request-vehicle").focus();
}

function openView(view) {
  if (view === "reviews") {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === "reviews"));
    document.querySelector("#review-submit-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  activeView = view;
  render();
  document.querySelector("#full-view-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}
document.querySelectorAll(".role-option").forEach((button) => button.addEventListener("click", () => {
  const nextRole = button.dataset.role;
  if (nextRole === role) return;
  window.dispatchEvent(new CustomEvent("mgm-role-switch-request", { detail: { role: nextRole } }));
}));
document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => openView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.openView)));
document.querySelector("#new-request-button").addEventListener("click", openModal);
document.querySelector("#add-vehicle-button").addEventListener("click", addVehicle);
el.viewAction.addEventListener("click", addVehicle);
document.querySelector("#close-modal").addEventListener("click", () => el.modal.classList.add("hidden"));
document.querySelector("#cancel-modal").addEventListener("click", () => el.modal.classList.add("hidden"));
el.modal.addEventListener("click", (event) => { if (event.target === el.modal) el.modal.classList.add("hidden"); });
document.querySelector("#close-vehicle-modal").addEventListener("click", closeVehicleModal);
document.querySelector("#cancel-vehicle-modal").addEventListener("click", closeVehicleModal);
document.querySelector("#vehicle-modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "vehicle-modal-backdrop") closeVehicleModal(); });
document.querySelector("#close-payment-modal").addEventListener("click", closePaymentModal);
document.querySelector("#cancel-payment").addEventListener("click", closePaymentModal);
document.querySelector("#payment-modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "payment-modal-backdrop") closePaymentModal(); });
document.querySelectorAll(".vehicle-type-option").forEach((button) => button.addEventListener("click", () => setVehicleType(button.dataset.vehicleType)));
document.querySelector("#vehicle-make-search").addEventListener("input", renderBrandPicker);
document.addEventListener("error", (event) => {
  if (!event.target.matches(".brand-logo-image")) return;
  event.target.classList.add("hidden");
  event.target.nextElementSibling?.classList.remove("hidden");
}, true);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  el.modal.classList.add("hidden");
  closeVehicleModal();
  closePaymentModal();
});

document.querySelector("#vehicle-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedMake) { toast("Choose a vehicle make to continue."); document.querySelector("#vehicle-make-search").focus(); return; }
  const customMake = selectedMake === "Other / custom" ? document.querySelector("#vehicle-custom-make").value.trim() : selectedMake;
  if (!customMake) { document.querySelector("#vehicle-custom-make").focus(); return; }
  const mileageValue = document.querySelector("#vehicle-mileage").value;
  const item = {
    id: `v${Date.now()}`, owner: currentUser.id, type: vehicleType, make: customMake,
    model: document.querySelector("#vehicle-model").value.trim(), year: Number(document.querySelector("#vehicle-year").value),
    plate: document.querySelector("#vehicle-plate").value.trim().toUpperCase(),
    mileage: mileageValue ? `${Number(mileageValue).toLocaleString("en-IN")} km` : "Not recorded",
  };
  data.vehicles.push(item); save(); render();
  document.querySelector("#vehicle-modal-backdrop").classList.add("hidden");
  if (continueToRequestAfterVehicle) { continueToRequestAfterVehicle = false; openModal(); }
  else toast(`${vehicleName(item)} added to your garage.`);
});

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = { id: `MD-${Math.floor(1050 + Math.random() * 900)}`, owner: currentUser.id, vehicleId: document.querySelector("#request-vehicle").value, service: document.querySelector("#request-type").value, notes: document.querySelector("#request-notes").value.trim(), date: document.querySelector("#request-date").value, time: document.querySelector("#request-time").value, contact: document.querySelector("#request-contact").value.trim(), pickupRequested: document.querySelector("#request-pickup").checked, status: "Awaiting approval", amount: 0 };
  data.requests.push(item); save(); el.modal.classList.add("hidden"); activeView = "requests"; render(); toast(`Request ${item.id} sent to the service team.`);
});

document.addEventListener("change", (event) => {
  const id = event.target.dataset.requestStatus; if (!id) return;
  const item = data.requests.find((request) => request.id === id); if (!item) return;
  item.status = event.target.value;
  if (item.status === "Completed" && !data.records.some((record) => record.id === item.id)) {
    const vehicle = vehicleFor(item.vehicleId);
    data.records.push({ id: item.id, owner: item.owner, vehicleId: item.vehicleId, service: item.service, date: item.date, notes: item.notes, mileage: vehicle?.mileage || "Not recorded" });
    if (item.amount > 0) data.payments.push({ id: `INV-${Math.floor(2400 + Math.random() * 900)}`, owner: item.owner, requestId: item.id, description: item.service, amount: item.amount, date: item.date, status: "Due" });
  }
  save(); render(); toast(`${item.id} updated to ${item.status.toLowerCase()}.`);
});

document.addEventListener("click", (event) => {
  const paymentButton = event.target.closest("[data-pay-invoice]");
  if (paymentButton) { openPaymentModal(paymentButton.dataset.payInvoice); return; }
  const id = event.target.dataset.removeVehicle;
  if (!id || !confirm("Remove this vehicle from your garage? Its service records will remain.")) return;
  data.vehicles = data.vehicles.filter((item) => item.id !== id); save(); render(); toast("Vehicle removed from your garage.");
});

document.querySelector("#payment-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const upiId = document.querySelector("#payment-upi-id").value.trim();
  const error = document.querySelector("#payment-form-error");
  const validUpiId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}@[A-Za-z0-9][A-Za-z0-9.-]{0,50}$/.test(upiId);
  if (!validUpiId) {
    error.textContent = "Enter a valid UPI ID, for example name@bank.";
    error.classList.remove("hidden");
    document.querySelector("#payment-upi-id").focus();
    return;
  }
  const invoiceId = document.querySelector("#payment-modal-backdrop").dataset.invoiceId;
  if (!invoiceId) {
    closePaymentModal();
    toast("UPI demo completed. No payment was sent and the UPI ID was not saved.");
    return;
  }
  const invoice = data.payments.find((item) => item.id === invoiceId && item.owner === currentUser.id && item.status === "Due");
  if (!invoice) { closePaymentModal(); render(); return; }
  invoice.status = "Demo paid";
  invoice.paymentReference = `DEMO-${Date.now()}`;
  invoice.paidAt = new Date().toISOString();
  save();
  closePaymentModal();
  render();
  toast(`Demo payment recorded for ${invoice.id}. No money was transferred.`);
});

document.querySelector("#review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const reviews = submittedReviews();
  const vehicleId = document.querySelector("#review-vehicle").value;
  const selectedVehicle = vehicleFor(vehicleId);
  const review = {
    owner: currentUser.id,
    name: currentUser.name.includes("@") ? "Customer" : currentUser.name,
    initials: currentUser.initials,
    rating: Number(document.querySelector("#review-rating").value),
    vehicle: selectedVehicle ? vehicleName(selectedVehicle) : "",
    message: document.querySelector("#review-message").value.trim(),
    date: new Date().toISOString().slice(0, 10),
  };
  const existingIndex = reviews.findIndex((item) => item.owner === currentUser.id);
  if (existingIndex >= 0) reviews[existingIndex] = review;
  else reviews.unshift(review);
  localStorage.setItem(PUBLIC_REVIEWS_KEY, JSON.stringify(reviews));
  document.querySelector("#review-form").reset();
  renderReviewVehicleOptions();
  renderPublicReviews();
  toast(existingIndex >= 0 ? "Your review has been updated on the homepage." : "Your review has been added to the homepage.");
});

render();