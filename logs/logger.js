const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "files"); // logs/files 폴더

// 폴더 없으면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const LEVELS = {
  0: "ERROR",
  1: "WARN",
  2: "INFO",
};

function writeLog(levelNum, message, service = "app") {
  const level = LEVELS[levelNum] || "INFO";

  const date = new Date();
  const fileName = `log-${date.toISOString().slice(0, 10)}.log`;
  const logPath = path.join(logDir, fileName);

  const logMessage = `[${date.toISOString()}] [${service}] [${level}] ${message}\n`;

  // 비동기 (성능 개선)
  fs.appendFile(logPath, logMessage, "utf8", (err) => {
    if (err) console.error("로그 기록 실패:", err);
  });

  // 에러는 따로 저장
  if (level === "ERROR") {
    const errorPath = path.join(logDir, "error.log");

    fs.appendFile(errorPath, logMessage, "utf8", (err) => {
      if (err) console.error("에러 로그 기록 실패:", err);
    });
  }
}

// 편의 함수
function error(msg, service) {
  writeLog(0, msg, service);
}

function warn(msg, service) {
  writeLog(1, msg, service);
}

function info(msg, service) {
  writeLog(2, msg, service);
}

module.exports = {
  writeLog,
  error,
  warn,
  info,
};
