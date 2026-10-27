import express from "express";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const nl2br = (s) => escapeHtml(s).replace(/\r?\n/g, "<br>");

const firstNameOf = (name) => name.trim().split(/\s+/)[0];

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Shared shell: table layout + inline styles for email-client support */
/* ------------------------------------------------------------------ */

const layout = ({ preheader, content, footer }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title></title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;">
          <tr>
            <td style="padding:32px 36px;font-family:${FONT};font-size:15px;line-height:1.65;color:#18181b;">
              ${content}
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="padding:16px 8px;font-family:${FONT};font-size:12px;line-height:1.5;color:#71717a;text-align:center;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ------------------------------------------------------------------ */
/* Notification to you                                                 */
/* ------------------------------------------------------------------ */

const label = (text) =>
  `<div style="font-size:12px;color:#71717a;margin:0 0 2px 0;">${text}</div>`;

const notificationHtml = ({ name, email, message }) =>
  layout({
    preheader: `${name} wrote: ${message.slice(0, 90)}`,
    content: `
      <p style="margin:0 0 24px 0;font-size:17px;font-weight:600;color:#18181b;">
        New message from ${escapeHtml(name)}
      </p>

      ${label("Name")}
      <p style="margin:0 0 16px 0;">${escapeHtml(name)}</p>

      ${label("Email")}
      <p style="margin:0 0 16px 0;">
        <a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a>
      </p>

      ${label("Message")}
      <div style="margin:0 0 28px 0;padding:2px 0 2px 14px;border-left:3px solid #d4d4d8;">
        ${nl2br(message)}
      </div>

      <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent("Re: your message")}"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 18px;border-radius:6px;">
        Reply to ${escapeHtml(firstNameOf(name))}
      </a>
    `,
    footer: "Sent from your portfolio contact form.",
  });

const notificationText = ({ name, email, message }) =>
  `New message from ${name}

Name: ${name}
Email: ${email}

${message}

Reply directly to this email to respond to ${firstNameOf(name)}.`;

/* ------------------------------------------------------------------ */
/* Auto-reply to the visitor                                           */
/* ------------------------------------------------------------------ */

const autoReplyHtml = ({ name, message }) =>
  layout({
    preheader: "Thanks for getting in touch. I'll reply personally within a day or two.",
    content: `
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(firstNameOf(name))},</p>

      <p style="margin:0 0 16px 0;">
        Thanks for getting in touch. Your message came through and I'll reply
        personally, usually within a day or two.
      </p>

      <p style="margin:0 0 24px 0;">
        If it's time-sensitive, message me on
        <a href="https://wa.me/254792918456" style="color:#2563eb;text-decoration:none;">WhatsApp</a>
        or call <a href="tel:+254792918456" style="color:#2563eb;text-decoration:none;">+254 792 918 456</a>.
      </p>

      <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;">Here's a copy of what you sent:</p>
      <div style="margin:0 0 28px 0;padding:2px 0 2px 14px;border-left:3px solid #d4d4d8;color:#52525b;font-size:14px;">
        ${nl2br(message)}
      </div>

      <p style="margin:0;">Talk soon,</p>
      <p style="margin:0;font-weight:600;">Joseph Mwangaza</p>
      <p style="margin:0;color:#71717a;font-size:14px;">Software Developer</p>
    `,
    footer: "You're receiving this because you used the contact form on my portfolio.",
  });

const autoReplyText = ({ name, message }) =>
  `Hi ${firstNameOf(name)},

Thanks for getting in touch. Your message came through and I'll reply personally, usually within a day or two.

If it's time-sensitive, message me on WhatsApp (https://wa.me/254792918456) or call +254 792 918 456.

Here's a copy of what you sent:

${message}

Talk soon,
Joseph Mwangaza
Software Developer`;

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

app.get("/", (req, res) => res.send("OK"));

app.post("/send-email", async (req, res) => {
  const name = String(req.body?.name ?? "").trim().slice(0, 100);
  const email = String(req.body?.email ?? "").trim().slice(0, 254);
  const message = String(req.body?.message ?? "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: "Invalid email address" });
  }

  // Only set FROM_EMAIL once you have verified a domain in Resend
  const from = process.env.FROM_EMAIL;
  const data = { name, email, message };

  try {
    // Notify you
    const { error } = await resend.emails.send({
      from: from
        ? `Joseph Mwangaza Portfolio <${from}>`
        : "Portfolio <onboarding@resend.dev>",
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: `New message from ${name}`,
      html: notificationHtml(data),
      text: notificationText(data),
    });

    if (error) {
      console.error("Notify email failed:", error);
      return res
        .status(500)
        .json({ success: false, error: "Email failed to send" });
    }

    // Auto-reply (needs a verified domain)
    if (from) {
      const reply = await resend.emails.send({
        from: `Joseph Mwangaza <${from}>`,
        to: email,
        replyTo: process.env.TO_EMAIL,
        subject: "Thanks for reaching out",
        html: autoReplyHtml(data),
        text: autoReplyText(data),
      });
      if (reply.error) console.error("Auto-reply failed:", reply.error);
    }

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, error: "Email failed to send" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});