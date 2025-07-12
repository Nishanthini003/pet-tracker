import mongoose from 'mongoose';

const petitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  submittedBy: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Environment', 'Justice', 'Health', 'Education', 'Housing', 'Transportation', 'Labor', 'Energy', 'Agriculture', 'Finance', 'Public Safety', 'Social Welfare', 'Water', 'Communications', 'Consumer'],
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'in_progress', 'resolved', 'rejected'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    lowercase: true,
    trim: true
  },
  location: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  comments:[
    {
      text: {
        type: String
      }
    }
  ],
  timeline: [{
    status: {
      type: String,
      enum: ['new', 'pending', 'in_progress', 'resolved', 'rejected'],
      default: 'new'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create text indexes for search
petitionSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

// Add method to track status changes
petitionSchema.methods.updateStatus = async function(newStatus, userId, comment) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    updatedBy: userId,
    comment: comment
  });
  return this.save();
};

// Add method to add comments
petitionSchema.methods.addComment = async function(text, userId) {
  this.comments.push({
    text,
    author: userId
  });
  return this.save();
};

const Petition = mongoose.model('Petition', petitionSchema);

export default Petition;
