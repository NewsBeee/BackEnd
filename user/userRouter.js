const express = require("express");
const router = express.Router(); //라우팅 객체를 만듦
const user = require("./user.js"); //함수 호출

router.post("/auth/signup", user.signup); //회원가입
router.post("/auth/login", user.login); //로그인
router.post("/auth/logout", user.logout); //로그아웃
router.delete("/auth/withdraw", user.deleteuser); //사용자 삭제
router.get("/users/me", user.mypage); //마이페이지
router.patch("/users/me", user.updatemypage); //마이페이지
router.get("/users/me/stats", user.stats); //학습데이터
router.get("/users/check", userController.checkLogin); //로그인 상태확인
module.exports = router;
