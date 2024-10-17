
import asyncHandler from 'express-async-handler'
import User from '../Models/userModel.js';
import generateInstructorToken from '../Utils/generateInstructorToken.js';
import Course from '../Models/courseModel.js'
import Revenue from '../Models/revenueModal.js';

//auth user/set token 
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if the email exists
  const user = await User.findOne({ email });

  // If email doesn't exist, return a specific error message
  if (!user) {
    res.status(400);
    throw new Error('Invalid email. No account associated with this email.');
  }

  // Check if the user is an instructor, not blocked, and password matches
  if (user.role === "instructor" && !user.isBlocked && await user.matchPasswords(password)) {
    generateInstructorToken(res, user._id);

    // Prepare the user response object
    const userRes = { 
      _id: user._id, 
      name: user.name, 
      email: user.email 
    };

    if (user.imageUrl) {
      userRes.imageUrl = user.imageUrl;
    }

    res.status(201).json(userRes);
  } else {
    // Provide a message if the account is blocked or password is incorrect
    res.status(400);
    throw new Error(user.isBlocked ? 'Your account is blocked. Contact support.' : 'Invalid password.');
  }
});

// register a new user
const registerUser =asyncHandler(async (req,res)=>{
   const {name , email , password} = req.body;
console.log(req.body)
   const userExists = await User.findOne({email})

   if(userExists){
    res.status(400);
    throw new Error('User already exists');
   }

   const user = await User.create({
    name,
    email,
    password,
    role:"instructor"
   });

   if(user){
      generateInstructorToken(res,user._id)
    res.status(201).json({_id:user._id,name:user.name,email:user.email});
   }else{
    res.status(400);
    throw new Error('Invalid user data')
   } 

     
});

// Logout User
const logOutUser =asyncHandler(async (req,res)=>{
   
   res.cookie('instructorjwt','',{
    httpOnly:true,
    expires:new Date(0)
   })
   res.status(200).json({message:'User logged out'})
});

//get User Profile
const getUserProfile =asyncHandler(async(req,res)=>{
   const user = {
    _id:req.user._id,name:req.user.name,email:req.user.email
   }
    res.status(200).json(user);
});

//update user profile
const updateUserProfile =asyncHandler(async (req,res)=>{
   console.log(req.body);
   const user = await User.findById(req.user._id) ;
   console.log(user)
   if(user){
user.name  = req.body.name || user.name
user.email = req.body.email ||user.email
if(req.body.password){
    user.password = req.body.password;
}
if (req.body.imageUrl) {
   user.imageUrl = req.body.imageUrl;
 }
const updatedUser = await user.save()
res.status(200).json({
    _id:updatedUser._id,
    name:updatedUser.name,
    email:updatedUser.email,
    imageUrl:updatedUser.imageUrl
})
   }else{
    res.status(404);
    throw new Error('User not found')
   }
});

const getUserList = asyncHandler(async (req,res)=>{
   try {
      // Fetch users with role 'Instructor' or 'Student', excluding 'Admin'
      const users = await User.find({ role:'student'})
        .select('-password') // Exclude the password field for security
        .lean(); // Return plain JS objects
       
      if (!users || users.length === 0) {
        // Throw an error if no users are found
        throw new Error('No students  found');
      }
  
      res.status(200).json(users);
    } catch (error) {
      // Return a 500 status code with the error message
      throw new Error(  error.message );
    }
})

const getInstructorStats = asyncHandler(async (req, res) => {
   const instructorId = req.user._id; // Assuming instructor's ID is retrieved from the authenticated user
 
   try {
     // 1. Total Courses Created by the Instructor
     const totalCourses = await Course.countDocuments({ instructor: instructorId });
 
     // 2. Total Students Enrolled across all the Instructor's Courses
     const courses = await Course.find({ instructor: instructorId }).select('_id');
     const courseIds = courses.map((course) => course._id);
     const totalStudents = await Revenue.countDocuments({ course: { $in: courseIds } });
 
     // 3. Total Earnings for the Instructor
     const earningsData = await Revenue.aggregate([
       { $match: { instructor: instructorId } },
       { $group: { _id: null, totalEarnings: { $sum: '$instructorShare' } } }
     ]);
 
     const totalEarnings = earningsData.length ? earningsData[0].totalEarnings : 0;
 
     res.status(200).json({
       totalCourses,
       totalStudents,
       totalEarnings,
     });
   } catch (error) {
     res.status(500).json({ message: 'Error fetching instructor stats', error });
   }
 });

 const getInstructorEarnings = asyncHandler(async (req, res) => {
   const instructorId = req.user._id; // Assuming instructor is authenticated
   const { page = 1, limit = 5 } = req.query; // Pagination params
 
   const skip = (page - 1) * limit;
 
   // Fetch earnings data for the instructor's courses
   const courses = await Course.find({ instructor: instructorId })
     .select('_id title')
     .skip(skip)
     .limit(parseInt(limit));
 
   // Get total number of students, earnings, and last enrollment date for each course
   const earningsData = await Promise.all(
     courses.map(async (course) => {
       const earnings = await Revenue.aggregate([
         { $match: { course: course._id } },
         { $group: { _id: null, totalEarnings: { $sum: '$instructorShare' }, totalStudents: { $sum: 1 } } },
       ]);
 
       const lastEnrollment = await Revenue.findOne({ course: course._id }).sort({ date: -1 });
 
       return {
         courseId: course._id,
         courseName: course.title,
         totalEarnings: earnings[0]?.totalEarnings || 0,
         totalStudents: earnings[0]?.totalStudents || 0,
         lastEnrollmentDate: lastEnrollment ? lastEnrollment.date : null,
       };
     })
   );
 
   const totalCourses = await Course.countDocuments({ instructor: instructorId });
 
   res.status(200).json({
     courses: earningsData,
     totalPages: Math.ceil(totalCourses / limit),
   });
 });

 const getPurchasedCourses = asyncHandler(async (req, res) => {
   const instructorId = req.user._id; // Assuming instructor is authenticated
 
   const purchasedCourses = await Revenue.aggregate([
     { 
       $lookup: {
         from: 'courses',
         localField: 'course',
         foreignField: '_id',
         as: 'courseDetails',
       },
     },
     {
       $unwind: '$courseDetails',
     },
     {
       $match: { 'courseDetails.instructor': instructorId }, // Filter courses by instructor ID
     },
     {
       $group: {
         _id: '$course',
         purchases: { $sum: 1 },
       },
     },
     {
       $lookup: {
         from: 'courses',
         localField: '_id',
         foreignField: '_id',
         as: 'courseDetails',
       },
     },
     {
       $unwind: '$courseDetails',
     },
     {
       $project: {
         _id: 1,
         courseName: '$courseDetails.title',
         purchases: 1,
       },
     },
   ]);
 
   res.status(200).json(purchasedCourses);
 });


export{
    authUser ,
    registerUser,
    logOutUser,
    getUserProfile,
    updateUserProfile,
    getUserList,
    getInstructorStats,
    getInstructorEarnings,
    getPurchasedCourses
}