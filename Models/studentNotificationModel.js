import mongoose from "mongoose";

const studentNotificationSchema = new mongoose.Schema({
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    notifications: [
      {
        notificationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Notification',
          required: true,
        },
        deleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  });

  const StudentNotification = mongoose.model('StudentNotification', studentNotificationSchema);

  export default StudentNotification;