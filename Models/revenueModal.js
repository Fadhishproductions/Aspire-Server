import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    adminShare: {
      type: Number,
      required: true,
    },
    instructorShare: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, 
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'pending',
    },
  }, { timestamps: true });
  
  const Revenue = mongoose.model('Revenue', revenueSchema);
  
  export default Revenue