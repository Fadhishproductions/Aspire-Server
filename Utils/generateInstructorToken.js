import jwt from "jsonwebtoken";

const generateInstructorToken = (res,userId)=>{
  const token = jwt.sign({userId},process.env.INSTRUCTOR_SECRET,{
    expiresIn:"30d"
  })
 
  res.cookie('instructorjwt',token,{
    httpOnly:true,
    secure:process.env.NODE_ENV !== 'development' ,
    sameSite: 'Lax',
     maxAge : 30 * 24 * 60 * 60 * 1000
})
}

export default generateInstructorToken
