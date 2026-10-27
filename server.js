import express from "express";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Escape user input before putting it into HTML
const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// Email Template
const emailTemplate = ({ name, email, message }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Request</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .email-body {
            padding: 25px;
        }
        .email-footer {
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
        }
        h1 {
            margin: 0;
            font-size: 22px;
        }
        .detail-item {
            margin-bottom: 15px;
        }
        .detail-label {
            font-weight: 600;
            color: #2563eb;
            display: block;
            margin-bottom: 5px;
        }
        .message-content {
            background-color: #f5f7fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>📬 New Contact Request</h1>
        </div>

        <div class="email-body">
            <div class="detail-item">
                <span class="detail-label">Name</span>
                <span>${escapeHtml(name)}</span>
            </div>

            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></span>
            </div>

            <div class="detail-item">
                <span class="detail-label">Message</span>
                <div class="message-content">
                    ${escapeHtml(message).replace(/\n/g, "<br>")}
                </div>
            </div>
        </div>

        <div class="email-footer">
            <p>This message was sent via your portfolio contact form</p>
            <p>© ${new Date().getFullYear()} Joseph Mwangaza. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Auto-Reply Template
const emailTemplateAutoReply = (name) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank you for contacting me</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .email-body {
            padding: 25px;
        }
        .email-footer {
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
        }
        h1 {
            margin: 0;
            font-size: 22px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .signature {
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Thank You for Reaching Out</h1>
        </div>

        <div class="email-body">
            <div class="greeting">
                Hi ${escapeHtml(name)},
            </div>

            <p>Thank you for contacting me through my portfolio website. I've received your message and will review it shortly.</p>

            <p>I typically respond to inquiries within 24-48 hours. If your request is urgent, call me at <a href="tel:+254792918456">+254 792 918 456</a> or message me on <a href="https://wa.me/254792918456">WhatsApp</a>.</p>

            <div class="signature">
                <p>Best regards,</p>
                <p><strong>Joseph Mwangaza</strong></p>
                <p>Software Engineer</p>
            </div>
        </div>

        <div class="email-footer">
            <p>This is an automated response. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Joseph Mwangaza. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Health check (useful for Render)
app.get("/", (req, res) => res.send("OK"));

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  // Only set FROM_EMAIL once you have verified a domain in Resend
  const from = process.env.FROM_EMAIL;

  try {
    // Notify you
    const { error } = await resend.emails.send({
      from: from ? `Portfolio <${from}>` : "Portfolio <onboarding@resend.dev>",
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: `New message from ${name}`,
      html: emailTemplate({ name, email, message }),
    });

    if (error) {
      console.error("Notify email failed:", error);
      return res
        .status(500)
        .json({ success: false, error: "Email failed to send" });
    }

    // Auto-reply (only works with a verified domain)
    if (from) {
      const reply = await resend.emails.send({
        from: `Joseph Mwangaza <${from}>`,
        to: email,
        subject: "Thanks for contacting me!",
        html: emailTemplateAutoReply(name),
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