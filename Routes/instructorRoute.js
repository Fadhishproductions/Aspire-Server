import express from 'express';
const router = express.Router();

import { authUser , registerUser,logOutUser, getUserProfile,updateUserProfile, getInstructorStats, getInstructorEarnings, getPurchasedCourses } from '../Controllers/instructorController.js';
import { publishedCategories } from '../Controllers/categoryController.js';   
import {createCourse,editCourse,publishCourse, getCourse, instructorGetAllcourse, addPreviewVideo, updateCoverImage } from '../Controllers/courseController.js';  
import { createSection, getSections  , addVideo, editSection, editVideo} from '../Controllers/sectionController.js';    
import { protect } from '../Middleware/authInstructorMiddleware.js';
import { addQuiz, getQuiz } from '../Controllers/quizzessController.js';
import { genrateLiveToken, startLiveStream, stopLiveStream } from '../Controllers/liveController.js';
import { addNotification } from '../Controllers/notificationController.js';


//instructor 
router.post('/',registerUser);  
router.post('/auth',authUser);
router.post('/logout',logOutUser);
router.get('/instructor-stats',protect,getInstructorStats)
router.route('/profile').get(protect,getUserProfile).put(protect,updateUserProfile)
router.get('/earnings',protect,getInstructorEarnings) 
router.get('/purchased-courses',protect,getPurchasedCourses)

//course
router.post('/courses',protect,createCourse);
router.route('/courses/:id').get(protect,getCourse).put(protect,editCourse);
router.put('/courses/:id/publish',protect,publishCourse)
router.get('/:id/courses',protect,instructorGetAllcourse)
router.post('/courses/:courseId/previewvideo',protect,addPreviewVideo)
router.put('/courses/:courseId/cover-image', updateCoverImage);

//category
router.get('/categories',protect,publishedCategories)

//section
router.post('/course/section/create',protect,createSection)
router.get('/course/:id/sections',protect,getSections)
router.post('/course/section/:id/video',protect,addVideo)
router.put('/course/:courseId/section/:sectionId/edit',protect,editSection);
router.put('/course/section/:sectionId/video/:videoId/edit',protect,editVideo)

//Quiz
router.post('/course/section/:id/quiz',protect,addQuiz);
router.get('/course/section/:id/quiz/questions',protect,getQuiz)
 
//live
router.post('/course/:courseId/live/start',protect,startLiveStream)
router.post('/course/:courseId/live/stop',protect,stopLiveStream)
router.post('/generate-live-token',protect,genrateLiveToken)


//notification
router.post('/course/:courseId/notification/',protect,addNotification)


export default router;