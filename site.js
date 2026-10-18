const publicSite = document.querySelector("#public-site");
const portalApp = document.querySelector("#portal-app");
const authBackdrop = document.querySelector("#auth-backdrop");
const authForm = document.querySelector("#auth-form");
const authEmail = document.querySelector("#auth-name");
const authPassword = document.querySelector("#auth-password");
const authError = document.querySelector("#auth-error");
const customerAuthPanel = document.querySelector("#customer-auth-panel");
const customerEntry = document.querySelector("#customer-entry");
const profileBackdrop = document.querySelector("#profile-backdrop");
const customerProfileForm = document.querySelector("#customer-profile-form");
const profileNameInput = document.querySelector("#profile-full-name");
const profilePhoneInput = document.querySelector("#profile-phone");
const profileEmail = document.querySelector("#profile-email");
const profileFormError = document.querySelector("#profile-form-error");
const profileTitle = document.querySelector("#profile-modal-title");
const profileIntro = document.querySelector(".profile-modal .form-intro");
const profileSubmitButton = document.querySelector("#customer-profile-form button[type='submit']");
const profileMenu = document.querySelector("#site-profile-menu");
const profileMenuName = document.querySelector("#site-profile-menu-name");
const profileMenuEmail = document.querySelector("#site-profile-menu-email");
const profileActionError = document.querySelector("#profile-action-error");
const siteProfile = document.querySelector("#site-profile");
const siteProfileName = document.querySelector("#site-profile-name");
const siteProfileAvatar = document.querySelector("#site-profile-avatar");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const adminGoogleButton = document.createElement("button");
adminGoogleButton.type = "button";
adminGoogleButton.className = "google-signin";
adminGoogleButton.innerHTML = '<span class="google-mark">G</span>Continue with Google';
authForm.append(adminGoogleButton);
let authRole = "admin";
let accountMode = "guest";
let authenticatedUser = null;
let adminGoogleSignInPending = false;
let customerProfileReady = false;
let pendingBooking = null;
const CUSTOMER_PROFILE_PREFIX = "mgm-customer-profile-v1";
let profileSetupUser = null;
let editingCustomerProfile = false;
const profileCloseButton = document.createElement("button");
profileCloseButton.type = "button";
profileCloseButton.className = "icon-button profile-close hidden";
profileCloseButton.setAttribute("aria-label", "Close profile management");
profileCloseButton.textContent = "×";
document.querySelector(".profile-modal .modal-heading").append(profileCloseButton);
window.MGM_ACCOUNT_MODE = accountMode;

function initialsFor(name) {
  return name.split(/[\s@._+-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "CU";
}

async function setAccountMode(mode, user = null) {
  accountMode = mode;
  window.MGM_ACCOUNT_MODE = mode;
  if (mode !== "google") customerProfileReady = false;
  if (mode === "google" || mode === "admin") authenticatedUser = user;
  if (mode === "guest" || mode === "demo") authenticatedUser = null;

  if (mode === "google") {
    const name = user.displayName || user.email || "Customer";
    await setCustomerProfile({ id: user.uid, name, initials: initialsFor(name) }, { cloud: true });
  } else if (mode === "demo") {
    await setCustomerProfile({ id: "aarav", name: "Demo Customer", initials: "DC" });
    window.dispatchEvent(new CustomEvent("mgm-demo-selected"));
  } else if (mode === "admin") {
    const name = user.displayName || user.email || "Administrator";
    await setCustomerProfile({ id: user.uid, name, initials: initialsFor(name) }, { cloud: true, admin: true });
  } else {
    await setCustomerProfile({ id: "aarav", name: "Aarav Patel", initials: "AP" });
  }

  const hasAccount = mode === "demo" || mode === "admin" || (mode === "google" && customerProfileReady);
  document.querySelector("#site-login").classList.toggle("hidden", hasAccount);
  siteProfile.classList.toggle("hidden", !hasAccount);
  siteProfileName.textContent = mode === "demo" ? "Demo customer" : currentUser.name;
  siteProfileAvatar.textContent = currentUser.initials;
  siteProfile.setAttribute("aria-label", `${siteProfileName.textContent}: open garage`);
  profileMenuName.textContent = currentUser.name;
  profileMenuEmail.textContent = mode === "google" || mode === "admin" ? user.email || "Firebase account" : "Demo customer";
  profileMenu.classList.add("hidden");
  siteProfile.setAttribute("aria-expanded", "false");
}

async function savedCustomerProfile(userId) {
  if (window.MGM_CLOUD) {
    const account = await window.MGM_CLOUD.loadAccount(userId);
    if (account?.profile) return account.profile;
  }
  try {
    const profile = JSON.parse(localStorage.getItem(`${CUSTOMER_PROFILE_PREFIX}:${userId}`) || "null");
    if (profile && window.MGM_CLOUD) await window.MGM_CLOUD.saveProfile(userId, profile);
    return profile;
  } catch {
    return null;
  }
}

function openCustomerProfile(user, savedProfile = null, editing = false) {
  if (profileSetupUser?.uid === user.uid && !profileBackdrop.classList.contains("hidden") && editingCustomerProfile === editing) return;
  profileSetupUser = user;
  editingCustomerProfile = editing;
  profileNameInput.value = savedProfile?.name || user.displayName || "";
  profilePhoneInput.value = savedProfile?.phone || "";
  profileEmail.textContent = user.email ? `Signed in as ${user.email}` : "Signed in with Google";
  profileTitle.textContent = editing ? "Manage your profile." : "Set up your profile.";
  profileIntro.textContent = editing ? "Update your customer contact information." : "Add your contact details to finish setting up your customer account.";
  profileSubmitButton.innerHTML = editing ? "Save profile changes <span>↗</span>" : "Create profile and continue <span>↗</span>";
  profileCloseButton.classList.toggle("hidden", !editing);
  profileFormError.classList.add("hidden");
  authBackdrop.classList.add("hidden");
  profileBackdrop.classList.remove("hidden");
  profileNameInput.focus();
}

async function editCustomerProfile(user) {
  try {
    openCustomerProfile(user, await savedCustomerProfile(user.uid), true);
  } catch (error) {
    console.error("Customer profile load failed", error);
    profileActionError.textContent = "Could not load your profile. Check Firestore setup and try again.";
    profileActionError.classList.remove("hidden");
  }
}

async function handleGoogleUser(user) {
  if (editingCustomerProfile && profileSetupUser?.uid === user.uid && !profileBackdrop.classList.contains("hidden")) return;
  if (accountMode === "google" && authenticatedUser?.uid === user.uid && !profileSetupUser && profileBackdrop.classList.contains("hidden") && !pendingBooking) return;
  await setAccountMode("google", user);
  let profile;
  try {
    profile = await savedCustomerProfile(user.uid);
  } catch (error) {
    console.error("Customer profile load failed", error);
    profileFormError.textContent = "Could not load your cloud profile. Check Firestore setup and try again.";
    profileFormError.classList.remove("hidden");
    return;
  }
  if (!profile?.name || !profile?.phone) {
    customerProfileReady = false;
    siteProfile.classList.add("hidden");
    openCustomerProfile(user, profile);
    return;
  }
  customerProfileReady = true;
  profileBackdrop.classList.add("hidden");
  profileSetupUser = null;
  editingCustomerProfile = false;
  await setCustomerProfile({ id: user.uid, name: profile.name, initials: initialsFor(profile.name) }, { cloud: true });
  siteProfileName.textContent = currentUser.name;
  siteProfileAvatar.textContent = currentUser.initials;
  profileMenuName.textContent = currentUser.name;
  document.querySelector("#site-login").classList.add("hidden");
  siteProfile.classList.remove("hidden");
  siteProfile.setAttribute("aria-label", `${currentUser.name}: open account menu`);
  document.querySelector("#request-contact").value = profile.phone;
  const booking = pendingBooking;
  pendingBooking = null;
  if (booking) showPortal("customer", booking);
  else showPublicSite();
}

async function handleAdminUser(user) {
  if (accountMode === "admin" && authenticatedUser?.uid === user.uid) return;
  await setAccountMode("admin", user);
  showPortal("admin");
}

function openLogin(nextRole = "customer", bookService = null) {
  if (bookService) pendingBooking = bookService;
  authBackdrop.classList.remove("hidden");
  setAuthRole(nextRole);
}

function setAuthRole(nextRole) {
  authRole = nextRole;
  document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.authRole === nextRole));
  const isAdmin = nextRole === "admin";
  authForm.classList.toggle("hidden", !isAdmin);
  customerAuthPanel.classList.toggle("hidden", isAdmin);
  document.querySelector("#auth-title").textContent = isAdmin ? "ADMIN LOGIN" : "CUSTOMER LOGIN";
  authError.classList.add("hidden");
  if (isAdmin) {
    document.querySelector("#auth-name-label").firstChild.textContent = "Admin email";
    authError.textContent = "Check your email and password, and confirm this account is authorized as an administrator.";
    authEmail.type = "email";
    authEmail.autocomplete = "username";
    authEmail.placeholder = "name@example.com";
    authEmail.value = "";
    authPassword.value = "";
    authPassword.autocomplete = "current-password";
    authEmail.focus();
  } else {
    document.querySelector("#google-signin").focus();
  }
}

function showPortal(nextRole, bookService) {
  if (nextRole === "customer" && accountMode === "guest") {
    openLogin("customer", bookService);
    return;
  }
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

document.querySelectorAll("[data-open-login]").forEach((button) => button.addEventListener("click", () => openLogin(button.dataset.openLogin || "admin")));

document.querySelectorAll("[data-open-portal]").forEach((button) => button.addEventListener("click", () => showPortal(button.dataset.openPortal || "customer")));
document.querySelectorAll("[data-open-booking], [data-book-service]").forEach((button) => button.addEventListener("click", () => {
  const type = button.dataset.bookService || "Routine service";
  showPortal("customer", type);
}));
siteProfile.addEventListener("click", () => {
  const isOpen = !profileMenu.classList.contains("hidden");
  profileMenu.classList.toggle("hidden", isOpen);
  siteProfile.setAttribute("aria-expanded", String(!isOpen));
});
document.querySelector("#manage-profile-button").addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  siteProfile.setAttribute("aria-expanded", "false");
  if (authenticatedUser) editCustomerProfile(authenticatedUser);
});
document.querySelector("#open-customer-dashboard").addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  showPortal("customer");
});
const signOutButton = document.querySelector("#sign-out-button");
signOutButton.addEventListener("click", async () => {
  profileActionError.classList.add("hidden");
  signOutButton.disabled = true;
  try {
    if (authenticatedUser) {
      if (typeof window.MGM_SIGN_OUT !== "function") throw new Error("Firebase sign-out is not ready.");
      await window.MGM_SIGN_OUT();
    }
    await setAccountMode("guest");
    showPublicSite();
  } catch (error) {
    console.error("Customer sign-out failed", error);
    profileActionError.textContent = "Could not sign out. Please try again.";
    profileActionError.classList.remove("hidden");
  } finally {
    signOutButton.disabled = false;
  }
});
profileCloseButton.addEventListener("click", () => {
  profileBackdrop.classList.add("hidden");
  profileSetupUser = null;
  editingCustomerProfile = false;
});
document.querySelector("#top-avatar").addEventListener("click", () => {
  if (authenticatedUser) editCustomerProfile(authenticatedUser);
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".site-account")) return;
  profileMenu.classList.add("hidden");
  siteProfile.setAttribute("aria-expanded", "false");
});
window.addEventListener("mgm-role-switch-request", (event) => {
  if (event.detail.role === "admin") {
    openLogin("admin");
  } else if (accountMode === "google" && authenticatedUser) {
    window.dispatchEvent(new CustomEvent("mgm-request-customer-reauth"));
  } else {
    openLogin("customer");
  }
});
window.addEventListener("mgm-role-switch-auth-failed", () => openLogin("customer"));
window.addEventListener("mgm-role-switch-success", (event) => {
  handleGoogleUser(event.detail.user);
});

document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthRole(tab.dataset.authRole)));
customerEntry.addEventListener("click", async () => {
  await setAccountMode("demo");
  const booking = pendingBooking;
  pendingBooking = null;
  showPortal("customer", booking);
});
customerProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!profileSetupUser) return;
  const profile = { name: profileNameInput.value.trim(), phone: profilePhoneInput.value.trim() };
  try {
    localStorage.setItem(`${CUSTOMER_PROFILE_PREFIX}:${profileSetupUser.uid}`, JSON.stringify(profile));
    if (window.MGM_CLOUD) await window.MGM_CLOUD.saveProfile(profileSetupUser.uid, profile);
  } catch {
    profileFormError.textContent = "Could not save your profile. Check Firestore setup and try again.";
    profileFormError.classList.remove("hidden");
    return;
  }
  const user = profileSetupUser;
  editingCustomerProfile = false;
  handleGoogleUser(user);
});
document.querySelector("#close-auth").addEventListener("click", () => authBackdrop.classList.add("hidden"));
adminGoogleButton.addEventListener("click", async () => {
  authError.classList.add("hidden");
  adminGoogleButton.disabled = true;
  adminGoogleSignInPending = true;
  try {
    if (typeof window.MGM_ADMIN_GOOGLE_SIGN_IN !== "function") throw new Error("Google admin sign-in is not ready.");
    const user = await window.MGM_ADMIN_GOOGLE_SIGN_IN();
    await handleAdminUser(user);
    adminGoogleSignInPending = false;
    authBackdrop.classList.add("hidden");
  } catch (error) {
    if (!error.message.includes("allowlist")) adminGoogleSignInPending = false;
    authError.textContent = error.message.includes("allowlist")
      ? error.message
      : `Google admin sign-in failed (${error.code || "unknown error"}). Check the Firebase account and try again.`;
    authError.classList.remove("hidden");
  } finally {
    adminGoogleButton.disabled = false;
  }
});
authBackdrop.addEventListener("click", (event) => {
  if (event.target !== authBackdrop) return;
  pendingBooking = null;
  authBackdrop.classList.add("hidden");
});
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authRole !== "admin") {
    authError.classList.remove("hidden");
    return;
  }
  try {
    if (typeof window.MGM_ADMIN_SIGN_IN !== "function") throw new Error("Firebase admin sign-in is not ready.");
    const user = await window.MGM_ADMIN_SIGN_IN(authEmail.value.trim(), authPassword.value);
    await handleAdminUser(user);
    authBackdrop.classList.add("hidden");
  } catch (error) {
    authError.textContent = error.message.includes("allowlist")
      ? error.message
      : error.code === "auth/invalid-credential"
        ? "Email/password was rejected. This account may use Google sign-in; choose Continue with Google or verify the Firebase sign-in provider."
        : `Admin sign-in failed (${error.code || "unknown error"}). Check the email, password, and Firebase Authentication settings.`;
    authError.classList.remove("hidden");
  }
});

window.addEventListener("mgm-auth-success", (event) => {
  handleGoogleUser(event.detail.user);
});

window.addEventListener("mgm-auth-state", (event) => {
  if (event.detail.user) {
    if (event.detail.admin) {
      adminGoogleSignInPending = false;
      handleAdminUser(event.detail.user);
    } else if (!adminGoogleSignInPending && !(authRole === "admin" && !authBackdrop.classList.contains("hidden"))) {
      handleGoogleUser(event.detail.user);
    }
  } else {
    adminGoogleSignInPending = false;
    if (accountMode === "google" || accountMode === "admin") {
      profileBackdrop.classList.add("hidden");
      profileSetupUser = null;
      editingCustomerProfile = false;
      setAccountMode("guest");
    }
  }
});

document.querySelector("#back-to-site").addEventListener("click", showPublicSite);
document.querySelector(".sidebar .brand").addEventListener("click", (event) => {
  event.preventDefault();
  showPublicSite();
});
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
    if (editingCustomerProfile) profileCloseButton.click();
    profileMenu.classList.add("hidden");
    siteProfile.setAttribute("aria-expanded", "false");
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