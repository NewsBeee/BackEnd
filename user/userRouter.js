const express = require("express");
const router = express.Router(); //라우팅 객체를 만듦
const user = require("./user.js"); //함수 호출

router.post("/auth/signup", user.signup); //회원가입
router.post("/auth/login", user.login); //로그인
router.post("/auth/logout", user.logout); //로그아웃
router.delete("/auth/withdraw", user.deleteuser); //사용자 삭제
module.exports = router;
