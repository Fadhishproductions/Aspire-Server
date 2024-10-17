import mongoose from "mongoose";



const questionSchema = new mongoose.Schema({
    questionText: {
      type: String,
      required: true,
    },
    options: [
      {
        type: String,
        required: true,
      },
    ],
    correctOption: {
      type: Number,  
      required: true,
    },
  });

const quizSchema = new mongoose.Schema({
     
    sectionId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Section',
      required:true
  },
    questions:[questionSchema],
    createdAt: {
        type: Date,
        default: Date.now,
      },
})

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;