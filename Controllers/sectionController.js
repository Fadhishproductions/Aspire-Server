import Section from "../Models/sectionModel.js";
import Course from '../Models/courseModel.js';
import asyncHandler from 'express-async-handler'
import axios from "axios";

const createSection = asyncHandler(async (req, res) => {
      let { title, courseId } = req.body;
    
    // Validate input
    if (!title || !courseId) {
        res.status(400)
        throw new Error("Invalid data: Title and Course ID are required");
    }
     
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404)
        throw new Error('Course not found');
    }

    // Format the title
    title = title.trim().charAt(0).toUpperCase() + title.trim().slice(1).toLowerCase();
   

    // Check if the section with the same title and courseId already exists
    const existingSection = await Section.findOne({ title, courseId });
     if (existingSection) {
        res.status(400)
        throw new Error('Section with this title already exists in the course');
    }

    // Create and save the new section
    const section = new Section({ title, courseId });
    const newSection = await section.save();
     // Handle save failure
    if (!newSection) {
        res.status(500)
        throw new Error('Failed to add section');
    }

    // Respond with the created section
    res.status(201).json(newSection);
    
});

const getSections = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400);
        throw new Error("Course ID is required");
    }
 
    const course = await Course.findById(id);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

     const sections = await Section.find({courseId: id });

      if(!sections){
        res.status(400);
        throw new Error('can\'t get sections');
     }
     res.status(200).json(sections);
});

const addVideo = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const { videoUrl, videoTitle, videoDescription } = req.body;
    const updatedSection = await Section.findByIdAndUpdate(
        id,
        {
            $push: {
                videos: {
                    videoUrl,
                    videoTitle,
                    videoDescription
                }
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedSection) {
         res.status(404)
        throw new Error( 'Section not found' );
    }
    res.json(updatedSection);
})

function extractPublicId(url) {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
 
const StreamVideo = asyncHandler(async (req, res) => {
    const { sectionId, videoId } = req.params;

    // Find the section by ID
    const section = await Section.findById(sectionId);
  
    // If the section is not found, return a 404 error
    if (!section) {
      res.status(404);
      throw new Error('Section not found');
    }
  
    // Find the video within the section by ID
    const video = section.videos.id(videoId);
    if (!video) {
      res.status(404);
      throw new Error('Video not found');
    }

    try {
      // Extract range from request headers (for partial content support)
      const range = req.headers.range;
      
      // Make a request to Cloudinary for the video stream
      const videoUrl = video.videoUrl;
      
      // Make a request to Cloudinary with axios
      const response = await axios({
        url: videoUrl,
        method: 'GET',
        responseType: 'stream',
        headers: range ? { Range: range } : {} // Pass the range header if it exists
      });

      // Set headers for video stream
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline');

      // If byte range is requested, send partial content response (206)
      if (range) {
        res.status(206);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', response.headers['content-range']);
        res.setHeader('Content-Length', response.headers['content-length']);
      } else {
        res.setHeader('Content-Length', response.headers['content-length']);
      }

      // Pipe the Cloudinary video stream to the client
      response.data.pipe(res);
    } catch (error) {
      console.error('Error streaming video:', error);
      res.status(500).json({ message: 'Error streaming video', error });
    }
});


  const editSection = asyncHandler(async (req, res) => {
    const { sectionId , courseId } = req.params; // Destructure sectionId from the request parameters
    const { newTitle } = req.body; // Destructure newTitle from the request body

    // Validate input
    if (!sectionId || !newTitle) {
        res.status(400);
        throw new Error("Invalid data ");
    }

    // Find the section by ID
    const section = await Section.findById(sectionId);

    // If the section is not found, return a 404 error
    if (!section) {
        res.status(404);
        throw new Error("Section not found");
    }

    // Update the section title
    section.title = newTitle.trim().charAt(0).toUpperCase() + newTitle.trim().slice(1).toLowerCase();

    const existingSection = await Section.findOne({ title:newTitle, courseId });
     if (existingSection) {
       res.status(400)
       throw new Error('Section title already exists , Please choose another');
   }

    // Save the updated section
    const updatedSection = await section.save();

    // If save fails, return a 500 error
    if (!updatedSection) {
        res.status(500);
        throw new Error("Failed to update section");
    }

    // Respond with the updated section
    res.status(200).json(updatedSection);
});

  
const editVideo = asyncHandler(async (req, res) => {
    const { sectionId, videoId } = req.params;
    const { videoUrl, videoTitle, videoDescription } = req.body;
    const section = await Section.findById(sectionId);
    if (!section) {
        res.status(404);
        throw new Error('Section not found');
    }

    const video = section.videos.id(videoId);
 
    if (videoUrl) video.videoUrl = videoUrl;
    if (videoTitle) video.videoTitle = videoTitle;
    if (videoDescription) video.videoDescription = videoDescription;

   const updatedSection =  await section.save();
    res.json(updatedSection);
});
  


export{createSection,getSections , addVideo  ,StreamVideo ,editSection , editVideo }