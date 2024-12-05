const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case ".pdf":
            return extractPdfContent(filePath);
        case ".txt":
            return extractTxtContent(filePath);
        case ".docx":
            return extractDocxContent(filePath);
        default:
            throw new Error("지원하지 않는 파일 형식입니다.");
    }
}

async function extractPdfContent(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
}

function extractTxtContent(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

async function extractDocxContent(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

module.exports = { extractContent };

