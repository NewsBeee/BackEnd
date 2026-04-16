//임시 문제 1개
//AI 연동 시 수정
const promotionQuestions = [
  {
    questionId: 11,
    questionText: "‘타협’의 의미로 가장 적절한 것을 고르세요.",
		choices: [
			{ choiceId: 1, choiceText: "한쪽이 일방적으로 따름" },
			{ choiceId: 2, choiceText: "서로 양보하여 의견을 맞춤" },
			{ choiceId: 3, choiceText: "완전히 반대함" },
			{ choiceId: 4, choiceText: "논의를 중단함" },
		],
    answer: 2, // 내부 채점용
  },
];

//프론트 전달 문제 목록
exports.getQuestions = async () => {
  return promotionQuestions.map(({ questionId, questionText, choices }) => ({
    questionId,
    questionText,
    choices,
  }));
};

//내부 채점용 원본 문제
exports.getRawQuestions = async () => {
  return promotionQuestions;
};