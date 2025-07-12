import Petition from '../models/Petition.js';
import multer from 'multer';
import path from 'path';
// import fs from 'fs/promises';
import { promises as fs } from 'fs';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { NGROK_URL } from '../services/urls.js';
import mongoose from 'mongoose';
import { stringSimilarity } from 'string-similarity-js';
// import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

// Configure multer for file uploads
// const uploadPdf = multer({ 
//   dest: 'uploads/',
//   limits: { 
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 1 // Allow only single file
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'application/pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF files are allowed'), false);
//     }
//   }
// }).single('pdf');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/petitions/');
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
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('image');

// Create a new petition
export const createPetition = async (req, res) => {
  try {
    // Handle file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { title, address, description, category, priority, contact, submittedBy } = req.body;
        
        // Create petition object
        const petitionData = {
          title,
          description,
          address,
          category,
          priority,
          status: 'pending',
          contact,
          submittedBy
        };

        // Add creator if authenticated (optional)
        if (req.user?._id) {
          petitionData.creator = req.user._id;
        }

        // Add image path if uploaded
        if (req.file) {
          petitionData.image = req.file.path;
        }

        // Save to database
        const petition = new Petition(petitionData);
        await petition.save();

        // Populate creator if exists
        if (petition.creator) {
          await petition.populate('creator', 'name mobile');
        }

        res.status(201).json({
          message: 'Petition created successfully',
          data: petition
        });
      } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(400).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create petition: ' + error.message
    });
  }
};

// Get all petitions with visibility rules
export const getPetitions = async (req, res) => {
  try {
    const { category, status, limit = 10, page = 1 } = req.query;
    const query = {};

    // Apply visibility rules based on user role
    if (req.user.role === 'department_officer') {
      // Department officers can only see petitions from their department
      query.category = req.user.department;
    } else if (req.user.role === 'user') {
      // Regular users can only see their own petitions
      query.creator = req.user._id;
    }

    // Apply additional filters
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [petitions, total] = await Promise.all([
      Petition.find(query)
        .populate('creator', 'mobile')
        .populate('assignedTo', 'mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Petition.countDocuments(query)
    ]);

    res.json({
      data: petitions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching petitions: ' + error.message
    });
  }
};

// Get single petition with visibility check
export const getPetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('creator', 'mobile')
      .populate('assignedTo', 'mobile')
      .populate('comments.user', 'mobile');
    
    if (!petition) {
      return res.status(404).json({
        error: 'Petition not found'
      });
    }

    // Check visibility permissions
    const isCreator = petition.creator._id.toString() === req.user._id.toString();
    const isDepartmentOfficer = req.user.role === 'department_officer' && 
                               petition.category === req.user.department;

    if (!isCreator && !isDepartmentOfficer) {
      return res.status(403).json({
        error: 'You do not have permission to view this petition'
      });
    }

    res.json({ data: petition });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching petition: ' + error.message
    });
  }
};

export const updatePetitionStatus = async (req, res) => {
  try {
    const { status } = req.body; // Now expecting userId in body
    const { id } = req.params;
    console.log(status, id);
    
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const petition = await Petition.findById(id)
    if (!petition) {
      return res.status(404).json({ error: 'Petition not found' });
    }

    const updatedPetition = await petition.updateOne({ status })

    return res.status(200).json({
      success: true,
      data: {
        _id: updatedPetition._id,
        status: updatedPetition.status,
        updatedAt: updatedPetition.updatedAt
      }
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getDepartmentPetitions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const officer = await User.findById(userId);
    console.log(officer);
    if (!officer || officer.role !== 'department_officer') {
      return res.status(403).json({ message: 'Access denied or invalid user' });
    }
    const petitions = await Petition.find({ category: officer.department });

    res.status(200).json({ message: "Petitions retrieved successfully", petitions });
  } catch (error) {
    console.error("Error fetching department petitions:", error);
    res.status(500).json({ message: 'Error fetching petitions', error });
  }
  
};

export const getPetitionsAdmin = async (req, res) => {
  try {
    // Use query parameter instead of body for GET requests
    const department = req.query.department;
    
    // Build query - if department specified, filter by it
    const query = department ? { category: department } : {};
    
    const petitions = await Petition.find(query)
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    res.status(200).json({
      success: true,
      count: petitions.length,
      data: petitions
    });
  } catch (error) {
    console.error("Error fetching petitions:", error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching petitions',
      error: error.message 
    });
  }
};

// petitionController.js
export const getAllPetitions = async (req, res) => {
  try {
    const petitions = await Petition.find();
    res.status(200).json({ message: "Petitions retrieved successfully", petitions });
  } catch (error) {
    console.error("Error fetching all petitions:", error);
    res.status(500).json({ message: 'Error fetching petitions', error });
  }
};

export const classifyPetition = async (req, res) => {
  try {
    const { title, description } = req.body;
    const response = await axios.post(`${NGROK_URL}/classify`, {
      title,
      description
    })
    console.log(response.data.predicted_category);
    if(response.data){
      res.status(200).json({
        success: true,
        category: response.data.predicted_category
      })
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: 'Failed to communicate with the classification service. Please try again later.' });
  }
}

export const getPetitionsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const petitions = await Petition.find({ creator: userId })
      .populate('creator', 'name email') // Populate creator details (adjust fields as needed)
      .populate('assignedTo', 'name email') // Populate assigned user details
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!petitions || petitions.length === 0) {
      return res.status(200).json({ 
        message: 'No petitions found for this user',
        petitions: [] 
      });
    }

    res.status(200).json({
      success: true,
      count: petitions.length,
      data: petitions
    });

  } catch (error) {
    console.error('Error fetching user petitions:', error);
    res.status(500).json({ 
      message: 'Server error while fetching petitions',
      error: error.message 
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const petitionId = req.params.id;
    console.log(petitionId);
    
    const { comment } = req.body;

    const petition = await Petition.findById(petitionId);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    // Add the comment
    petition.comments.push({
      text: comment
    });
    // Save the updated petition
    await petition.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      petition
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while adding comment',
      error: error.message 
    });
  }
};

export const findSimilar = async (req, res) => {
  try {
    const { title, description, address } = req.body;

    if (!title || !description || !address) {
      return res.status(400).json({ 
        message: 'Title, description and address are required' 
      });
    }

    // Find all petitions in the database (excluding rejected and drafts)
    const allPetitions = await Petition.find({ 
      status: { $nin: ['rejected', 'draft'] }
    }).select('title description address status createdAt');

    // Similarity thresholds
    const SIMILARITY_THRESHOLDS = {
      title: 0.8,      // 80% similar
      description: 0.6, // 60% similar
      address: 0.85    // 85% similar
    };

    // Calculate similarity scores for each petition
    const similarPetitions = allPetitions.map(petition => {
      const scores = {
        title: stringSimilarity(title, petition.title),
        description: stringSimilarity(description, petition.description),
        address: stringSimilarity(address, petition.address),
        overall: 0
      };
      scores.overall = (scores.title + scores.description + scores.address) / 3;
      
      return {
        petition,
        scores,
        isSimilar: (
          scores.title >= SIMILARITY_THRESHOLDS.title &&
          scores.description >= SIMILARITY_THRESHOLDS.description &&
          scores.address >= SIMILARITY_THRESHOLDS.address
        )
      };
    }).filter(item => item.isSimilar);

    // First check for resolved petitions (highest priority)
    const resolvedPetition = similarPetitions.find(
      item => item.petition.status === 'resolved'
    );

    if (resolvedPetition) {
      return res.json({ 
        exists: true,
        isResolved: true,
        message: 'This issue was already reported and resolved',
        similarPetition: resolvedPetition.petition,
        similarityScore: resolvedPetition.scores.overall,
        status: 'resolved'
      });
    }

    // Then check for active petitions (new, pending, in_progress)
    const activeStatuses = ['new', 'pending', 'in_progress'];
    const activePetition = similarPetitions.find(
      item => activeStatuses.includes(item.petition.status)
    );

    if (activePetition) {
      return res.json({ 
        exists: true,
        isResolved: false,
        message: `A similar ${activePetition.petition.status.replace('_', ' ')} petition already exists`,
        similarPetition: activePetition.petition,
        similarityScore: activePetition.scores.overall,
        status: activePetition.petition.status,
        suggestion: 'Consider supporting the existing petition instead'
      });
    }

    // No similar petitions found
    res.json({ 
      exists: false,
      message: 'No similar petitions found'
    });

  } catch (err) {
    console.error('Error finding similar petitions:', err);
    res.status(500).json({ 
      message: 'Failed to check for similar petitions',
      error: err.message 
    });
  }
};