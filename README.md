# MGM Automotive

A responsive garage website inspired by the supplied reference, with a public services and reviews homepage plus a customer/admin service portal. Customers can track cars and bikes, submit repair or modification requests, review service records, and view payment status. The Mandar admin demo can review requests and update their statuses.

## Run locally

Open `index.html` in a browser, or serve this folder with any static HTTP server. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Publish with Firebase

1. Create a Firebase project and register a web app in the Firebase Console.
2. Replace `null` in `firebase-config.js` with the web app config from Project settings. Enable Google and Phone providers in Authentication and authorize your Firebase Hosting domain.
3. Install and sign in to Firebase CLI, then select your project:

```sh
npm install -g firebase-tools
firebase login
firebase use --add
```

4. Deploy the website:

```sh
firebase deploy --only hosting
```

Firebase prints the live `web.app` URL after deployment. Hosting excludes the Cloud Functions source from public files.

## Demo behavior

Use **Log in** and choose the Mandar admin demo, or open **My garage** to enter the customer view. Book buttons open the service request form. Changes are saved in browser local storage and can be reset by clearing site data. The admin entry remains a demo role switch; it is not secure authentication.

## Enable customer Google and phone sign-in

1. Create a Firebase project and register a web app.
2. Enable Google and Phone in Firebase Authentication. Add the site domain to Firebase's authorized domains; configure billing and SMS quotas for phone verification.
3. Copy the Firebase web app config into `firebase-config.js`, replacing `null` with the config object shown in Firebase Console.
4. Serve the site over HTTPS (or `localhost`) and reload. Google sign-in redirects through Firebase; phone sign-in uses Firebase SMS OTP and reCAPTCHA.

No Firebase project values are included in this demo, so Google/phone sign-in stays inactive until configured.

## Enable welcome emails

The `functions/` Firebase Auth trigger queues one personalized welcome message when a new account is created. From the project root, install function dependencies and deploy the function:

```sh
npm install --prefix functions
firebase deploy --only functions
```

In Firebase Extensions, install **Trigger Email from Firestore**, configure an SMTP provider, and use the `mail` collection. The function skips accounts without an email address (for example, phone-only sign-ins). SMTP credentials belong in the extension's secret configuration, not in this site.

Real payment processing and server-side authorization/storage are not configured.
