import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true},
    content: { type: String, required: true},
    notificationType: { type: String, enum: ['general', 'live', 'quiz', 'update'],required: true},
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    createdAt: {type: Date,default: Date.now},
  });
  
  const Notification = mongoose.model('Notification', notificationSchema);
  
   export default Notification;
  