import asyncHandler from "express-async-handler";
import Course from "../Models/courseModel.js";
import mongoose from "mongoose"; 
import jwt from "jsonwebtoken";
  
  
 
const startLiveStream = asyncHandler(async (req, res) => {

     const { courseId } = req.params;

      if (!courseId) {
      res.status(400).json({ message: 'Course ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Invalid Course ID' });
      return;
    }

    // Update course to mark live stream as active
    await Course.findByIdAndUpdate(courseId, { isLive: true });
  
 
  
    res.status(200).json({ message: 'Live stream started' });
  });

  const stopLiveStream = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
  
    if (!courseId) {
      res.status(400).json({ message: 'Course ID is required' });
      return;
    }
  
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Invalid Course ID' });
      return;
    }
    
    // Update course to mark live stream as inactive
    await Course.findByIdAndUpdate(courseId, { isLive: false });
     
 
  
    res.status(200).json({ message: 'Live stream stopped' });
  });


  const secretKey = 'Aspire-Live-secret';
  const genrateLiveToken =  asyncHandler(async(req, res) => {
    const { userId, name } = req.body;   
    
    if (!userId || !name) {
      return res.status(400).json({ message: 'userId and name are required' });
    }
  
    // Current timestamp (in seconds)
    const iat = Math.floor(Date.now() / 1000);
  
    // Expiry time (1 week in seconds)
    const validityInSeconds = 604800;
    const exp = iat + validityInSeconds;
  
    // JWT Payload
    const payload = { 
      iss: 'https://pronto.getstream.io',
      sub: `user/${userId}`,
      user_id: userId,
      validity_in_seconds: validityInSeconds,
      iat,  // Issued at time
      exp,  // Expiry time
    };
  
    // Create the token
    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
  
    // Respond with the token
    return res.status(200).json({ token });
  })
  

  export{
    startLiveStream,
    stopLiveStream, 
    genrateLiveToken
  }