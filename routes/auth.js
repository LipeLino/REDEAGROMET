const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../models/User'); // Adjust based on your model structure
const { sendRegistrationConfirmation } = require('../utils/emailService');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
    
    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      confirmationToken,
      confirmationTokenExpiry: tokenExpiry,
      isVerified: false
    });
    
    // Send confirmation email
    await sendRegistrationConfirmation(newUser, confirmationToken);
    
    // Respond with success (excluding password and token)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isVerified: newUser.isVerified
    };
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
});

module.exports = router;