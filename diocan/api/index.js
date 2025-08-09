require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

// Passport Google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        email: profile.emails && profile.emails[0] && profile.emails[0].value,
        googleId: profile.id,
        name: profile.displayName
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}
));
app.use(passport.initialize());

// routes
app.use('/api/auth', authRoutes);

// protected example
app.get('/api/me', async (req, res) => {
  const token = req.cookies[process.env.COOKIE_NAME || 'videoapp_token'];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(payload.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// serve static in production (optional)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// connect mongodb and start
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoapp')
.then(()=> {
  console.log('MongoDB connected');
  app.listen(PORT, ()=> console.log('Server started on port', PORT));
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
