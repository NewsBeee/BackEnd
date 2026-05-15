const vocaModel = require("./vocaModel");
const logger = require("../logs/logger");

// 기사 내 단어 저장
exports.saveVocabulary = async (req, res) => {
  const userId = req.session?.user?.id;
  const { articleId, word, meaning, isBookmarked } = req.body;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!articleId || !word || !meaning || typeof isBookmarked !== "boolean") {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_001",
      message: "필수 입력값이 누락되었습니다.",
      result: null,
    });
  }

  try {
    const existing = await vocaModel.findVocabularyByWord(userId, word);

    if (existing) {
      await vocaModel.updateVocabularyBookmark(
        existing.voca_id,
        articleId,
        meaning,
        isBookmarked,
      );

      logger.info(
        `단어 갱신 성공: user_id=${userId}, voca_id=${existing.voca_id}, word=${word}`,
        "voca-service",
      );

      return res.status(200).json({
        timestamp: new Date().toISOString(),
        success: true,
        code: "VOCAB_200",
        message: "단어가 갱신되었습니다.",
        result: {
          vocaId: existing.voca_id,
        },
      });
    }

    const rows = await vocaModel.createVocabulary(
      userId,
      articleId,
      word,
      meaning,
      isBookmarked,
    );

    logger.info(`단어 저장 성공: user_id=${userId}, word=${word}`, "voca-service");

    return res.status(201).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "VOCAB_201",
      message: "단어가 저장되었습니다.",
      result: {
        vocaId: rows.insertId,
      },
    });
  } catch (err) {
    logger.error(
      `단어 저장 실패: user_id=${userId}, word=${word} - [ERROR_CODE:VOCAB_503] - ${err.message}`,
      "voca-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_503",
      message: "단어 저장 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 저장 단어 목록 조회 / 학습 상태별 단어 목록 조회
exports.getVocabularyList = async (req, res) => {
  const userId = req.session?.user?.id;
  const { page = 1, size = 20, status } = req.query;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (status && status !== "MEMORIZED" && status !== "UNMEMORIZED") {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_001",
      message: "status 값이 올바르지 않습니다.",
      result: null,
    });
  }

  try {
    const pageNum = Math.max(Number(page) || 1, 1);
    const sizeNum = Math.max(Number(size) || 20, 1);

    const limit = sizeNum;
    const offset = (pageNum - 1) * sizeNum;

    const rows = await vocaModel.getVocabularyList(userId, status, limit, offset);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "VOCAB_200",
      message: status
        ? "학습 상태별 단어 목록 조회에 성공했습니다."
        : "저장 단어 목록 조회에 성공했습니다.",
      result: {
        vocabularies: rows.map((row) => ({
          vocaId: row.voca_id,
          word: row.word,
          meaning: row.meaning,
          status: row.learning_status,
        })),
      },
    });
  } catch (err) {
    logger.error(
      `단어 목록 조회 실패: user_id=${userId} - [ERROR_CODE:VOCAB_502] - ${err.message}`,
      "voca-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_502",
      message: "단어장 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 단어 검색
exports.searchVocabulary = async (req, res) => {
  const userId = req.session?.user?.id;
  const { keyword } = req.query;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!keyword) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_001",
      message: "검색어가 필요합니다.",
      result: null,
    });
  }

  try {
    const rows = await vocaModel.searchVocabulary(userId, keyword);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "VOCAB_200",
      message: "단어 검색에 성공했습니다.",
      result: {
        vocabularies: rows.map((row) => ({
          vocaId: row.voca_id,
          word: row.word,
          meaning: row.meaning,
          status: row.learning_status,
        })),
      },
    });
  } catch (err) {
    logger.error(
      `단어 검색 실패: user_id=${userId}, keyword=${keyword} - [ERROR_CODE:VOCAB_505] - ${err.message}`,
      "voca-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_505",
      message: "단어 검색 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 단어 학습 상태 변경
exports.updateVocabularyStatus = async (req, res) => {
  const userId = req.session?.user?.id;
  const { vocaId } = req.params;
  const { status } = req.body;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (status !== "MEMORIZED" && status !== "UNMEMORIZED") {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_001",
      message: "학습 상태 값이 올바르지 않습니다.",
      result: null,
    });
  }

  try {
    const existing = await vocaModel.findVocabularyById(userId, vocaId);

    if (!existing) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "VOCAB_506",
        message: "해당 단어를 찾을 수 없습니다.",
        result: null,
      });
    }

    await vocaModel.updateVocabularyStatus(vocaId, status);

    logger.info(
      `단어 학습 상태 변경 성공: user_id=${userId}, voca_id=${vocaId}, status=${status}`,
      "voca-service",
    );

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "VOCAB_200",
      message: "단어 학습 상태가 변경되었습니다.",
      result: null,
    });
  } catch (err) {
    logger.error(
      `단어 학습 상태 변경 실패: user_id=${userId}, voca_id=${vocaId} - [ERROR_CODE:VOCAB_506] - ${err.message}`,
      "voca-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "VOCAB_506",
      message: "단어 학습 상태 변경 중 오류가 발생했습니다.",
      result: null,
    });
  }
};