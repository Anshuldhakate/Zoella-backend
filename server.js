require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(cors({
  origin: '*',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define Schema & Model
const ContactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  message: String,
});
const Contact = mongoose.model('Contact', ContactSchema);

// Twilio Configuration
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// API Endpoint to Handle Form Submission
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Save to MongoDB
    const newContact = new Contact({ firstName, lastName, email, phone, message });
    await newContact.save();

    // WhatsApp Message
    const whatsappMessage = `New Contact Form Submission:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;

    // Send WhatsApp Message
    const response = await client.messages.create({
      from: process.env.WHATSAPP_NUMBER, 
      to: process.env.ADMIN_WHATSAPP,
      body: whatsappMessage,
    });

    console.log("Twilio Response:", response); // Debugging log

    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (error) {
    console.error("Twilio Error:", error);
    res.status(500).json({ error: 'Error submitting form' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
