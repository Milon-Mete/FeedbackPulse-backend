const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
require('dotenv').config(); // Load .env variables

app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ✅ Mongoose Schema & Model
const formSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    rating: Number,
    mood: String,
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Form = mongoose.model('Form', formSchema);

// ✅ Routes

app.get('/', (req, res) => {
    res.send('hello');
});

// 🔄 Save Form Data
app.post('/form', async (req, res) => {
    const { name, email, message, rating } = req.body;

    const sentimentScore = sentiment.analyze(message).score;
    let mood = '😐';
    if (sentimentScore > 1) mood = '😄';
    else if (sentimentScore < -1) mood = '😡';

    try {
        const newForm = new Form({ name, email, message, rating, mood });
        await newForm.save();
        res.status(200).json({ message: 'Form data saved successfully' });
    } catch (err) {
        console.error('Error saving form data:', err);
        res.status(500).json({ error: 'Failed to save form data' });
    }
});


// 🔎 Get Feedback by Email
app.get('/userrating', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required in query parameters' });
    }

    try {
        const userFeedback = await Form.find({ email }).sort({ submittedAt: -1 });
        res.status(200).json(userFeedback);
    } catch (err) {
        console.error('Error fetching user feedback:', err);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// 📋 Get All Feedback
app.get('/allratings', async (req, res) => {
    try {
        const allFeedback = await Form.find().sort({ submittedAt: -1 });
        res.status(200).json(allFeedback);
    } catch (err) {
        console.error('Error fetching all feedback:', err);
        res.status(500).json({ error: 'Failed to fetch all feedback' });
    }
});

// 🚀 Start Server
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
