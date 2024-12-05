const OpenAI = require('openai');
const fs = require("fs");
const path = require("path");
const { extractContent } = require("../utils/fileExtractor");

const client = new OpenAI({
    apiKey: "",
});

async function generateQuestionsFromFile(filePath, objectiveCount, subjectiveCount, difficulty) {

    try {

	console.log("filePath 전달 확인:", filePath);
        // 절대 경로로 변환
        const absoluteFilePath = path.join(__dirname, "..", filePath);
        console.log("절대 경로:", absoluteFilePath);

        // 파일 존재 여부 확인
        if (!fs.existsSync(absoluteFilePath)) {
            throw new Error(`파일이 존재하지 않습니다: ${absoluteFilePath}`);
        }

        // 파일에서 텍스트 내용 추출
        const fileContent = await extractContent(absoluteFilePath);

        // OpenAI에 보낼 프롬프트 생성
        const prompt = `
            다음 텍스트를 기반으로 ${objectiveCount}개의 객관식 문제와 ${subjectiveCount}개의 주관식 문제와 정답과 해설을 생성하세요. 객관식 옵션은 1부터 4까지로 하세요. 옵션의 내용에 몇 번 옵션인지 절대 표시하지 말 것. JSON 형식 외에 다른 것은 그 어떤 것도 출력하지 말 것. 각 문제 사이에 줄바꿈을 할 것.
            난이도: ${difficulty}
            텍스트: ${fileContent}
	    생성 JSON 형식:[{type: "객관식", difficulty: 난이도, content: 문제 내용, options: 옵션의 내용, answer=번호, comment=해설}, { type: "주관식", difficulty: 난이도, content: 문제 내용, options: null, answer: 답, comment=해설}]`;
        console.log("OpenAI API로 보낼 프롬프트:", prompt);

        // OpenAI API 호출
        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
        });
	const questions = JSON.parse(response.choices[0].message.content);
        console.log("JSON 파싱 데이터:", questions);
       	return questions;
    } catch (error) {
        console.error("문제 생성 중 오류:", error.message);
        throw new Error("문제 생성 실패");
    }
}

module.exports = { generateQuestionsFromFile };
