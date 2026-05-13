import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MockSolveModal.css';

const API_URL = "http://3.38.194.124:5000";

const MockSolveModal = ({ mockExam, onClose }) => {
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [timer, setTimer] = useState(0);
    const [feedback, setFeedback] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [startTime] = useState(Date.now());

    // Fetch questions on mount
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await axios.get(`${API_URL}/EduMaterials/mockExams/${mockExam.ME_id}/questions`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setQuestions(response.data);
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
        };

        fetchQuestions();
        // Timer
        if (submitted) return; // 제출된 경우 타이머 중단
        const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [mockExam, submitted]);

    const handleChange = (questionId, value) => {
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSubmit = async () => {
        const unansweredQuestions = questions.filter((question) => !userAnswers[question.Q_id]);
        const confirmMessage = unansweredQuestions.length > 0
            ? "답안을 전부 작성하지 못했습니다. 그래도 제출하시겠습니까?"
            : "제출하시겠습니까?";
        if (!window.confirm(confirmMessage)) return;
    
        const endTime = Date.now();
        const elapsedTime = Math.floor((endTime - startTime) / 1000);
    
        const results = questions.map((question) => {
            const userAnswer = userAnswers[question.Q_id] || ""; // 사용자가 입력한 답
            const isCorrect = userAnswer.trim() === question.Q_answer.trim(); // 정답 비교
            return {
                Question_id: question.Q_id,
                SubmittedAnswer: userAnswer,
                IsCorrect: isCorrect,
                Feedback: question.Q_explanation || "해설이 없습니다.",
                CorrectAnswer: question.Q_answer,
            };
        });
    
        const summary = results.reduce(
            (acc, res) => {
                const question = questions.find((q) => q.Q_id === res.Question_id);
                const isCorrect = res.IsCorrect;
                const type = question.Q_type;
                const difficulty = question.Q_difficulty;
    
                acc.correctAnswers += isCorrect ? 1 : 0;
                acc.objectiveCorrect += isCorrect && type === "객관식" ? 1 : 0;
                acc.subjectiveCorrect = acc.correctAnswers - acc.objectiveCorrect;
                acc.highCorrect += isCorrect && (difficulty === "high" || difficulty === "어려움") ? 1 : 0;
                acc.mediumCorrect += isCorrect && (difficulty === "normal" || difficulty === "중간") ? 1 : 0;
                acc.lowCorrect = acc.correctAnswers - acc.highCorrect - acc.mediumCorrect;
    
                return acc;
            },
            { correctAnswers: 0, objectiveCorrect: 0, subjectiveCorrect: 0, highCorrect: 0, mediumCorrect: 0, lowCorrect: 0 }
        );
    
        // 피드백 업데이트
        setFeedback(results.reduce((acc, res) => {
            acc[res.Question_id] = res;
            return acc;
        }, {}));
    
        // 서버에 저장
        try {
            await axios.post(
                `${API_URL}/EduMaterials/mockExams/${mockExam.ME_id}/submit`,
                {
                    User_id: localStorage.getItem("userId"),
                    TotalQuestions: questions.length,
                    CorrectAnswers: summary.correctAnswers,
                    ObjectiveCorrect: summary.objectiveCorrect,
                    SubjectiveCorrect: summary.subjectiveCorrect,
                    HighCorrect: summary.highCorrect,
                    MediumCorrect: summary.mediumCorrect,
                    LowCorrect: summary.lowCorrect,
                    ElapsedTime: elapsedTime, // 걸린 시간 추가
                    Answers: results,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`, // 헤더 추가
                    },
                }
            );
            alert("제출 완료! 결과가 저장되었습니다.");
            setSubmitted(true); // 제출 상태를 업데이트
        } catch (error) {
            console.error("제출 오류:", error.response?.data || error.message);
            alert("결과를 저장하는 중 오류가 발생했습니다.");
        }
    };
    
    const handleBookmarkToggle = async (questionId, newBookmarkState) => {
        try {
            const response = await axios.patch(
                `${API_URL}/EduMaterials/questions/${questionId}/bookmark`,
                { bookmark: newBookmarkState },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
    
            // 성공적으로 업데이트 후, 상태 갱신
            setQuestions((prevQuestions) =>
                prevQuestions.map((q) =>
                    q.Q_id === questionId ? { ...q, Q_bookmark: newBookmarkState } : q
                )
            );
        } catch (error) {
            console.error("북마크 상태 업데이트 오류:", error);
            alert("북마크 상태를 업데이트하는 중 오류가 발생했습니다.");
        }
    };
    

    return (
        <>
        <div className="mock-solve-overlay" onClick={onClose}></div>
        <div className="mock-solve-modal">
            <div className="mock-solve-header">
                <h2>{submitted ? `${mockExam.ME_title}: 모의고사 결과` : `${mockExam.ME_title}: 모의고사 풀기`}</h2>
                <button className="mock-solve-close-button" onClick={onClose}>
                    &times;
                </button>
                <div className="mock-solve-timer">타이머: {Math.floor(timer / 60)}:{timer % 60}</div>
            </div>
            <div className="mock-solve-body">
                <div className="mock-solve-sidebar">
                    <h3>문제 상태</h3>
                    <ul className="mock-solve-checklist">
                        {questions.map((question, index) => {
                            const isCorrect = feedback[question.Q_id]?.IsCorrect; // 문제의 정답 여부
                            return (
                                <li
                                    key={question.Q_id}
                                    className={
                                        isCorrect === undefined
                                            ? "" // 기본 상태
                                            : isCorrect
                                            ? "correct" // 정답
                                            : "incorrect" // 오답
                                    }
                                >
                                    <label>
                                        <input
                                            type="checkbox"
                                            readOnly
                                            checked={userAnswers[question.Q_id]?.length > 0}
                                        />
                                        {index + 1}번
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="mock-solve-content">
                    {questions.map((question, index) => (
                        <div key={question.Q_id} className="mock-solve-question-box">
                            <h4>Q{index + 1}. {question.Q_content}</h4>
                            {question.Q_type === "객관식" ? (
                                <div className="mock-solve-options">
                                    {JSON.parse(question.Q_options).map((option, i) => (
                                        <label key={i} className="mock-solve-option">
                                            <input
                                                type="radio"
                                                name={`question-${question.Q_id}`}
                                                value={i + 1}
                                                onChange={(e) => handleChange(question.Q_id, e.target.value)}
                                                disabled={submitted} // 제출 시 비활성화
                                            />
                                            {i + 1}번: {option}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="mock-solve-answer">
                                    <label>
                                        정답:
                                        <input
                                            type="text"
                                            className="mock-solve-input"
                                            onChange={(e) => handleChange(question.Q_id, e.target.value)}
                                            disabled={submitted} // 제출 시 비활성화
                                        />
                                    </label>
                                </div>
                            )}
                            {submitted && (
                                <button
                                    className={`mock-solve-bookmark-button ${question.Q_bookmark ? "bookmarked" : ""}`}
                                    onClick={() => handleBookmarkToggle(question.Q_id, !question.Q_bookmark)}
                                >
                                    {question.Q_bookmark ? "북마크 해제" : "북마크"}
                                </button>
                            )}
                            {feedback[question.Q_id] && (
                                <div className={`feedback ${feedback[question.Q_id].IsCorrect ? "correct" : "incorrect"}`}>
                                    {feedback[question.Q_id].IsCorrect ? "정답입니다!" : "오답입니다."}
                                    {!feedback[question.Q_id].IsCorrect && (
                                        <p className="correct-answer">정답: {feedback[question.Q_id].CorrectAnswer}</p>
                                    )}
                                    <p>{feedback[question.Q_id].Feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mock-solve-footer">
                <button className="mock-solve-cancel-button" onClick={onClose} disabled={submitted}>
                    취소
                </button>
                <button className="mock-solve-submit-button" onClick={handleSubmit} disabled={submitted}>
                    {submitted ? "제출 완료" : "제출하기"}
                </button>
            </div>
        </div>
        </>
    );
};

export default MockSolveModal;
