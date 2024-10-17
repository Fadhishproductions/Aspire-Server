import  mongoose from "mongoose";
const categoryschema = new mongoose.Schema({
   name:{type:String,required:true},
   description:{type:String,required:true},
   isPublished:{type:Boolean,default:false}
})
const Category=mongoose.model('Category',categoryschema);

 export default Category ;    