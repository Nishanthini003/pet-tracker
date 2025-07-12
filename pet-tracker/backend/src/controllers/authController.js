import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DepartmentOfficer from '../models/DeptOfficer.js';
import bcrypt from 'bcryptjs';
import twilio from 'twilio'
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;
const client = new twilio(accountSid, authToken);
const otpStore = {};

export const sendOtp = async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phoneNumber] = otp;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+91${phoneNumber}`; // Assuming India as default
    }
    // Send OTP using Twilio
    try {
      const response = await client.messages.create({
        body: `Your OTP is ${otp}`,
        to: phoneNumber,
        from: phone // Your Twilio number
      });
      console.log(response);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({
      status: 'success',
      message: 'OTP sent successfully',
      otp
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log(otp);
    console.log(otpStore);
    console.log(otpStore[phoneNumber]);
    
    // Validate OTP
    if (otpStore[phoneNumber] !== otp) {
      return res.status(401).json({
        error: 'Invalid OTP'
      });
    }
    
    // Remove OTP from store
    delete otpStore[phoneNumber];
    
    res.json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Regular user signup
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: 'user'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role
        }
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creating user: ' + error.message
    });
  }
};

// Department officer signup
export const officerLogin = async (req, res) => {
  try {
    const { email, badgeNumber, password } = req.body;
    console.log(email, badgeNumber, password);
    
    // Check if officer exists with email and badgeNumber
    const officer = await DepartmentOfficer.findOne({ email, badgeNumber });
    
    if (!officer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, officer.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(officer._id);
    
    res.json({
      status: 'success',
      token,
      user: {
        _id: officer._id,
        email: officer.email,
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        department: officer.department,
        role: 'department_officer',
        photo: officer.photo
      }
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Logged in successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error logging in: ' + error.message
    });
  }
};
