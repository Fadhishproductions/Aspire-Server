import Section from '../Models/sectionModel.js';
import asyncHandler from 'express-async-handler';
import VideoProgress from '../Models/videoProgressModel.js';
 
  const getVideoProgress = asyncHandler(async (req, res) => {
    const {  courseId, sectionId, videoId } = req.params;
    const userId = req.user._id ;
    try { 
      // Find the progress record for this user and video
      const progress = await VideoProgress.findOne({ userId, courseId, sectionId, videoId });
      console.log(progress,"progress")
      if (progress) {
        const data ={
          lastWatched: progress.lastWatched,
          watchedPercentage: progress.watchedPercentage,
          completed: progress.completed
        }
        return res.status(200).json(data);
      } else {
        return res.status(200).json({ message: 'No progress found', lastWatched: 0 });
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
      res.status(500).json({ message: 'Error fetching video progress' });
    }
});

 
  const updateVideoCompletion = asyncHandler(async (req, res) => {
    const {  courseId, sectionId, videoId, lastWatched, watchedPercentage, completed } = req.body;
    const userId = req.user._id
     console.log(req.user,"req.user")
    try {

      if(!userId&& !courseId && !sectionId && !videoId && !lastWatched && !watchedPercentage && !completed){
        res.status(400).json({ message: 'Every  fieled is required' });
      }
      // Check if progress exists for this user and video
      let progress = await VideoProgress.findOne({ userId, courseId, sectionId, videoId });
  
      if (progress) {
        // Update existing progress
        progress.lastWatched = lastWatched;
        progress.watchedPercentage = watchedPercentage;
        progress.completed = completed;
      } else {
        // Create new progress entry
        progress = new VideoProgress({
          userId,
          courseId,
          sectionId,
          videoId,
          lastWatched,
          watchedPercentage,
          completed
        });
      }
  
      await progress.save();
      res.status(200).json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Error updating video progress:', error);
      res.status(500).json({ message: 'Error updating video progress' });
    }
});


const getCourseProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;  // Assume user ID is available from authentication middleware
  const { courseId } = req.params;

  try {
    // Fetch all sections for the course
    const sections = await Section.find({ courseId });

    if (!sections.length) {
      return res.status(404).json({ message: 'No sections found for this course' });
    }

    let totalVideos = 0;
    let totalWatchedPercentage = 0;

    // Loop through each section and its videos
    for (const section of sections) {
      const videos = section.videos;
      totalVideos += videos.length;  // Count total number of videos in the course

      // Loop through each video in the section
      for (const video of videos) {
        const progress = await VideoProgress.findOne({
          userId,
          courseId,
          sectionId: section._id,
          videoId: video._id,
        });

        // If progress exists, add its percentage to the total watched percentage
        if (progress) {
          totalWatchedPercentage += progress.watchedPercentage;
        }
      }
    }

    // Calculate overall progress for the course
    const overallProgress = totalVideos > 0 ? totalWatchedPercentage / totalVideos : 0;

    return res.status(200).json({
      overallProgress: overallProgress.toFixed(2),  // Return percentage with 2 decimal places
    });
  } catch (error) {
    console.error('Error calculating course progress:', error);
    res.status(500).json({ message: 'Failed to calculate course progress' });
  }
});


 export{
   updateVideoCompletion,getVideoProgress,getCourseProgress
 } 