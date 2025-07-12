import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const departmentOfficerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  badgeNumber: {
    type: String,
    required: true,
    unique: true
  },
  photo : {
    type: String
  },
  department: {
    type: String,
    enum: [
      'Environment', 'Justice', 'Health', 'Education', 'Housing',
      'Transportation', 'Labor', 'Energy', 'Agriculture', 'Finance',
      'Public Safety', 'Social Welfare', 'Water', 'Communications', 
      'Consumer Affairs'
    ],
    required: true
  },
  position: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastPromotionDate: {
    type: Date
  },
  role: {
    type: String,
    default: 'department_officer',
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Hash password before saving
departmentOfficerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
departmentOfficerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


departmentOfficerSchema.virtual('profile').get(function() {
  return {
    name: this.name,
    badgeNumber: this.badgeNumber,
    department: this.department,
    position: this.position,
    status: this.isActive ? 'Active' : 'Inactive'
  };
});

const DepartmentOfficer = mongoose.model('DepartmentOfficer', departmentOfficerSchema);

export default DepartmentOfficer;
