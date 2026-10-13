const firebaseConfig = window.MGM_FIREBASE_CONFIG;
const authStatus = document.querySelector("#customer-auth-status");
const googleButton = document.querySelector("#google-signin");
const phoneForm = document.querySelector("#phone-form");
const otpForm = document.querySelector("#otp-form");
const otpCode = document.querySelector("#otp-code");
const phoneNumber = document.querySelector("#phone-number");
const authSubmitError = (error) => {
  const message = error?.code === "auth/unauthorized-domain"
    ? "This site domain is not authorized in Firebase Authentication."
    : error?.code === "auth/popup-closed-by-user"
      ? "The Google sign-in window was closed before finishing."
      : error?.code === "auth/invalid-phone-number"
        ? "Enter a valid phone number with its country code."
        : error?.code === "auth/invalid-verification-code"
          ? "That code did not match. Check the SMS and try again."
          : "Sign-in could not be completed. Check your Firebase settings and try again.";
  authStatus.textContent = message;
};

let auth;
let googleProvider;
let recaptchaVerifier;
let confirmationResult;

function finishCustomerSignIn(user) {
  window.dispatchEvent(new CustomEvent("mgm-auth-success", { detail: { user } }));
}

function setStatus(message) {
  authStatus.textContent = message;
}

async function initializeFirebaseAuth() {
  if (!firebaseConfig?.apiKey || !firebaseConfig?.authDomain || !firebaseConfig?.projectId || !firebaseConfig?.appId) {
    setStatus("Google redirect and SMS codes need your Firebase web config. Add it in firebase-config.js and enable Google / Phone providers.");
    googleButton.addEventListener("click", () => setStatus("Google cannot redirect until Firebase is configured. Follow the Firebase setup in README.md."));
    phoneForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setStatus("SMS verification needs Firebase config, Phone sign-in enabled, and an authorized domain.");
    });
    return;
  }

  try {
    const [{ initializeApp }, firebaseAuth] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
    ]);
    const app = initializeApp(firebaseConfig);
    auth = firebaseAuth.getAuth(app);
    googleProvider = new firebaseAuth.GoogleAuthProvider();
    const redirectResult = await firebaseAuth.getRedirectResult(auth);
    if (redirectResult?.user) finishCustomerSignIn(redirectResult.user);

    googleButton.addEventListener("click", async () => {
      googleButton.disabled = true;
      setStatus("Redirecting to Google...");
      try {
        await firebaseAuth.signInWithRedirect(auth, googleProvider);
      } catch (error) {
        authSubmitError(error);
      } finally {
        googleButton.disabled = false;
      }
    });

    phoneForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!recaptchaVerifier) {
        recaptchaVerifier = new firebaseAuth.RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const sendButton = phoneForm.querySelector("button[type=submit]");
      sendButton.disabled = true;
      setStatus("Sending your verification code...");
      try {
        confirmationResult = await firebaseAuth.signInWithPhoneNumber(auth, phoneNumber.value.trim(), recaptchaVerifier);
        phoneForm.classList.add("hidden");
        otpForm.classList.remove("hidden");
        otpCode.focus();
        setStatus(`A verification code was sent to ${phoneNumber.value.trim()}.`);
      } catch (error) {
        authSubmitError(error);
        if (recaptchaVerifier) {
          await recaptchaVerifier.clear();
          recaptchaVerifier = null;
        }
      } finally {
        sendButton.disabled = false;
      }
    });

    otpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!confirmationResult) return;
      const verifyButton = otpForm.querySelector("button[type=submit]");
      verifyButton.disabled = true;
      setStatus("Verifying your code...");
      try {
        const result = await confirmationResult.confirm(otpCode.value.trim());
        finishCustomerSignIn(result.user);
      } catch (error) {
        authSubmitError(error);
      } finally {
        verifyButton.disabled = false;
      }
    });

    document.querySelector("#change-number").addEventListener("click", async () => {
      otpForm.classList.add("hidden");
      phoneForm.classList.remove("hidden");
      otpCode.value = "";
      confirmationResult = null;
      if (recaptchaVerifier) {
        await recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      setStatus("Enter your phone number to request a new code.");
      phoneNumber.focus();
    });

    googleButton.disabled = false;
    phoneForm.querySelector("button[type=submit]").disabled = false;
    setStatus("Google sign-in and SMS verification are ready.");
  } catch (error) {
    googleButton.disabled = true;
    phoneForm.querySelector("button[type=submit]").disabled = true;
    setStatus("Firebase could not start. Check the web config and network, then reload.");
    console.error("Firebase Auth initialization failed", error);
  }
}

document.querySelector("#customer-entry").addEventListener("click", () => {
  phoneForm.classList.remove("hidden");
  otpForm.classList.add("hidden");
  if (auth) setStatus("Use Google or verify your phone to continue.");
});

initializeFirebaseAuth();