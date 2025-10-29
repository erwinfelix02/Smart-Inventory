const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendStockAlertEmail(recipients, productName, severity, stock) {
  if (!recipients || recipients.length === 0) return;

  const subject = `[Inventory Alert] ${severity} Stock for ${productName}`;
  const message = `
    <h2>Inventory Alert</h2>
    <p><b>Product:</b> ${productName}</p>
    <p><b>Severity:</b> ${severity}</p>
    <p><b>Remaining Stock:</b> ${stock}</p>
    <p>Please check your Inventory Dashboard for more details.</p>
  `;

  const mailOptions = {
    from: `"Smart Inventory" <${process.env.EMAIL_USER}>`,
    to: recipients.join(", "),
    subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Alert email sent to: ${recipients.join(", ")}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

module.exports = { sendStockAlertEmail };
