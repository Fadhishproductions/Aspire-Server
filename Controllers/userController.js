import asyncHandler from 'express-async-handler'
import User from '../Models/userModel.js';
 import generateToken from '../Utils/generateToken.js';
 import crypto from 'crypto';
import sendEmail from '../Utils/NodeMail.js';
import dotenv from 'dotenv';

dotenv.config(); 
//auth user/set token
const authUser = asyncHandler(async (req, res) => {
   const { email, password } = req.body;
   
   
   const user = await User.findOne({ email });
   
   if (!user) {
      res.status(400);
      throw new Error('Invalid email. No account associated with this email.');
    }

   // Check if user exists, is a student, is not blocked, and if the password is correct
   if (user && user.role === "student" && !user.isBlocked && await user.matchPasswords(password)) {
      generateToken(res, user._id);
     
     // Prepare the user response object
     const userRes = { 
       _id: user._id, 
       name: user.name, 
       email: user.email, 
       courses: user.courses 
     };
     
     if (user.imageUrl) {
       userRes.imageUrl = user.imageUrl;
     }
     
     
     res.status(201).json(userRes);
   } else {
      res.status(400);
     throw new Error( user.isBlocked ? 'Your account is blocked. Contact support.' : 'Invalid email or password');
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
    role:"student"
   });

   if(user){
    generateToken(res,user._id)
    res.status(201).json({_id:user._id,name:user.name,email:user.email});
   }else{
    res.status(400);
    throw new Error('Invalid user data')
   } 

     
});

// Logout User
const logOutUser =asyncHandler(async (req,res)=>{
   
   res.cookie('jwt','',{
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
   console.log(req.body)
   const user = await User.findById(req.user._id) ;
   
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

const forgotPassword = asyncHandler(async(req,res)=>{

   const email = req.body.email;

   const user = await User.findOne({ email });
   if (!user) {
      res.status(404);
      throw Error( 'User not found' );
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now()+ 10 * 60 * 1000
    console.log(user.resetPasswordExpire)

    await user.save();

    const resetUrl = `${process.env.FRONTEND_DOMAIN}/reset-password/${token}`

    const message = `
  <html>
    <body>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">You requested a password reset</p>
      <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        Click this <a href="${resetUrl}" style="color: #1a0dab; text-decoration: underline;">link</a> to reset your password
      </p>
    </body>
  </html>
`;

  
    try {
      await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: message,
      })

      res.status(200).json({ message: 'Email sent' });

    } catch (error) {
       user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
    }

   })

   const resetPassword = asyncHandler(async(req,res)=>{
      const {password} = req.body;
      const { token } = req.params;
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
       
      const user = await User.findOne({
         resetPasswordToken: hashedToken,
         resetPasswordExpire: { $gt: Date.now() }, // Ensure the token hasn't expired
       });

       if (!user) {
         res.status(400);
         throw new Error("Invalid or expired token");
       }

       user.password = password;
       user.resetPasswordToken = undefined;
       user.resetPasswordExpires = undefined;

       await user.save();

       res.status(200).json({ message: "Password reset successful" });
   })





export{
    authUser ,
    registerUser,
    logOutUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    resetPassword
}