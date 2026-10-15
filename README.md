# MGM Automotive

A responsive garage website inspired by the supplied reference, with a public services and reviews homepage plus a customer/admin service portal. Customers can track cars and bikes, submit repair or modification requests, review service records, and view payment status. The Mandar admin demo can review requests and update their statuses.

## Project links

- Website: <https://mgm-automotive.web.app>
- GitHub: <https://github.com/mandarbhoir01/Vehicle-Serivce-Management-Portal>

## Run locally

Open `index.html` in a browser, or serve this folder with any static HTTP server. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Free Firebase setup

1. Create a Firebase project and register a web app in the Firebase Console.
2. Enable **Google** in Authentication and authorize `localhost` plus your Firebase Hosting domain. No Phone provider is used.
3. Replace `null` in `firebase-config.js` with the web app config from Project settings.
4. Install and sign in to Firebase CLI, then select your project:

```sh
npm install -g firebase-tools
firebase login
firebase use --add
```

5. Deploy the website only:

```sh
firebase deploy --only hosting
```

Firebase prints the live `web.app` URL after deployment. Hosting is configured without Cloud Functions.

## Demo behavior

Use **Log in** and choose the Mandar admin demo, or open **My garage** to enter the customer view. Google customers are prompted to create a profile the first time they sign in; after setup, the website shows their account menu with profile management, dashboard access, and sign out. Profile details and service data are saved in browser local storage and can be reset by clearing site data. Book buttons open the service request form. The admin entry remains a demo role switch; it is not secure authentication.

Google sign-in and Hosting can run on Firebase's no-cost tier within its current limits. This prototype does not send SMS or custom welcome emails. Request, vehicle, and review data are stored in browser local storage. The UPI form is a demo simulation only: it does not contact a payment gateway, save UPI IDs, or transfer funds. Shared cloud storage, real payment processing, and production admin authorization are not configured.
