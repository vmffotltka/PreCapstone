const express = require("express");
const { generateQuestionsFromFile } = require("../services/generateQuestionsFromFile");
const router = express.Router();

router.post("/questions", async (req, res) => {
    try {
        const { filePath, objectiveCount, subjectiveCount, difficulty } = req.body;
	console.log("받은 요청 데이터:", { filePath, objectiveCount, subjectiveCount, difficulty }); // 요청 데이터 출력

        if (!filePath || objectiveCount == null || subjectiveCount == null || !difficulty) {
            return res.status(400).json({ error: "필수 데이터가 누락되었습니다." });
        }

        const questions = await generateQuestionsFromFile(filePath, objectiveCount, subjectiveCount, difficulty);
        res.json({ questions });
    } catch (error) {
        console.error("문제 생성 중 오류:", error);
        res.status(500).json({ error: "문제 생성 실패" });
    }
});

module.exports = router;

