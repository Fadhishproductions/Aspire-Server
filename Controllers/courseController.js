import Course from '../Models/courseModel.js';
import asyncHandler from 'express-async-handler'
import User from '../Models/userModel.js';

const createCourse = asyncHandler(async (req,res)=>{

    let {title,description,instructor,category,level,price,coverImage} = req.body
    title = title.trim().charAt(0).toUpperCase() + title.slice(1).trim().toLowerCase()
    description = description.trim().charAt(0).toUpperCase() + description.slice(1).trim().toLowerCase()
    const course = await Course.create({title,description,instructor,category,level,price,coverImage});
    if(!course){
       res.status(404);
       throw new Error("Course not created");
    }
    res.status(201).json(course);

})


const editCourse = asyncHandler(async (req, res) => {
   const id = req.params.id;
   const course = await Course.findById(id);

   if (!course) {
       res.status(404);
       throw new Error("Course not found");
   }

   let { title, description, category, level, price } = req.body;
console.log(req.body,id,"body")

const capitalizeFirstLetter = (str) => str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();

   title = title ? capitalizeFirstLetter(title) : course.title;
   description = description ? capitalizeFirstLetter(description) : course.description;
   category = category || course.category;
   level = level || course.level;
   price = price || course.price;

   const updatedCourse = await Course.findByIdAndUpdate(
       id,
       { title, description, category, level, price },
       { new: true, runValidators: true }
   );
   console.log(updatedCourse,"updated")

   if (!updatedCourse) {
       res.status(500);
       throw new Error("Course not updated");
   }

   res.json(updatedCourse);
});

const escapeRegExp = (string) => {
   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
 };
 
//sending all course details for user
const getCourses = asyncHandler(async (req, res) => {
    const { search = '', category = '', level = '', sort = '', page = 1, limit = 10 } = req.query;
   const escapedSearch = search ? escapeRegExp(search) : '';
   const searchQuery = escapedSearch ? { title: new RegExp(escapedSearch, 'i') } : {};
   const categoryQuery = category ? { category } : {};
   const levelQuery = level ? { level } : {};
   const sortOptions = {
      recentCourses: { createdAt: -1 },
      nameAsc: { title: 1 },
      nameDesc: { title: -1 },
    };
    const sortQuery = sortOptions[sort] || {};
    const skip = (page - 1) * limit;
      const courses = await Course.find({published:true, ...searchQuery, ...categoryQuery, ...levelQuery})
     .populate('instructor', 'name email imageUrl')  
     .populate('category', 'name description')
     .sort(sortQuery)
     .skip(skip)
     .limit(parseInt(limit));
     
     const totalCourses = await Course.countDocuments({ ...searchQuery, ...categoryQuery, ...levelQuery });
     const totalPages = Math.ceil(totalCourses / limit);
     
     res.json({ courses, totalPages });

});

//sending all course details for instructor
const instructorGetAllcourse = asyncHandler(async (req, res) => {
    
   const instructorId = req.params.id;
       const courses = await Course.find({instructor:instructorId})
       .populate('instructor', 'name email imageUrl') 
       .populate('category', 'name description') 
       .exec();
       
       res.json(courses);
  
  });


const getCourse = asyncHandler(async (req, res) => {
 
    const id = req.params.id;
    const course = await Course.findById(id)
    .populate('instructor', 'name email imageUrl') 
    .populate('category', 'name description') 
    .exec();
    if (!course) {
        return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);

})


const addPreviewVideo = asyncHandler(async (req,res)=>{
console.log("entered in function")
 const { courseId } = req.params;
 const { videoUrl} = req.body;

 const course = await Course.findById(courseId);
 if (!course){
    res.status(404);throw new Error({ message: 'Course not found' });}

 course.previewVideo = videoUrl
 const updatedCourse = await course.save();
if (!updatedCourse){
        res.status(404); throw new Error({ message: 'course not updated' });
     }
 res.status(200).json(videoUrl);

})

const publishCourse = asyncHandler(async (req, res) => {
 
    const id = req.params.id
    const course = await Course.findById(id);

    if (!course) {
        res.status(404);
        throw new Error({ message: 'Course not found' });
    }

   course.published = !course.published;
   const updatedCourse = await course.save();

     if (!updatedCourse){
        res.status(404); throw new Error({ message: 'course not updated' });
     } 
     res.json(updatedCourse);

});

const editVideo = asyncHandler(async (req, res) => {


    const { id, videoId } = req.params;
    const { videoUrl, videoTitle, videoDescription , status } = req.body;

    const course = await Course.findById(id);
    if (!course){
        res.status(404);
       throw new Error({ message: 'Course not found' });
    }  

    const video = course.videos.id(videoId);
    if (!video) {
       res.status(404);
       throw new Error("Video not found")}

    video.videoUrl = videoUrl || video.videoUrl;
    video.videoTitle = videoTitle || video.videoTitle;
    video.videoDescription = videoDescription || video.videoDescription;
    video.status = status || video.status;

    await course.save();
    res.status(200).json(course);


})


 const publishVideo = asyncHandler(async(req,res)=>{
    
    const { id, videoId } = req.params;
    const course = await Course.findById(id);
    
    if(course){
       const video = course.videos.id(videoId);

       if(video){
         video.status =  video.status==="published" ? "draft" :"published" ;
         await course.save();
         res.status(200).json({ message: 'Video published successfully', course });

       }else{
          res.status(404);
          throw new Error("video not found")
       }
    }else{
       res.status(404);
       throw new Error("Course not found")
    }
 })

  

 const getEnrolledCourses = asyncHandler(async (req, res) => {
   const userId = req.user._id;
   const { searchTerm = '', page = 1, limit = 10 } = req.query; // Get query parameters for search and pagination

   // Convert page and limit to numbers
   const pageNumber = Number(page);
   const limitNumber = Number(limit);

   // Find user and populate courses
   const user = await User.findById(userId)
      .populate({
         path: 'courses',
         populate: { path: 'instructor', select: 'name email imageUrl' },
         match: { title: { $regex: searchTerm, $options: 'i' } } // Search by course title
      })
      .exec();

   if (!user) {
      res.status(404);
      throw new Error('User not found');
   }

   // Paginate the courses
   const totalCourses = user.courses.length;
   const paginatedCourses = user.courses.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber);

   res.status(200).json({
      courses: paginatedCourses,
      totalCourses,
      page: pageNumber,
      totalPages: Math.ceil(totalCourses / limitNumber)
   });
});


const getSuggestions = asyncHandler(async (req, res) => {
   const { search } = req.query;
   console.log(search,"search")

   if (!search || !search.trim()) {
     res.status(404);
     throw new Error('Search term is required');
  }

  // Use regex to match the search term in the course title
  const regex = new RegExp(search.trim(), 'i'); // 'i' for case-insensitive search
   try {

     const suggestions = await Course.find({ title: { $regex: regex } })
      .select('title') // Fetch only the 'title' field for suggestions
      .limit(10); // Limit the number of results

    res.json(suggestions);
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Server Error' });
   }
 });

 const adminCourseListing = asyncHandler(async (rea,req)=>{
   const { search = '', category = '', level = '', sort = '', page = 1, limit = 10 } = req.query;
   const escapedSearch = search ? escapeRegExp(search) : '';
   const searchQuery = escapedSearch ? { title: new RegExp(escapedSearch, 'i') } : {};
   const categoryQuery = category ? { category } : {};
   const levelQuery = level ? { level } : {};
   const sortOptions = {
      recentCourses: { createdAt: -1 },
      nameAsc: { title: 1 },
      nameDesc: { title: -1 },
    };
    const sortQuery = sortOptions[sort] || {};
    const skip = (page - 1) * limit;
      const courses = await Course.find({ ...searchQuery, ...categoryQuery, ...levelQuery})
     .populate('instructor', 'name email imageUrl')  
     .populate('category', 'name description')
     .sort(sortQuery)
     .skip(skip)
     .limit(parseInt(limit));
     
     const totalCourses = await Course.countDocuments({ ...searchQuery, ...categoryQuery, ...levelQuery });
     const totalPages = Math.ceil(totalCourses / limit);
     
     res.json({ courses, totalPages });

 })

 const updateCoverImage = asyncHandler(async (req, res) => {
   const { courseId } = req.params;
   const { imageUrl } = req.body;
 
   try {
     // Find the course by ID and update the cover image
     const course = await Course.findById(courseId);
 
     if (!course) {
       return res.status(404).json({ message: "Course not found" });
     }
 
     course.coverImage = imageUrl;
     await course.save();
 
     res.status(200).json({
       message: "Cover image updated successfully",
       coverImage: course.coverImage,
     });
   } catch (error) {
     res.status(500).json({ message: "Failed to update cover image" });
   }
 });

 

 export{
    createCourse,
    editCourse,
    publishCourse,
    addPreviewVideo,
    editVideo,
    getCourse,
    getCourses,
    publishVideo,
    instructorGetAllcourse, 
    getEnrolledCourses,
    getSuggestions,
    adminCourseListing,
    updateCoverImage

 }  