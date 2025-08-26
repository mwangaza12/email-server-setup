import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json()); // To parse JSON body

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or SMTP settings for other providers
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Email sending route
app.post('/send-email', async (req, res) => {
    const { from, subject, text, html } = req.body;

    if (!from || !subject || (!text && !html)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const mailOptions = {
        from: `"Contact Form" <${process.env.EMAIL_USER}>`, // your email as sender
        to: process.env.EMAIL_USER, // send to yourself
        replyTo: from, // so you can reply to the sender
        subject,
        text,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
