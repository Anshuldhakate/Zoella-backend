require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
// const axios = require("axios"); //  Commenting out WhatsApp-related dependency

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Check required environment variables
if (!process.env.MONGO_URI /* || !process.env.META_ACCESS_TOKEN || !process.env.PHONE_NUMBER_ID || !process.env.ADMIN_WHATSAPP || !process.env.WEBHOOK_VERIFY_TOKEN */) {
  console.error("❌ Missing required environment variables. Please check your .env file.");
  process.exit(1);
}

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Define Schema & Model
const ContactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  message: String,
});
const Contact = mongoose.model("Contact", ContactSchema);

// ✅ Form Submission Endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Save to MongoDB
    const newContact = new Contact({ firstName, lastName, email, phone, message });
    await newContact.save();

    /* 
    // Send WhatsApp Message
    const whatsappMessage = `New Contact Submission:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: process.env.ADMIN_WHATSAPP,
        type: "text",
        text: { body: whatsappMessage },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📩 Meta API Response:", response.data);
    */

    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("❌ Error saving form data:", error.message);
    res.status(500).json({ error: "Error submitting form" });
  }
});

/* 
// ✅ Webhook Verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Webhook for Receiving WhatsApp Messages
app.post("/webhook", (req, res) => {
  let body = req.body;
  console.log("📩 Incoming WhatsApp Message:", JSON.stringify(body, null, 2));

  if (!body.entry || body.entry.length === 0) {
    console.log("⚠️ No valid webhook event received.");
    return res.sendStatus(200);
  }

  if (body.object === "whatsapp_business_account") {
    body.entry.forEach((entry) => {
      entry.changes.forEach((change) => {
        if (change.value.messages) {
          let message = change.value.messages[0];
          let phoneNumber = message.from;
          let text = message.text.body;

          console.log(`📩 Received message from ${phoneNumber}: ${text}`);

          // ✅ Auto-reply
          axios.post(
            `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: "whatsapp",
              to: phoneNumber,
              type: "text",
              text: { body: `Hello! Thanks for your message: "${text}". We'll get back to you soon.` },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          ).then(response => {
            console.log("✅ Auto-reply sent:", response.data);
          }).catch(error => {
            console.error("❌ Auto-reply failed:", error.response?.data || error.message);
          });
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
*/

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("✅ Zoella Backend is running!");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
