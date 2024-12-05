import React, { useState } from "react";
import "./CreateQuestionSet.css";

const CreateQuestionSet = ({ onSuccess }) => {
    const [questionSet, setQuestionSet] = useState({
        objectiveCount: 0,
        subjectiveCount: 0,
        difficulty: "중",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setQuestionSet({ ...questionSet, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 서버로 데이터 전송 로직 추가 가능
        onSuccess({
            id: Date.now(), // 임시 ID 생성
            ...questionSet,
        });
        alert("모의고사가 성공적으로 생성되었습니다.");
    };

    return (
        <form onSubmit={handleSubmit} className="create-question-set-form">
            <label>
                객관식 문제 개수:
                <input
                    type="number"
                    name="objectiveCount"
                    value={questionSet.objectiveCount}
                    onChange={handleChange}
                />
            </label>
            <label>
                주관식 문제 개수:
                <input
                    type="number"
                    name="subjectiveCount"
                    value={questionSet.subjectiveCount}
                    onChange={handleChange}
                />
            </label>
            <label>
                난이도:
                <select
                    name="difficulty"
                    value={questionSet.difficulty}
                    onChange={handleChange}
                >
                    <option value="하">하</option>
                    <option value="중">중</option>
                    <option value="상">상</option>
                </select>
            </label>
            <button type="submit">모의고사 생성</button>
        </form>
    );
};

export default CreateQuestionSet;
