import asyncHandler from 'express-async-handler'
import User from '../Models/userModel.js';
import generateAdminToken from '../Utils/generateAdminToken.js' 
import  Course from '../Models/courseModel.js'
import Revenue from '../Models/revenueModal.js';
const adminAuth= asyncHandler(async(req,res)=>{

const {email,password}=req.body;
const user = await User.findOne({email});
console.log(user) 
if(user && (await user.matchPasswords(password)) && user.role ==='admin'){
    generateAdminToken(res,user._id)
    res.status(201).json({_id:user._id,name:user.name,email:user.email});
   }else{
    res.status(400);
    throw new Error('Invalid email or password');
   } 
  
  
})

const getUserList = asyncHandler(async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
console.log(req.query)
    // Create a regex for case-insensitive search for both name and email
    const searchRegex = new RegExp(search, 'i');

    // Filters based on search input and user roles (instructor or student)
    const filters = {
      role: { $in: ['instructor', 'student'] },
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    };

    // Pagination options
    const skip = (page - 1) * limit;
    const users = await User.find(filters)
      .select('-password') // Exclude password
      .skip(skip)
      .limit(Number(limit)) // Limit the number of results
      .lean();

    // Get the total number of users for pagination
    const totalUsers = await User.countDocuments(filters);
    const totalPages = Math.ceil(totalUsers / limit);

     

    res.status(200).json({
      users,          // The filtered and paginated user list
      totalPages,     // Total number of pages
      currentPage: page, // Current page number
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});



const createUser = asyncHandler(async(req,res)=>{
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
        password
       });
    
       if(user){
        res.status(201).json({message:"user created"});
       }else{
        res.status(400);
        throw new Error('Invalid user data')
       } 
    
})

const updateUser = asyncHandler(async(req,res)=>{
     console.log(req.body)
     const {id} = req.params
   const user = await User.findById(id) ;
   
   if(user){ 
user.name  = req.body.name || user.name
user.email = req.body.email ||user.email
if(req.body.password){
    user.password = req.body.password;
}
const updatedUser = await user.save()
res.status(200).json({
    _id:updatedUser._id,
    name:updatedUser.name,
    email:updatedUser.email,
   
})
   }else{
    res.status(404);
    throw new Error('User not found')
   }
})


const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    console.log(userId, "userId");
  
    const user = await User.findById(userId);
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    // Toggle the blocked status
    user.isBlocked = !user.isBlocked;
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  });
 
const logout = asyncHandler(async(req,res)=>{
    res.clearCookie('adminjwt').status(200).json("signed out")
})

const getUser = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id)
    res.status(200).json({_id:user._id,name:user.name,email:user.email})
})

const getAllcourse = asyncHandler(async (req, res) => {
    try {
        const courses = await Course.find({});
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
 });

 const publishCourse = asyncHandler(async (req, res) => {
    try {
       const id = req.params.id
       const course = await Course.findById(id);
 
       if (!course) {
          return res.status(404).json({ message: 'Course not found' });
       }
 
      course.published = !course.published;
      const updatedCourse = await course.save();
 
        if (!updatedCourse) return res.status(404).json({ message: 'course not updated' });
        res.json(updatedCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
 });

 const getAdminLandingPageStats = asyncHandler(async (req, res) => {
  try {
    // Total users and instructors
    const totalUsers = await User.countDocuments();
    const totalInstructors = await User.countDocuments({ role: 'instructor' }); // Assuming 'role' field exists in user schema

    // Total courses
    const totalCourses = await Course.countDocuments();

    // Total revenue (sum of admin share)
    const totalRevenue = await Revenue.aggregate([{ $group: { _id: null, total: { $sum: "$adminShare" }}}]);

     res.status(200).json({
      totalUsers,
      totalInstructors,
      totalCourses,
      totalRevenue: totalRevenue[0]?.total || 0, 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin landing page data', error });
  }
});

const getUserGrowthData = asyncHandler(async (req, res) => {
  const { groupBy = 'month' } = req.query; // Default to 'month' if no groupBy is provided

  let groupStage = {};

  // Adjust the grouping based on the selected granularity
  if (groupBy === 'day') {
    groupStage = {
      _id: {
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      },
      totalUsers: { $sum: 1 },
    };
  } else if (groupBy === 'year') {
    groupStage = {
      _id: {
        year: { $year: "$createdAt" },
      },
      totalUsers: { $sum: 1 },
    };
  } else {
    // Default is to group by month
    groupStage = {
      _id: {
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      },
      totalUsers: { $sum: 1 },
    };
  }

  try {
    const userGrowth = await User.aggregate([
      {
        $group: groupStage,
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }, // Sort by date (ascending)
      },
    ]);

    res.status(200).json(userGrowth);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    res.status(500).json({ message: 'Error fetching user growth data' });
  }
});
 
const getPurchasedCoursesAllTime = asyncHandler(async (req, res) => {
  try {
    const purchasedCourses = await Revenue.aggregate([
      {
        $match: { status: 'completed' }, // Only count completed purchases
      },
      {
        $group: {
          _id: '$course', // Group by courseId
          totalPurchases: { $sum: 1 }, // Count the number of purchases
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
          _id: 0,
          courseName: '$courseDetails.title', // Get course name from course details
          purchases: '$totalPurchases', // Get total purchases
        },
      },
    ]);

    res.status(200).json(purchasedCourses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course purchases', error });
  }
});

const getPurchasedCoursesCurrentMonth = asyncHandler(async (req, res) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  try {
    const purchasedCourses = await Revenue.aggregate([
      {
        $match: {
          status: 'completed', // Only count completed purchases
          date: { $gte: startOfMonth, $lte: endOfMonth }, // Filter by current month
        },
      },
      {
        $group: {
          _id: '$course', // Group by courseId
          totalPurchases: { $sum: 1 }, // Count the number of purchases
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
          _id: 0,
          courseName: '$courseDetails.title', // Get course name from course details
          purchases: '$totalPurchases', // Get total purchases
        },
      },
    ]);

    res.status(200).json(purchasedCourses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course purchases', error });
  }
});


export {
adminAuth,getUser,getUserList,blockUser,createUser,updateUser ,logout ,publishCourse,getAllcourse ,
getAdminLandingPageStats,getUserGrowthData,getPurchasedCoursesAllTime,getPurchasedCoursesCurrentMonth
}