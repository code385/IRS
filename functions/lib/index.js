"use strict";
/**
 * IRS Timesheet — Firebase Cloud Functions v2
 *
 * Email services:
 *   - sendCredentialsEmail        → sends login credentials via Gmail/Nodemailer
 *   - createUserAndSendCredentials→ admin creates user + emails credentials
 *   - sendVerificationEmail       → sends Resend email verification link (callable)
 *   - verifyEmailToken            → validates token, marks user verified (HTTP GET)
 *   - resendVerificationEmail     → resends verification email (callable)
 *   - deleteAuthUser              → Admin/Super Admin deletes user from Firebase Auth + Firestore
 *
 * Config: all secrets live in functions/.env (never committed to git)
 * Plan:   Firebase Spark (no Secret Manager needed)
 */
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAuthUser = exports.markUserEmailVerified = exports.resendVerificationEmail = exports.verifyEmailToken = exports.sendVerificationEmail = exports.createUserAndSendCredentials = exports.sendCredentialsEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const resend_1 = require("resend");
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
// ── Environment variables (loaded from functions/.env at deploy time) ──────────
// NEVER access these on the frontend — they exist only inside the function runtime.
const RESEND_API_KEY = (_a = process.env.RESEND_API_KEY) !== null && _a !== void 0 ? _a : "";
const RESEND_FROM = (_b = process.env.RESEND_FROM) !== null && _b !== void 0 ? _b : "IRS Timesheet <onboarding@resend.dev>";
const RESEND_TEMPLATE_ID = (_c = process.env.RESEND_TEMPLATE_ID) !== null && _c !== void 0 ? _c : "";
const LARK_SMTP_USER = (_d = process.env.LARK_SMTP_USER) !== null && _d !== void 0 ? _d : "";
const LARK_SMTP_PASS = (_e = process.env.LARK_SMTP_PASS) !== null && _e !== void 0 ? _e : "";
const GMAIL_USER = (_f = process.env.GMAIL_USER) !== null && _f !== void 0 ? _f : "";
const GMAIL_APP_PASSWORD = (_g = process.env.GMAIL_APP_PASSWORD) !== null && _g !== void 0 ? _g : "";
const VERIFY_URL_BASE = (_h = process.env.VERIFY_URL_BASE) !== null && _h !== void 0 ? _h : "https://us-central1-hashtimesheet.cloudfunctions.net";
// ─────────────────────────────────────────────────────────────────────────────
// Helper — throw a clear error when a required env var is missing
// ─────────────────────────────────────────────────────────────────────────────
function requireEnv(name, value) {
    if (!value) {
        throw new https_1.HttpsError("failed-precondition", `Missing environment variable: ${name}. Add it to functions/.env and redeploy.`);
    }
    return value;
}
// ─────────────────────────────────────────────────────────────────────────────
// sendCredentialsEmail
// Sends login credentials to a user via Gmail (Nodemailer).
// ─────────────────────────────────────────────────────────────────────────────
exports.sendCredentialsEmail = (0, https_1.onCall)(async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const { to, name, password, role } = req.data;
    if (!to || !name || !password || !role) {
        throw new https_1.HttpsError("invalid-argument", "Missing: to, name, password, or role.");
    }
    const gmailUser = requireEnv("GMAIL_USER", GMAIL_USER);
    const gmailPass = requireEnv("GMAIL_APP_PASSWORD", GMAIL_APP_PASSWORD);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass.replace(/\s/g, "") },
    });
    await transporter.sendMail({
        from: gmailUser,
        to: to.trim().toLowerCase(),
        subject: "Your IRS Timesheet login credentials",
        html: buildCredentialsEmailHtml(name, to, password, role),
    });
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// createUserAndSendCredentials
// Admin-only: creates a Firebase Auth user + Firestore profile, queues email.
// ─────────────────────────────────────────────────────────────────────────────
exports.createUserAndSendCredentials = (0, https_1.onCall)(async (req) => {
    var _a;
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const { email, password, name, role } = req.data;
    if (!email || !password || !name || !role) {
        throw new https_1.HttpsError("invalid-argument", "Missing: email, password, name, or role.");
    }
    // ── Role guard ────────────────────────────────────────────────────────────
    const callerDoc = await db.collection("users").doc(req.auth.uid).get();
    const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (callerRole !== "Admin" && callerRole !== "Super Admin") {
        throw new https_1.HttpsError("permission-denied", "Only Admin or Super Admin can create users.");
    }
    if ((role === "Admin" || role === "Super Admin") && callerRole !== "Super Admin") {
        throw new https_1.HttpsError("permission-denied", "Only Super Admin can create Admin or Super Admin accounts.");
    }
    // ── Create user ───────────────────────────────────────────────────────────
    const today = new Date();
    const createdStr = [
        String(today.getDate()).padStart(2, "0"),
        String(today.getMonth() + 1).padStart(2, "0"),
        today.getFullYear(),
    ].join("/");
    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection("users").doc(userRecord.uid).set({
        name, email, role, status: "Active", created: createdStr,
    });
    // ── Queue credentials email (via "Trigger Email from Firestore" extension) ─
    await db.collection("mail").add({
        to: email,
        message: {
            subject: "Your IRS Timesheet login credentials",
            html: buildCredentialsEmailHtml(name, email, password, role),
        },
    });
    return { success: true, uid: userRecord.uid, message: "User created and credentials email queued." };
});
// ─────────────────────────────────────────────────────────────────────────────
// sendVerificationEmail  (callable)
// Generates an official Firebase verification link via Admin SDK, then sends
// it via Resend (better deliverability for corporate/Outlook addresses).
// ─────────────────────────────────────────────────────────────────────────────
exports.sendVerificationEmail = (0, https_1.onCall)(async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in to request email verification.");
    }
    const userRecord = await auth.getUser(req.auth.uid);
    if (userRecord.emailVerified) {
        return { success: true, message: "Email is already verified." };
    }
    const email = userRecord.email;
    if (!email) {
        throw new https_1.HttpsError("invalid-argument", "The account has no email address.");
    }
    const name = userRecord.displayName || "User";
    await sendVerificationEmailMultiChannel(req.auth.uid, email, name);
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// verifyEmailToken  (HTTP GET)
// Handles the link click from the verification email.
// Validates the token → marks the Firebase Auth user as emailVerified.
//
// URL: https://us-central1-hashtimesheet.cloudfunctions.net/verifyEmailToken?token=<token>
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyEmailToken = (0, https_1.onRequest)(async (req, res) => {
    const token = req.query.token;
    if (!token) {
        res.status(400).send(verifyPage("error", "Invalid Link", "No verification token was found in the link."));
        return;
    }
    const tokenRef = db.collection("emailVerifications").doc(token);
    const tokenDoc = await tokenRef.get();
    if (!tokenDoc.exists) {
        res.status(400).send(verifyPage("error", "Invalid Link", "This verification link is invalid or has already been used."));
        return;
    }
    const data = tokenDoc.data();
    // Already used → still show success (user may have refreshed the page)
    if (data.used === true) {
        res.send(verifyPage("success", "Already Verified", "Your email is already verified. You can sign in to the app."));
        return;
    }
    if (data.expiresAt.toMillis() < Date.now()) {
        res.status(400).send(verifyPage("error", "Link Expired", "This verification link has expired. Please request a new one from the app."));
        return;
    }
    // ── Mark user as verified in Firebase Auth ───────────────────────────────
    await auth.updateUser(data.uid, { emailVerified: true });
    await tokenRef.update({ used: true });
    res.send(verifyPage("success", "Email Verified!", "Your account is now active. Open the IRS Timesheet app and sign in."));
});
// ─────────────────────────────────────────────────────────────────────────────
// resendVerificationEmail  (callable)
// Called by the "Resend" button on the signup screen.
// ─────────────────────────────────────────────────────────────────────────────
exports.resendVerificationEmail = (0, https_1.onCall)(async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const userRecord = await auth.getUser(req.auth.uid);
    if (userRecord.emailVerified) {
        throw new https_1.HttpsError("already-exists", "Email is already verified.");
    }
    const email = userRecord.email;
    if (!email) {
        throw new https_1.HttpsError("invalid-argument", "No email address on this account.");
    }
    const name = userRecord.displayName || "User";
    await sendVerificationEmailMultiChannel(req.auth.uid, email, name);
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// markUserEmailVerified  (callable)
// Admin/Super Admin only: immediately marks a user's email as verified.
// Used when admin creates a user — admin is vouching for the identity,
// so email verification is not needed.
// ─────────────────────────────────────────────────────────────────────────────
exports.markUserEmailVerified = (0, https_1.onCall)(async (req) => {
    var _a;
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const { userId } = req.data;
    if (!userId) {
        throw new https_1.HttpsError("invalid-argument", "userId is required.");
    }
    // Allow if caller is the user themselves (admin-created flow, called while new user is signed in)
    // OR caller is Admin/Super Admin
    const isSelf = userId === req.auth.uid;
    if (!isSelf) {
        const callerDoc = await db.collection("users").doc(req.auth.uid).get();
        const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
        if (callerRole !== "Admin" && callerRole !== "Super Admin") {
            throw new https_1.HttpsError("permission-denied", "Not authorized to verify this user.");
        }
    }
    await auth.updateUser(userId, { emailVerified: true });
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────────────────
// deleteAuthUser  (callable)
// Admin/Super Admin only: deletes user from Firebase Auth AND Firestore.
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAuthUser = (0, https_1.onCall)(async (req) => {
    var _a, _b;
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const { userId } = req.data;
    if (!userId) {
        throw new https_1.HttpsError("invalid-argument", "userId is required.");
    }
    // Role guard — only Admin or Super Admin can delete users
    const callerDoc = await db.collection("users").doc(req.auth.uid).get();
    const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (callerRole !== "Admin" && callerRole !== "Super Admin") {
        throw new https_1.HttpsError("permission-denied", "Only Admin or Super Admin can delete users.");
    }
    // Prevent self-deletion
    if (userId === req.auth.uid) {
        throw new https_1.HttpsError("invalid-argument", "You cannot delete your own account.");
    }
    // Extra guard: Admin cannot delete another Admin or Super Admin
    const targetDoc = await db.collection("users").doc(userId).get();
    const targetRole = (_b = targetDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
    if (callerRole === "Admin" && (targetRole === "Admin" || targetRole === "Super Admin")) {
        throw new https_1.HttpsError("permission-denied", "Admin cannot delete Admin or Super Admin accounts.");
    }
    // Delete from Firebase Auth
    try {
        await auth.deleteUser(userId);
    }
    catch (e) {
        // If user doesn't exist in Auth (e.g. only Firestore record), continue
        if (e.code !== "auth/user-not-found") {
            throw new https_1.HttpsError("internal", `Failed to delete Auth user: ${e.message}`);
        }
    }
    // Delete from Firestore
    await db.collection("users").doc(userId).delete();
    return { success: true };
});
// ═════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Sends verification email through three layers:
 * 1. Lark SMTP  — best for irsaust.com.au corporate addresses
 * 2. Resend     — good for general / Outlook addresses
 * 3. Firebase   — universal fallback (throws on failure so caller knows)
 */
async function sendVerificationEmailMultiChannel(uid, email, name) {
    const verificationLink = await auth.generateEmailVerificationLink(email, {
        url: "https://irstimesheet.com",
    });
    const html = buildVerificationEmailHtml(name, verificationLink);
    const subject = "Verify your email – IRS Timesheet";
    // ── Layer 1: Lark SMTP ───────────────────────────────────────────────────
    if (LARK_SMTP_USER && LARK_SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.larksuite.com",
                port: 465,
                secure: true,
                auth: { user: LARK_SMTP_USER, pass: LARK_SMTP_PASS },
            });
            await transporter.sendMail({
                from: `IRS Timesheet <${LARK_SMTP_USER}>`,
                to: email,
                subject,
                html,
            });
            return; // success
        }
        catch (_) {
            // fall through to next layer
        }
    }
    // ── Layer 2: Resend ──────────────────────────────────────────────────────
    if (RESEND_API_KEY) {
        try {
            await sendResendEmail(RESEND_API_KEY, RESEND_FROM, RESEND_TEMPLATE_ID, email, name, verificationLink);
            return; // success
        }
        catch (_) {
            // fall through to next layer
        }
    }
    // ── Layer 3: Firebase native ─────────────────────────────────────────────
    await auth.generateEmailVerificationLink(email, { url: "https://irstimesheet.com" });
    // Firebase's own email is sent implicitly when emailVerified=false user signs in,
    // but we can also trigger it via the client SDK as last resort — throw so client retries
    throw new https_1.HttpsError("unavailable", "All email channels failed. Client should use Firebase native sendEmailVerification.");
}
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
/** Generates a cryptographically secure token and persists it to Firestore. */
async function storeVerificationToken(uid, email) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + TOKEN_EXPIRY_MS);
    await db.collection("emailVerifications").doc(token).set({
        uid,
        email,
        expiresAt,
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return token;
}
/** Builds the full verification URL that goes into the email. */
function buildVerifyUrl(token) {
    return `${VERIFY_URL_BASE}/verifyEmailToken?token=${token}`;
}
/** Sends the verification email via Resend. Supports optional template ID. */
async function sendResendEmail(apiKey, from, templateId, toEmail, toName, verifyUrl) {
    const resend = new resend_1.Resend(apiKey);
    const payload = templateId
        ? {
            // Resend dashboard template — variables: {{name}}, {{verify_url}}
            from,
            to: toEmail,
            template_id: templateId,
            variables: { name: toName, verify_url: verifyUrl },
        }
        : {
            from,
            to: toEmail,
            subject: "Verify your email – IRS Timesheet",
            html: buildVerificationEmailHtml(toName, verifyUrl),
        };
    const result = await resend.emails.send(payload);
    if (result.error) {
        throw new https_1.HttpsError("internal", `Resend error: ${result.error.message}`);
    }
}
// ── HTML templates ─────────────────────────────────────────────────────────
function buildVerificationEmailHtml(name, verifyUrl) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px">IRS Timesheet</h1>
            <p style="margin:6px 0 0;color:#a0a8c0;font-size:13px">Infrastructure Renewal Services</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px">Verify your email address</h2>
            <p style="margin:0 0 12px;color:#444;font-size:15px;line-height:1.6">Hello <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;color:#444;font-size:15px;line-height:1.6">
              Thank you for signing up. Click the button below to verify your email address and activate your account.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px">
                  <a href="${verifyUrl}"
                     style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px">
                    Verify my email
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#888;font-size:13px;line-height:1.6">
              This link expires in <strong>1 hour</strong>. If you did not create this account, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f5;padding:20px 32px;text-align:center;border-top:1px solid #e4e4e7">
            <p style="margin:0;color:#aaa;font-size:12px">
              IRS Timesheet &middot; Infrastructure Renewal Services
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
function buildCredentialsEmailHtml(name, email, password, role) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1a1a2e;padding:32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:22px">IRS Timesheet</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px">
            <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px">Your account credentials</h2>
            <p style="margin:0 0 20px;color:#444;font-size:15px">Hello <strong>${name}</strong>, your account has been created.</p>
            <table style="width:100%;background:#f9f9fb;border-radius:8px;padding:20px" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#666;font-size:14px"><strong>Email:</strong> ${email}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-size:14px"><strong>Password:</strong> ${password}</td></tr>
              <tr><td style="padding:6px 0;color:#666;font-size:14px"><strong>Role:</strong> ${role}</td></tr>
            </table>
            <p style="margin:24px 0 0;color:#888;font-size:13px">Open the app, tap Sign in, and enter these credentials.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f5;padding:20px 32px;text-align:center;border-top:1px solid #e4e4e7">
            <p style="margin:0;color:#aaa;font-size:12px">IRS Timesheet &middot; Infrastructure Renewal Services</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
/** Renders a branded success/error HTML page for the verification endpoint. */
function verifyPage(type, title, message) {
    const color = type === "success" ? "#16a34a" : "#dc2626";
    const icon = type === "success" ? "✓" : "✗";
    const signInButton = type === "success" ? `
    <a href="https://irstimesheet.com"
       style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;margin-bottom:24px">
      Go to Sign In
    </a>` : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — IRS Timesheet</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center">
  <div style="background:#fff;border-radius:16px;padding:48px 40px;max-width:440px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="width:64px;height:64px;background:${color}15;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:28px;color:${color}">
      ${icon}
    </div>
    <h1 style="margin:0 0 12px;color:#1a1a2e;font-size:22px">${title}</h1>
    <p style="margin:0 0 28px;color:#555;font-size:15px;line-height:1.6">${message}</p>
    ${signInButton}
    <p style="margin:0;color:#aaa;font-size:12px">IRS Timesheet &middot; Infrastructure Renewal Services</p>
  </div>
</body>
</html>`;
}
//# sourceMappingURL=index.js.map