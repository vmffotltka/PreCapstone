import React, { useState } from "react";
import axios from "axios";
import "./QuestionModal.css";

const API_URL = 'http://3.38.194.124:5000';

const QuestionModal = ({ material, onClose, onRefreshQuestions }) => {
    const [objectiveCount, setObjectiveCount] = useState(0);
    const [subjectiveCount, setSubjectiveCount] = useState(0);
    const [difficulty, setDifficulty] = useState("중간");

    const handleGenerateAndSave = async () => {
        try {
            // 자료 ID와 사용자 입력값 준비
            const payload = {
                filePath: material.EM_path, // 업로드된 자료 경로
                objectiveCount,
                subjectiveCount,
                difficulty,
            };
            console.log("API 요청 데이터:", payload); // 요청 데이터 출력
    
            // 문제 생성 API 호출
            const response = await axios.post(
                `${API_URL}/EduMaterials/questions`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            console.log("API 응답 데이터:", response.data); // 응답 데이터 출력
            alert("문제가 성공적으로 생성되었습니다.");
            // 문제 생성 결과 확인
            const generatedQuestions = response.data.questions;
            
            // 문제 저장 API 호출
            const savePayload = {
                userId: localStorage.getItem('userId'),
                emId: material.EM_id,
                questions: generatedQuestions.map((q) => ({
                    type: q.type,
                    comment: q.comment,
                    content: q.content,
                    options: q.options || null, // 객관식일 경우 옵션 포함
                    answer: q.answer,
                    difficulty: q.difficulty || "normal" // 난이도 추가
                })),
            };
            console.log("저장 요청 데이터:", savePayload); // 전송 데이터 확인
    
            await axios.post(`${API_URL}/EduMaterials/questions/save`, savePayload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
    
            alert("문제가 성공적으로 생성 및 저장되었습니다.");
            if (onRefreshQuestions) onRefreshQuestions(); // 문제 목록 갱신
            onClose();
        } catch (error) {
            console.error("문제 생성 및 저장 오류:", error);
            alert("문제 생성에 실패했습니다.");
        }
    };

    return (
        <div className="question-modal-backdrop" onClick={onClose}>
            <div className="question-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{material.EM_title} 문제 만들기</h2>
                <button className="close-edit-button" onClick={onClose}>
                    &times;
                </button>
                <p>파일 경로: {material.EM_path}</p>
                <label>
                    객관식 문제 수:
                    <input
                        type="number"
                        value={objectiveCount}
                        onChange={(e) => setObjectiveCount(Number(e.target.value))}
                    />
                </label>
                <label>
                    주관식 문제 수:
                    <input
                        type="number"
                        value={subjectiveCount}
                        onChange={(e) => setSubjectiveCount(Number(e.target.value))}
                    />
                </label>
                <label>
                    난이도:
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="쉬움">쉬움</option>
                        <option value="중간">중간</option>
                        <option value="어려움">어려움</option>
                    </select>
                </label>
                <div className="button-group">
                    <button className="save-button" onClick={handleGenerateAndSave}>
                        문제 생성 및 저장
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionModal;
