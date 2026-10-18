# MGM Automotive

A responsive garage website inspired by the supplied reference, with a public services and reviews homepage plus a customer/admin service portal. Customers can track cars and bikes, submit repair or modification requests, review service records, and view payment status. The Mandar admin demo can review requests and update their statuses.

## Project links

- GitHub: <https://github.com/mandarbhoir01/Vehicle-Serivce-Management-Portal>

## Run locally

Open `index.html` in a browser, or serve this folder with any static HTTP server. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Firebase setup

1. In the Firebase Console, enable **Google** and **Email/Password** under Authentication. Add `localhost` and your Hosting domain to the authorized domains.
2. Enable **Cloud Firestore** in Native mode.
3. Confirm `firebase-config.js` contains the web app config from Project settings.
4. Create an admin account in Authentication, then create a document in the Firestore `admins` collection whose document ID is that account's Firebase Auth UID. Only accounts in this collection can access every customer's data.
5. Install and sign in to Firebase CLI, then select your project:

```sh
npm install -g firebase-tools
firebase login
firebase use --add
```

6. Deploy the website and Firestore rules:

```sh
firebase deploy --only hosting,firestore:rules
```

Firebase prints the live `web.app` URL after deployment. Hosting is configured without Cloud Functions.

## Account and data behavior

Google customers are prompted to create a profile the first time they sign in. Their profile, vehicles, requests, service records, and payment statuses are stored in Firestore under their authenticated UID. Existing browser-local account data is copied to Firestore the first time that account signs in. After profile setup, the profile control appears in the site header with profile management, dashboard access, and sign out.

Administrators sign in with the Firebase email/password account added to the `admins` collection. Admin request updates are saved to the affected customer account documents. The customer demo entry remains local-only. Public reviews remain browser-local. The UPI form is a demo simulation only: it does not contact a payment gateway, save UPI IDs, or transfer funds.
