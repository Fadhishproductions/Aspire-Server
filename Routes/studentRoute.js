import express from 'express';
const router = express.Router();

import { authUser , registerUser,logOutUser, getUserProfile,updateUserProfile, forgotPassword, resetPassword } from '../Controllers/userController.js';
import {getCourses, getCourse, getEnrolledCourses, getSuggestions  } from '../Controllers/courseController.js';      
import {getAllcategory } from '../Controllers/categoryController.js';   
import { protect } from '../Middleware/authMiddleware.js'
import { createPaymentSession, webhook } from '../Controllers/paymentController.js';
import { getSections,  StreamVideo } from '../Controllers/sectionController.js';
import { getCourseProgress, getVideoProgress, updateVideoCompletion } from '../Controllers/videoProgressController.js';
import {  getQuiz } from '../Controllers/quizzessController.js';
import { deleteNotification, getNotifications } from '../Controllers/notificationController.js';
import { genrateLiveToken } from '../Controllers/liveController.js';



//student
router.post('/',registerUser);
router.post('/auth',authUser);
router.post('/logout',logOutUser);
router.route('/profile').get(protect,getUserProfile).put(protect,updateUserProfile)
router.post('/forgotpassword',forgotPassword)
router.post('/resetpassword/:token',resetPassword)

//courses
router.get('/courses',getCourses);
router.get('/courses/:id',getCourse)
router.get('/enrolled',protect,getEnrolledCourses)
router.get('/suggestions',getSuggestions)

//categories 
router.get('/courses/category/all',getAllcategory);

//sections 
router.get('/course/:id/sections',protect,getSections)

//videoUrl
 router.get('/live-stream/:sectionId/video/:videoId', protect,StreamVideo) 
 
//payment 
router.post('/create-checkout-session',protect, createPaymentSession)
router.post('/webhook', webhook)

//Quiz
router.get('/course/section/:id/quiz/questions',protect,getQuiz) 

//user progress
router.get('/progress/:courseId/:sectionId/:videoId', protect, getVideoProgress); 
router.post('/progress/update', protect, updateVideoCompletion); 
router.get('/courses/:courseId/progress',protect,getCourseProgress) 

//live token generation
router.post('/generate-live-token',protect,genrateLiveToken)

//notification
router.get('/notifications',protect,getNotifications)
router.post('/notifications/:notificationId/delete',protect,deleteNotification)
export default router;
