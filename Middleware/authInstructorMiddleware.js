import  jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from '../Models/userModel.js';
export const protect = asyncHandler(async (req, res, next) => {
    let token = req.cookies.instructorjwt; // Use instructor-specific JWT
  
    if (token) {
      try {
        // Verify the instructor token
        const decoded = jwt.verify(token, process.env.INSTRUCTOR_SECRET);
  
        // Find the user by decoded ID
        const user = await User.findById(decoded.userId).select('-password');
  
        // Check if the user exists
        if (!user) {
          res.status(404);
          throw new Error('Instructor not found');
        }
  
        // Check if the user is blocked
        if (user.isBlocked) {
          res.status(403);
          throw new Error('Your account is blocked. Contact support.');
        }
  
        // Check if the user is an instructor
        if (user.role !== 'instructor') {
          res.status(403);
          throw new Error('User is not authorized as an instructor');
        }
  
        // Attach user to the request object
        req.user = user;
  
        // Proceed to the next middleware or route handler
        next();
  
      } catch (error) {
        console.error("Error verifying token:", error);
        res.status(401);
        throw new Error('Not authorized, token is invalid');
      }
    } else {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  });