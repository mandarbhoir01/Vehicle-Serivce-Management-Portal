const publicSite = document.querySelector("#public-site");
const portalApp = document.querySelector("#portal-app");
const authBackdrop = document.querySelector("#auth-backdrop");
const authForm = document.querySelector("#auth-form");
const authName = document.querySelector("#auth-name");
const authPassword = document.querySelector("#auth-password");
const authError = document.querySelector("#auth-error");
const customerAuthPanel = document.querySelector("#customer-auth-panel");
const customerEntry = document.querySelector("#customer-entry");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let authRole = "admin";

function setAuthRole(nextRole) {
  authRole = nextRole;
  document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.authRole === nextRole));
  const isAdmin = nextRole === "admin";
  authForm.classList.toggle("hidden", !isAdmin);
  customerAuthPanel.classList.toggle("hidden", isAdmin);
  document.querySelector("#auth-title").textContent = isAdmin ? "ADMIN LOGIN" : "CUSTOMER LOGIN";
  authError.classList.add("hidden");
  if (isAdmin) authName.focus();
}

function showPortal(nextRole, bookService) {
  role = nextRole;
  activeView = "overview";
  publicSite.classList.add("hidden");
  authBackdrop.classList.add("hidden");
  portalApp.classList.remove("hidden");
  document.body.classList.add("portal-active");
  render();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "instant" : "smooth" });
  if (bookService) {
    window.setTimeout(() => {
      openModal();
      document.querySelector("#request-type").value = bookService;
    }, 30);
  }
}

function showPublicSite() {
  portalApp.classList.add("hidden");
  publicSite.classList.remove("hidden");
  document.body.classList.remove("portal-active");
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "instant" : "smooth" });
}

document.querySelectorAll("[data-open-login]").forEach((button) => button.addEventListener("click", () => {
  authBackdrop.classList.remove("hidden");
  setAuthRole(button.dataset.openLogin || "admin");
}));

document.querySelectorAll("[data-open-portal]").forEach((button) => button.addEventListener("click", () => showPortal(button.dataset.openPortal || "customer")));
document.querySelectorAll("[data-open-booking], [data-book-service]").forEach((button) => button.addEventListener("click", () => {
  const type = button.dataset.bookService || "Routine service";
  showPortal("customer", type);
}));

document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthRole(tab.dataset.authRole)));
customerEntry.addEventListener("click", () => showPortal("customer"));
document.querySelector("#close-auth").addEventListener("click", () => authBackdrop.classList.add("hidden"));
authBackdrop.addEventListener("click", (event) => { if (event.target === authBackdrop) authBackdrop.classList.add("hidden"); });
authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (authRole !== "admin" || authName.value.trim().toLowerCase() !== "mandar" || !authPassword.value.trim()) {
    authError.classList.remove("hidden");
    return;
  }
  showPortal("admin");
});

window.addEventListener("mgm-auth-success", (event) => {
  const user = event.detail.user;
  currentUser.id = user.uid;
  currentUser.name = user.displayName || user.phoneNumber || "Customer";
  currentUser.initials = currentUser.name.split(/[\s@._+-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "CU";
  showPortal("customer");
});

document.querySelector("#back-to-site").addEventListener("click", showPublicSite);
const header = document.querySelector(".site-header");
const menuButton = document.querySelector("#mobile-menu-button");
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
  header.classList.toggle("menu-open", !expanded);
});
document.querySelectorAll(".site-nav a").forEach((link) => link.addEventListener("click", () => {
  header.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    authBackdrop.classList.add("hidden");
    header.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}