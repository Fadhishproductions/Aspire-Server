import express from 'express';
const router = express.Router();
import {adminAuth,getUserList,createUser ,getUser ,logout,  blockUser, getAdminLandingPageStats, getUserGrowthData, getPurchasedCoursesAllTime, getPurchasedCoursesCurrentMonth } from '../Controllers/adminController.js'
import { Protect } from '../Middleware/authAdminMiddleware.js';
import { getPaginatedCategoriesAdmin , addcategory , editCategory ,getCategoryById, publishCategory, getAllcategory } from '../Controllers/categoryController.js';
import { getAdminRevenueAnalysis, getRevenueGrowth } from '../Controllers/revenueController.js';
import { adminCourseListing } from '../Controllers/courseController.js';
//admin
router.post('/auth',adminAuth);
router.post('/createUser',createUser);
router.get('/getUserlist',Protect,getUserList);
router.get('/getUser/:id',Protect,getUser)
router.put('/blockUser/:userId',Protect,blockUser) 
router.post('/logout',Protect,logout)
router.get('/stats',Protect,getAdminLandingPageStats)
router.get('/user-growth',Protect,getUserGrowthData)
//categories
router.get('/category/all',Protect,getAllcategory)
router.get('/category/all/paginated',Protect,getPaginatedCategoriesAdmin)
router.post('/category/add',Protect,addcategory)
router.post('/category/edit/:id',Protect,editCategory)
router.get('/category/:id',Protect,getCategoryById)
router.put('/category/toggle-publish/:categoryId',Protect,publishCategory)
//revenue
router.get('/revenue-growth',Protect, getRevenueGrowth);
router.get('/revenueAnalysis',Protect,getAdminRevenueAnalysis)

//coursegrowth
router.get('/purchased-all',Protect, getPurchasedCoursesAllTime);
router.get('/purchased-current-month',Protect, getPurchasedCoursesCurrentMonth);

//courses
router.get('/courses',Protect,adminCourseListing)
 
export default router;