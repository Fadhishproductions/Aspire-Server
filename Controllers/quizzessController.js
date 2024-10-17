import asyncHandler from 'express-async-handler';
import Quiz from '../Models/quizzessModel.js';
 
const addQuiz = asyncHandler(async(req,res)=>{
    const {  id } = req.params;
    const { questions } = req.body;
console.log(questions,"questions",req.params)
    if ( !id || !questions || questions.length === 0) {
        res.status(400);
        throw new Error(' At least one question is required');
      }

      for (const question of questions) {
        if (!question.questionText || question.questionText.trim() === '') {
          res.status(400);
          throw new Error('Each question must have a text');
        }
    
        for (const option of question.options) {
          if (option.trim() === '') {
            res.status(400);
            throw new Error(`All options must be filled in question:${question.questionText} `);
          }
        }
    
        if (question.correctOption < 0 || question.correctOption >= question.options.length) {
          res.status(400);
          throw new Error('Invalid correct option index');
        }
      }
      const existingQuiz = await Quiz.findOne({ sectionId: id });

      if(existingQuiz){
        existingQuiz.questions = questions;
        const updatedQuiz = await existingQuiz.save();

        if (!updatedQuiz) {
          res.status(400);
          throw new Error('Failed to update quiz');
      }
      res.status(200).json(updatedQuiz);
      }else{

        const quiz = new Quiz({ 
          sectionId:id,
          questions,
        });
  
        const createdQuiz = await quiz.save();
        if(!createdQuiz){ 
          res.status(400);
          throw new Error('Failed to add quiz'); 
        }
        res.status(201).json(createdQuiz);
      }

})

const getQuiz = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    if (!id) {
        res.status(400);
        console.log("id not found")
        throw new Error('Section ID is not found');
      }

      const quiz = await Quiz.findOne({ sectionId:id });

      if (!quiz) {
        res.status(400);
        throw new Error('No quiz available');
      }
       res.json(quiz.questions);
})

export{addQuiz,getQuiz}