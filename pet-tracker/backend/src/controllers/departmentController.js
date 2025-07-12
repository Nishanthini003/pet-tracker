import bcrypt from 'bcryptjs';
import  DepartmentOfficer  from '../models/DeptOfficer.js'
// Create a new department officer
export const createOfficer = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      badgeNumber,
      department,
      position,
      contactNumber
    } = req.body;

    // Check if officer with email or badge number already exists
    const existingOfficer = await DepartmentOfficer.findOne({
      $or: [{ email }, { badgeNumber }]
    });

    if (existingOfficer) {
      return res.status(400).json({
        status: 'fail',
        message: 'Officer with this email or badge number already exists'
      });
    }

    const newOfficer = await DepartmentOfficer.create({
      email,
      password,
      name,
      badgeNumber,
      department,
      position,
      contactNumber
    });

    // Remove password from output
    newOfficer.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        officer: newOfficer
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all officers
export const getAllOfficers = async (req, res) => {
  try {
    // Filtering, sorting, pagination can be added here
    const officers = await DepartmentOfficer.find().select('-password');

    res.status(200).json({
      status: 'success',
      results: officers.length,
      data: {
        officers
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get single officer by ID
export const getOfficer = async (req, res) => {
  try {
    const officer = await DepartmentOfficer.findById(req.params.id).select('-password');

    if (!officer) {
      return res.status(404).json({
        status: 'fail',
        message: 'No officer found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        officer
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update officer by ID
export const updateOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove password from updateData if it exists
    if (updateData.password) {
      delete updateData.password;
    }

    // Update the updatedAt field
    updateData.updatedAt = new Date();

    const updatedOfficer = await DepartmentOfficer.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedOfficer) {
      return res.status(404).json({
        status: 'fail',
        message: 'No officer found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        officer: updatedOfficer
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete officer by ID
export const deleteOfficer = async (req, res) => {
  try {
    const officer = await DepartmentOfficer.findByIdAndDelete(req.params.id);

    if (!officer) {
      return res.status(404).json({
        status: 'fail',
        message: 'No officer found with that ID'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Search officers with filters
export const searchOfficers = async (req, res) => {
  try {
    // Extract query parameters
    const { name, department, position, isActive } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (department) filter.department = department;
    if (position) filter.position = { $regex: position, $options: 'i' };
    if (isActive) filter.isActive = isActive === 'true';
    
    const officers = await DepartmentOfficer.find(filter).select('-password');
    
    res.status(200).json({
      status: 'success',
      results: officers.length,
      data: {
        officers
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};