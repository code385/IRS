"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserAndSendCredentials = exports.sendCredentialsEmail = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
/**
 * Send credentials email via Nodemailer (Gmail).
 * Works on web, Android, iOS - no EmailJS restrictions.
 *
 * Setup (one-time):
 * 1. Gmail: Enable 2FA, create App Password (Google Account → Security → App passwords)
 * 2. Run: firebase functions:config:set gmail.user="your@gmail.com" gmail.app_password="xxxx xxxx xxxx xxxx"
 * 3. Deploy: firebase deploy --only functions
 */
exports.sendCredentialsEmail = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { to, name, password, role } = data;
    if (!to || !name || !password || !role) {
        throw new functions.https.HttpsError("invalid-argument", "Missing to, name, password, or role.");
    }
    const config = functions.config();
    const gmailUser = (_a = config.gmail) === null || _a === void 0 ? void 0 : _a.user;
    const gmailAppPassword = (_b = config.gmail) === null || _b === void 0 ? void 0 : _b.app_password;
    if (!gmailUser || !gmailAppPassword) {
        throw new functions.https.HttpsError("failed-precondition", "Gmail not configured. Run: firebase functions:config:set gmail.user=\"...\" gmail.app_password=\"...\"");
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: gmailUser,
            pass: gmailAppPassword.replace(/\s/g, ""),
        },
    });
    const html = `
      <p>Hello ${name},</p>
      <p>Your account has been created for the IRS Timesheet app. Use the credentials below to sign in.</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p>Open the app, tap Login, and enter these details to access your dashboard.</p>
      <p>Please change your password after first login if the app supports it.</p>
    `;
    await transporter.sendMail({
        from: gmailUser,
        to: to.trim().toLowerCase(),
        subject: "Your IRS Timesheet login credentials",
        html,
    });
    return { success: true };
});
/**
 * Only Admin users can create new users.
 * Creates Firebase Auth user, Firestore user doc, and queues email with credentials.
 * Install "Trigger Email from Firestore" extension and use collection "mail" so the email is sent.
 */
exports.createUserAndSendCredentials = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { email, password, name, role } = data;
    if (!email || !password || !name || !role) {
        throw new functions.https.HttpsError("invalid-argument", "Missing email, password, name, or role.");
    }
    const callerUid = context.auth.uid;
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (callerRole !== "Admin" && callerRole !== "Super Admin") {
        throw new functions.https.HttpsError("permission-denied", "Only Admin or Super Admin can create users.");
    }
    if ((role === "Admin" || role === "Super Admin") && callerRole !== "Super Admin") {
        throw new functions.https.HttpsError("permission-denied", "Only Super Admin can create Admin or Super Admin users.");
    }
    const created = new Date();
    const dd = String(created.getDate()).padStart(2, "0");
    const mm = String(created.getMonth() + 1).padStart(2, "0");
    const yyyy = created.getFullYear();
    const createdStr = `${dd}/${mm}/${yyyy}`;
    const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
    });
    await db.collection("users").doc(userRecord.uid).set({
        name,
        email,
        role,
        status: "Active",
        created: createdStr,
    });
    const subject = "Your IRS Timesheet login credentials";
    const html = `
      <p>Hello ${name},</p>
      <p>Your account has been created for the IRS Timesheet app. Use the credentials below to sign in.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p>Open the app, tap Login, and enter these details to access your dashboard.</p>
      <p>Please change your password after first login if the app supports it.</p>
    `;
    await db.collection("mail").add({
        to: email,
        message: {
            subject,
            html,
        },
    });
    return {
        success: true,
        uid: userRecord.uid,
        message: "User created and credentials email queued.",
    };
});
//# sourceMappingURL=index.js.map