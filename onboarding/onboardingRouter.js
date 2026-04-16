const express=require("express");
const router=express.Router();
const onboarding=require("./onboarding");

router.get("/onboarding/questions",onboarding.getQuestions);
router.post("/onboarding/submit",onboarding.submitAnswers);

module.exports=router;