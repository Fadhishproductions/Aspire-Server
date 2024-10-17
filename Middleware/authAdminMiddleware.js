import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Models/userModel.js";
 
export const Protect = asyncHandler(async(req,res,next)=>{
    let token ;
    token = req.cookies.adminjwt;
     if(token){
    try {
        const decoded = jwt.verify(token,process.env.ADMIN_SECRET);
        req.user = await User.findOne({ _id: decoded.userId }).select('-password'); 
        console.log(req.user)
        if (!req.user?.role==="admin" ) {
           return res.status(403).json({ message: 'User is not authenticated' });
         }     
         next()
    } catch (error) {
        console.log(error)
        res.status(401);
        throw new Error('Not authorized ,Invalid token')
    }

    }else{
        res.status(401);
        throw new Error('Not authorized , no token')
    }
})