import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
const userSchema = mongoose.Schema({
   name:{type:String,required:true} ,
   email:{type:String,required:true,unique:true} ,
   password:{type:String,required:true} ,
   imageUrl: { type: String } ,
   role: {type:String,required:true},
   isBlocked: { type: Boolean, default: false },
   courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
   resetPasswordToken: { type: String }, 
   resetPasswordExpire: { type:String },   
},
{
    timestamps:true
});

userSchema.pre('save',async function (next){
    if(!this.isModified('password')){
  next()
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt)
})

userSchema.methods.matchPasswords = async function (enteredpassword){
  return await bcrypt.compare(enteredpassword,this.password)
}

const User = mongoose.model('User',userSchema)

export default User;