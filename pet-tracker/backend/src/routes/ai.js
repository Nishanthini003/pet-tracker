import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { auth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/temp';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/extract-text', auth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image and extract information for a petition. Return the following fields in JSON format: title (a concise title), description (detailed explanation), category (general category of the issue), and priority (low, medium, or high based on urgency). Make the response concise but informative."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (err) {
      // If JSON parsing fails, try to extract structured data from the text
      const textMatch = content.match(/title["\s:]+(.*?)[\n,}]/i);
      const descMatch = content.match(/description["\s:]+(.*?)[\n,}]/i);
      const catMatch = content.match(/category["\s:]+(.*?)[\n,}]/i);
      const prioMatch = content.match(/priority["\s:]+(.*?)[\n,}]/i);

      extractedData = {
        title: textMatch?.[1]?.trim()?.replace(/["']/g, ''),
        description: descMatch?.[1]?.trim()?.replace(/["']/g, ''),
        category: catMatch?.[1]?.trim()?.replace(/["']/g, ''),
        priority: prioMatch?.[1]?.trim()?.replace(/["']/g, '')
      };
    }

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.json(extractedData);
  } catch (error) {
    // Clean up the temporary file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

export default router;
