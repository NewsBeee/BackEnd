const express = require("express");
const router = express.Router();
const challenge = require("./challenge");

router.post("/challenges", challenge.createChallenge);
router.get("/challenges/current", challenge.getCurrentChallenge);
router.get("/challenges/progress", challenge.getChallengeProgress);
router.get("/challenges/history", challenge.getChallengeHistory);

module.exports = router;