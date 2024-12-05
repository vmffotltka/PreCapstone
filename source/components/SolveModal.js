import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SolveModal.css";

const API_URL = 'http://3.38.194.124:5000'; // 서버 주소 확인

const SolveModal = ({ onClose, material }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [feedback, setFeedback] = useState({}); // 정답 여부와 해설 저장
    const [timer, setTimer] = useState(0);

    // 문제 데이터 가져오기
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get(`${API_URL}/EduMaterials/questions/user`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                // 선택된 자료의 문제만 필터링
                const filteredQuestions = response.data.filter(
                    (q) => q.EM_id === material.EM_id
                );
                setQuestions(filteredQuestions);
            } catch (error) {
                console.error("문제 가져오기 오류:", error);
                alert("문제를 불러오는 중 오류가 발생했습니다.");
            }
        };

        fetchQuestions();// 타이머 시작
        const timerInterval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timerInterval); // 컴포넌트 언마운트 시 타이머 정리
    }, [material.EM_id]);

    // 답안 입력 핸들러
    const handleAnswerChange = (id, value) => {
        setAnswers((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // 정답 확인 핸들러
    const handleCheckAnswer = (questionId) => {
        setFeedback((prevFeedback) => {
            // 기존 피드백이 있으면 숨기기 (토글 기능)
            if (prevFeedback[questionId]) {
                const { [questionId]: _, ...rest } = prevFeedback;
                return rest;
            }

            // 새로운 피드백 추가
            const question = questions.find((q) => q.Q_id === questionId);
            const userAnswer = answers[questionId]?.trim() || "";

            const isCorrect = userAnswer === question.Q_answer.trim(); // 정답 여부 확인
            const explanation = question.Q_explanation || "해설이 제공되지 않았습니다.";
            const correctAnswer = isCorrect ? null : question.Q_answer; // 오답인 경우 정답 표시

            return {
                ...prevFeedback,
                [questionId]: { correct: isCorrect, comment: explanation, answer: correctAnswer },
            };
        });
    };

    const handleDeleteQuestion = async (id) => {
        const confirmDelete = window.confirm(
            '문제를 삭제하시겠습니까? 삭제한 후에는 복구가 불가능합니다.'
        );

        if (!confirmDelete) return; // 사용자가 취소하면 중단
        try {
            await axios.delete(`${API_URL}/EduMaterials/questions/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            // 삭제 후 상태 업데이트
            setQuestions((prevQuestions) =>
                prevQuestions.filter((q) => q.Q_id !== id)
            );

            alert("문제가 삭제되었습니다.");
        } catch (error) {
            console.error("문제 삭제 오류:", error);
            alert("문제를 삭제하는 중 오류가 발생했습니다.");
        }
    };

    // 북마크 토글
    const toggleBookmark = async (id) => {
        try {
            const question = questions.find((q) => q.Q_id === id);
            const newBookmarkStatus = question.Q_bookmark === 1 ? 0 : 1;

            // 서버로 북마크 상태 업데이트
            await axios.patch(`${API_URL}/EduMaterials/questions/${id}/bookmark`, { bookmark: newBookmarkStatus }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            // 로컬 상태 업데이트
            setQuestions((prev) =>
                prev.map((q) =>
                    q.Q_id === id ? { ...q, Q_bookmark: newBookmarkStatus } : q
                )
            );
        } catch (error) {
            console.error("북마크 토글 오류:", error);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="solve-modal-backdrop">
                <div className="solve-modal no-questions">
                    <h2>{material.EM_title} - 문제 풀기</h2>
                    <p>문제가 없습니다. 문제 만들기 버튼을 눌러 생성하세요!</p>
                    <button className="close-edit-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="solve-modal-backdrop" onClick={onClose}>
            <div className="solve-modal" onClick={(e) => e.stopPropagation()}>
                <div className="solve-modal-header">
                    <h2>{material.EM_title} - 문제 풀기</h2>
                    {/* X 버튼 추가 */}
                    <button className="close-edit-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="solve-modal-content">
                    <ul className="question-list">
                        {questions.map((question) => {
                            // Q_options 파싱
                            let parsedOptions = [];
                            if (question.Q_options) {
                                try {
                                    parsedOptions = JSON.parse(question.Q_options);
                                } catch (error) {
                                    console.error("Q_options 파싱 오류:", error);
                                }
                            }

                            return (
                                <li key={question.Q_id} className="question-item">
                                    <h4>Q{question.Question_Number}: {question.Q_content}</h4>

                                    {/* 옵션 표시 */}
                                    {Array.isArray(parsedOptions) && parsedOptions.length > 0 && (
                                        <div>
                                            {parsedOptions.map((option, index) => (
                                                <p key={index}>
                                                    {index + 1}. {option}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {/* 답안 입력 섹션 */}
                                    <div className="answer-section">
                                        <label>
                                            <strong>답안:</strong>
                                            <input
                                                type="text"
                                                value={answers[question.Q_id] || ""}
                                                onChange={(e) =>
                                                    handleAnswerChange(question.Q_id, e.target.value)
                                                }
                                            />
                                        </label>
                                    </div>
                                    {/* 정답 확인 버튼 */}
                                    <button
                                        onClick={() => handleCheckAnswer(question.Q_id)}
                                        className="check-answer-button"
                                    >
                                        {feedback[question.Q_id] ? "답 숨기기" : "답 확인하기"}
                                    </button>
                                    {/* 정답 여부 및 해설 표시 */}
                                    {feedback[question.Q_id] && (
                                        <div className="feedback">
                                            <p
                                                style={{
                                                    color: feedback[question.Q_id].correct ? "green" : "red", // 색상 강조
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                <strong>결과:</strong> {feedback[question.Q_id].correct ? "정답입니다!" : "오답입니다."}
                                            </p>

                                            {!feedback[question.Q_id].correct && (
                                                <p>
                                                    <strong>정답:</strong> {feedback[question.Q_id].answer}
                                                </p>
                                            )}

                                            <p>
                                                <strong>해설:</strong> {feedback[question.Q_id].comment}
                                            </p>
                                        </div>
                                    )}

                                    {/* 북마크 버튼 */}
                                    <button
                                        className={`bookmark-button ${question.Q_bookmark === 1 ? "bookmarked" : ""}`}
                                        onClick={() => toggleBookmark(question.Q_id)}
                                    >
                                        {question.Q_bookmark === 1 ? "북마크 해제" : "북마크"}
                                    </button>

                                    {/* 문제 삭제 버튼 */}
                                    <button className="delete-button" onClick={() => handleDeleteQuestion(question.Q_id)} >
                                        문제 삭제
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SolveModal;
