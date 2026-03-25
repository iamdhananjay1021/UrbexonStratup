import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS missing in .env");
}

// 🔥 Transporter Setup (Gmail example)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS, // ⚠️ App Password use karna (normal password nahi)
    },
});

/**
 * Email Service (Nodemailer)
 */
export const sendEmail = async ({
    to,
    subject,
    html,
    fromName = "UrbeXon",
    attachments = []
}) => {

    if (!to || !to.includes("@")) {
        console.error(`❌ Invalid email: ${to}`);
        return { success: false, error: "Invalid Email" };
    }

    try {
        const mailOptions = {
            from: `${fromName} <${EMAIL_USER}>`,
            to,
            subject: subject.trim(),
            html,
            replyTo: EMAIL_USER,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent to ${to} | ID: ${info.messageId}`);

        return { success: true, messageId: info.messageId };

    } catch (err) {
        console.error(`❌ Email failed to ${to}`);
        console.error(err.message);

        return { success: false, error: err.message };
    }
};