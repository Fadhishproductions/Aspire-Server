import jwt from 'jsonwebtoken';

const generateAdminToken = (res,userId)=>{
    const token = jwt.sign({userId},process.env.ADMIN_SECRET,{
        expiresIn:"30d"
    })
 
    res.cookie("adminjwt",token,{
        httpOnly:true,
        secure:process.env.NODE_ENV != 'development',
        sameSite: 'Lax', 
        maxAge:30 * 24 * 60 * 60 * 1000
    })
}

export default generateAdminToken;