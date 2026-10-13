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
    authStatus.textContent = "Add Firebase web config and enable Google sign-in. Demo access remains available below.";
    googleButton.addEventListener("click", () => {
      authStatus.textContent = "Google sign-in needs Firebase config. Follow the Hosting setup in README.md.";
    });
    return;
  }

  try {
    const [{ initializeApp }, firebaseAuth] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = firebaseAuth.getAuth(app);
    const provider = new firebaseAuth.GoogleAuthProvider();
    firebaseAuth.onAuthStateChanged(auth, (user) => {
      window.dispatchEvent(new CustomEvent("mgm-auth-state", { detail: { user } }));
    });
    window.addEventListener("mgm-demo-selected", () => {
      firebaseAuth.signOut(auth).catch((error) => console.error("Firebase sign-out failed", error));
    });
    if (window.MGM_ACCOUNT_MODE === "demo") await firebaseAuth.signOut(auth);
    const redirectResult = await firebaseAuth.getRedirectResult(auth);
    if (redirectResult?.user) finishCustomerSignIn(redirectResult.user);

    googleButton.addEventListener("click", async () => {
      googleButton.disabled = true;
      authStatus.textContent = "Redirecting to Google...";
      try {
        await firebaseAuth.signInWithRedirect(auth, provider);
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
    authStatus.textContent = "Google sign-in is ready.";
  } catch (error) {
    googleButton.disabled = true;
    showAuthError(error);
    console.error("Firebase Auth initialization failed", error);
  }
}

initializeFirebaseAuth();