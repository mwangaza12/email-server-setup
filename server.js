import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Email sender setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Email Template
const emailTemplate = ({ name, email, message, service }) => `
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
                <span>${name}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span><a href="mailto:${email}">${email}</a></span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Message</span>
                <div class="message-content">
                    ${message.replace(/\n/g, '<br>')}
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

//Auto-Reply Template
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
        .contact-info {
            margin-top: 15px;
            font-size: 14px;
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
                Hi ${name},
            </div>
            
            <p>Thank you for contacting me through my portfolio website. I've received your message and will review it shortly.</p>
            
            <p>I typically respond to inquiries within 24-48 hours. If your request requires immediate attention, please don't hesitate to call me at <a href="tel:+254792918456">+254 792 918 456</a> or send me a dm on
             <div class="contact-info">
                    <p>📱 <a href="https://wa.me/+254792918456">WhatsApp</a></p>
                </div>
            .</p>
            
            <div class="signature">
                <p>Best regards,</p>
                <p><strong>Joseph Mwangaza</strong></p>
                <p>Software Developer</p>
            </div>
        </div>
        
        <div class="email-footer">
            <p>This is an automated response. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Josseph Mwangaza. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success:false,
      error: "Missing fields" });
  }

  try {
    // Notify you
    await transporter.sendMail({
      
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      html: emailTemplate({ name, email, message }),
    });

    // Auto reply
    await transporter.sendMail({
      from: `"Joseph Mwangaza" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thanks for contacting me!",
      html: emailTemplateAutoReply(name),
    });

    res.status(200).json({ success: true,message:"Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success:false,
        
        error: "Email failed to send" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});