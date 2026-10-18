const firebaseConfig = window.MGM_FIREBASE_CONFIG;
const authStatus = document.querySelector("#customer-auth-status");
const googleButton = document.querySelector("#google-signin");

function finishCustomerSignIn(user) {
  window.dispatchEvent(new CustomEvent("mgm-auth-success", { detail: { user } }));
}

function showAuthError(error) {
  authStatus.textContent = error?.code === "auth/unauthorized-domain"
    ? `Domain "${window.location.hostname}" is not authorized for Firebase project "${firebaseConfig.projectId}". Add that exact domain under Authentication > Settings > Authorized domains.`
    : `Google sign-in failed (${error?.code || "unknown error"}). Check the Firebase config and Authentication settings.`;
}

async function initializeFirebaseAuth() {
  if (!firebaseConfig?.apiKey || !firebaseConfig?.authDomain || !firebaseConfig?.projectId || !firebaseConfig?.appId) {
    authStatus.textContent = "";
    googleButton.disabled = true;
    return;
  }

  try {
    const [{ getApps, initializeApp }, firebaseAuth, firestore] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js"),
    ]);
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = firebaseAuth.getAuth(app);
    const db = firestore.getFirestore(app);
    const accountRef = (userId) => firestore.doc(db, "accounts", userId);
    const isAdmin = async (user) => {
      if (!user) return false;
      const result = await firestore.getDoc(firestore.doc(db, "admins", user.uid));
      return result.exists();
    };
    window.MGM_CLOUD = {
      loadAccount: async (userId) => {
        const snapshot = await firestore.getDoc(accountRef(userId));
        return snapshot.exists() ? snapshot.data() : null;
      },
      saveAccount: async (userId, account) => firestore.setDoc(accountRef(userId), account, { merge: true }),
      loadAllAccounts: async () => {
        const snapshot = await firestore.getDocs(firestore.collection(db, "accounts"));
        return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      },
      saveAllAccounts: async (accounts) => {
        const batch = firestore.writeBatch(db);
        accounts.forEach((account) => batch.set(accountRef(account.id), account.data, { merge: true }));
        await batch.commit();
      },
      saveProfile: async (userId, profile) => firestore.setDoc(accountRef(userId), { profile }, { merge: true }),
      isAdmin,
    };
    window.MGM_SIGN_OUT = () => firebaseAuth.signOut(auth);
    const provider = new firebaseAuth.GoogleAuthProvider();
    firebaseAuth.onAuthStateChanged(auth, async (user) => {
      let admin = false;
      try {
        admin = await isAdmin(user);
      } catch (error) {
        console.error("Could not check administrator access", error);
      }
      window.dispatchEvent(new CustomEvent("mgm-auth-state", { detail: { user, admin } }));
    });
    window.addEventListener("mgm-demo-selected", () => {
      window.MGM_SIGN_OUT().catch((error) => console.error("Firebase sign-out failed", error));
    });
    window.MGM_ADMIN_SIGN_IN = async (email, password) => {
      const result = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      if (!(await isAdmin(result.user))) {
        await firebaseAuth.signOut(auth);
        throw new Error("This account is not on the administrator allowlist.");
      }
      return result.user;
    };
    if (window.MGM_ACCOUNT_MODE === "demo") await firebaseAuth.signOut(auth);
    const redirectResult = await firebaseAuth.getRedirectResult(auth);
    if (redirectResult?.user) finishCustomerSignIn(redirectResult.user);

    googleButton.addEventListener("click", async () => {
      googleButton.disabled = true;
      authStatus.textContent = "";
      try {
        const result = await firebaseAuth.signInWithPopup(auth, provider);
        finishCustomerSignIn(result.user);
      } catch (error) {
        showAuthError(error);
      } finally {
        googleButton.disabled = false;
      }
    });
    window.addEventListener("mgm-request-customer-reauth", async () => {
      if (!auth.currentUser) {
        window.dispatchEvent(new CustomEvent("mgm-role-switch-auth-failed"));
        return;
      }
      try {
        const result = await firebaseAuth.reauthenticateWithPopup(auth.currentUser, provider);
        window.dispatchEvent(new CustomEvent("mgm-role-switch-success", { detail: { user: result.user } }));
      } catch (error) {
        showAuthError(error);
        window.dispatchEvent(new CustomEvent("mgm-role-switch-auth-failed"));
      }
    });
    googleButton.disabled = false;
    authStatus.textContent = "";
  } catch (error) {
    googleButton.disabled = true;
    showAuthError(error);
    console.error("Firebase Auth initialization failed", error);
  }
}

initializeFirebaseAuth();