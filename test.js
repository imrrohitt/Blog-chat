require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { startServer } = require('./groqService');

// Connect to MongoDB (make sure to have a running MongoDB server)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// User model for MongoDB
const User = require('./models/User');

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Create a new user
        const newUser = new User({ username, password });
        await newUser.save();

        res.json({ message: 'Signup successful', user: newUser });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Authenticate the user
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set the user ID in the session
        req.session.userId = user._id;

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/generate-chat', isAuthenticated, async (req, res) => {
    try {
        const userMessage = req.body.message || 'Default chat message';
        const generatedChat = await startServer(userMessage);

        // Store search history in MongoDB with both prompt and answer
        const userId = req.session.userId;
        const interaction = { prompt: userMessage, answer: generatedChat };
        await User.findByIdAndUpdate(userId, { $push: { searchHistory: interaction } });

        res.json({ generatedChat });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/search-history', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Retrieve user's detailed search history
        const user = await User.findById(userId);
        const searchHistory = user.searchHistory || [];

        res.json({ searchHistory });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
