import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import morgan from 'morgan';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import petitionRoutes from './routes/petitionRoutes.js';
import dashboardRoutes from './routes/dashboard.js';
import ocrRoutes from './routes/ocrRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/petitions');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create uploads directory:', err);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/department', departmentRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const port =  5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })  
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong! ' + err.message
  });
});
