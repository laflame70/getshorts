const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const COOKIE_NAME = process.env.COOKIE_NAME || 'videoapp_token';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// helper to set cookie
function sendToken(res, user) {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
}

// register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, name });
    await user.save();
    sendToken(res, user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    sendToken(res, user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// google auth
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
  // issue token and redirect to client
  const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '7d' });
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${clientUrl}/auth/google/success?token=${token}`);
});

// forgot password (simple link email) - placeholder
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'No user' });
  // create a token (short lived)
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your password',
      text: `Click here to reset: ${resetLink}`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email error' });
  }
});

module.exports = router;
