import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Models/userModel.js";
 
const protect = asyncHandler(async(req,res,next)=>{
    let token;
    token = req.cookies.jwt;
    if(token){
try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    // Check if the user exists
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account is blocked. Contact support.');
    }

    // Check if the user is a student
    if (user.role !== "student") {
      res.status(403);
      throw new Error('User is not authorized to access this route');
    }

    // Attach user to the request object
    req.user = user;
     next(); 
} catch (error) {
    console.log(error,"error")
    res.status(401);
    throw new Error('Not authorized ,Invalid token')
}
    }else{
        res.status(401);
        throw new Error('Not authorized , no token')
    }
})

export {protect}