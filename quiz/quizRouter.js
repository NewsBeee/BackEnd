const express=require("express");
const router=express.Router();
const quiz=require("./quiz");

router.get("/quizzes/promotion/questions",quiz.getPromotionQuestions);
router.post("/quizzes/promotion/submit",quiz.submitPromotionQuiz);

module.exports=router;