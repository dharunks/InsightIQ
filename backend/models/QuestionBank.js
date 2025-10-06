const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['technical', 'behavioral', 'hr', 'situational']
  },
  subcategory: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  question: {
    type: String,
    required: true
  },
  tags: [String],
  industry: [String],
  expectedAnswerStructure: {
    type: String,
    default: ''
  },
  expectedAnswer: {
    type: String,
    default: ''
  },
  sampleAnswerPoints: [String],
  timeLimit: {
    type: Number, // in seconds
    default: 120
  },
  tips: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usage: {
    timesUsed: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  }
}, {
  timestamps: true
});

// Index for better search performance
questionBankSchema.index({ category: 1, difficulty: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ industry: 1 });
questionBankSchema.index({ isActive: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);