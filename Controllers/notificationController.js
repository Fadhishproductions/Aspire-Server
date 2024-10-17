import Notification from "../Models/notificationModel.js";
import Course from '../Models/courseModel.js';
import StudentNotification from "../Models/studentNotificationModel.js";
import asyncHandler from "express-async-handler";
import User from "../Models/userModel.js";


const addNotification = asyncHandler(async(req,res)=>{
  const {courseId} = req.params;
  const {  title, content, notificationType } = req.body;

    if (!courseId || !title || !content || !notificationType) {
        res.status(400);
        throw new Error('Please provide all required fields.');
      }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 100) {
    res.status(400);
    throw new Error('Title must be between 3 and 100 characters and cannot be empty.');
  }

  if (!trimmedContent || trimmedContent.length < 3 || trimmedContent.length > 1000) {
    res.status(400);
    throw new Error('Content must be between 3 and 1000 characters and cannot be empty.');
  }
  

      const notification = new Notification({
        courseId,
        title,
        content,
        notificationType,
        instructorId: req.user._id,  
      });

      await notification.save();

  // Send a success response
  res.status(201).json({
    message: 'Notification created successfully!',
    notification,
  });
})

const getNotifications = asyncHandler(async (req, res) => {
  try {
  const studentId = req.user._id;

  // Find the student document to retrieve their enrolled courses
  const student = await User.findById(studentId).select('courses');
  if (!student || student.courses.length === 0) {
    return res.status(200).json([]); // No courses, no notifications
  }

  // Get student notifications
  let studentNotifications = await StudentNotification.findOne({ studentId });

  if (!studentNotifications) {
    studentNotifications = await StudentNotification.create({
      studentId,
      notifications: [],
    });
  }

  // Get deleted notifications for the student
  const deletedNotifications = studentNotifications.notifications
    .filter((n) => n.deleted)
    .map((n) => n.notificationId.toString());

  // Get notifications only for the student's enrolled courses, excluding deleted notifications
  const notifications = await Notification.find({
    courseId: { $in: student.courses }, // Only notifications for enrolled courses
    _id: { $nin: deletedNotifications }, // Exclude deleted notifications
  })
    .populate({
      path: 'courseId',
      select: 'title',
    })
    .populate({
      path: 'instructorId',
      select: 'name',
    })
    .sort({ createdAt: -1 });

  if (!notifications || notifications.length === 0) {
    return res.status(200).json([]); // Return an empty array if no notifications are found
      
  }
  
  // Format notifications for the response
  const formattedNotifications = notifications.map((notification) => ({
    _id: notification._id,
    title: notification.title,
    content: notification.content,
    createdAt: notification.createdAt,
    courseName: notification.courseId?.title || 'Unknown Course',
    instructorName: notification.instructorId?.name || 'Unknown Instructor',
  }));

  res.status(200).json(formattedNotifications);
} catch (error) {
  console.log(error,"error")
}
});

const deleteNotification = asyncHandler(async (req, res) => {
    const studentId = req.user._id;  
    const { notificationId } = req.params;  
    
    // Find the student's notifications
    const studentNotifications = await StudentNotification.findOne({ studentId });
    
    if (!studentNotifications) {
      // Create the StudentNotification document if it does not exist
      studentNotifications = new StudentNotification({
        studentId,
        notifications: [
          {
            notificationId,
          deleted: true,
        },
      ],
    });

    await studentNotifications.save();
    return res.status(200).json({ message: 'Notification deleted successfully for the first interaction.' });
    }
  
    // Check if the notification exists in the student's notification list
    const notificationIndex = studentNotifications.notifications.findIndex(
      (n) => n.notificationId.toString() === notificationId
    );
  
    if (notificationIndex === -1) {
      // If the   is not already in the list, add it with deleted set to true
      studentNotifications.notifications.push({ notificationId, deleted: true });
    } else {
       studentNotifications.notifications[notificationIndex].deleted = true;
    }
    // Save the updated student notifications
    await studentNotifications.save();
  
    res.status(200).json({ message: 'Notification deleted successfully.' });
  });


 export {
     addNotification,
     getNotifications,
     deleteNotification
 };