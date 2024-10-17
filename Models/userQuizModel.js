import mongoose from "mongoose";

const userQuizSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz', // Reference to the Quiz model
      required: true,
    },
    completedQuestions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        selectedOption: {
          type: Number, // Index of the option selected by the user
          required: true,
        },
        isCorrect: {
          type: Boolean, // Whether the selected option is correct
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const UserQuiz = mongoose.model('UserQuiz', userQuizSchema);
  
  export default UserQuiz;
  