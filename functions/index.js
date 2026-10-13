const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { onUserCreated } = require("firebase-functions/v2/identity");

initializeApp();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

exports.sendWelcomeEmail = onUserCreated({ region: "us-central1" }, async (event) => {
  const user = event.data;
  if (!user.email) {
    logger.info("Welcome email skipped because the new account has no email address.", { uid: user.uid });
    return;
  }

  const firstName = user.displayName?.trim().split(/\s+/)[0] || "there";
  const safeName = escapeHtml(firstName);
  const mail = {
    to: user.email,
    message: {
      subject: "Welcome to MGM Automotive",
      text: `Hi ${firstName},\n\nWelcome to MGM Automotive. Your account is ready. You can now manage your vehicles, request a service, and keep your service history in one place.\n\nWhenever your vehicle needs attention, we're here to help.\n\nMGM Automotive`,
      html: `<div style="margin:0;background:#151713;padding:36px 16px;font-family:Arial,sans-serif;color:#f0f0e8"><div style="max-width:560px;margin:auto;border:1px solid #363932;background:#1c1f19"><div style="padding:28px 30px;border-bottom:1px solid #363932"><p style="margin:0;color:#c4e45f;font-size:12px;font-weight:bold;letter-spacing:2px">MGM AUTOMOTIVE</p><h1 style="margin:22px 0 0;font-size:30px;line-height:1.1">Welcome, ${safeName}.</h1></div><div style="padding:26px 30px;color:#c5c8be;font-size:15px;line-height:1.7"><p style="margin:0 0 16px">Your account is ready. You can now manage your vehicles, request a service, and keep your service history in one place.</p><p style="margin:0">Whenever your vehicle needs attention, we're here to help.</p><p style="margin:24px 0 0;color:#c4e45f;font-weight:bold">Care for the machine. Respect for the road.</p></div></div></div>`,
    },
    metadata: { type: "welcome", uid: user.uid },
  };

  try {
    await getFirestore().collection("mail").doc(`welcome-${user.uid}`).create(mail);
    logger.info("Welcome email queued.", { uid: user.uid });
  } catch (error) {
    if (error.code === 6 || error.code === "already-exists") {
      logger.info("Welcome email was already queued.", { uid: user.uid });
      return;
    }
    throw error;
  }
});