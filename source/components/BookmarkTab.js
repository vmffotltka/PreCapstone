import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./BookmarkTab.css";

const API_URL = 'http://3.38.194.124:5000'; // 서버 주소

const BookmarkTab = () => {
    const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

    useEffect(() => {
        const fetchBookmarkedQuestions = async () => {
            try {
                const response = await axios.get(`${API_URL}/EduMaterials/questions/bookmarks`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setBookmarkedQuestions(response.data);
            } catch (error) {
                console.error('북마크된 문제 가져오기 오류:', error);
                alert('북마크된 문제를 가져오는 중 오류가 발생했습니다.');
            }
        };

        fetchBookmarkedQuestions();
    }, []);

    const toggleBookmark = async (questionId) => {
        const confirmDelete = window.confirm(
            '북마크를 해제하시겠습니까?'
        );

        if (!confirmDelete) return; // 사용자가 취소하면 중단
        try {
            const response = await axios.patch(
                `${API_URL}/EduMaterials/questions/${questionId}/bookmark`,
                { bookmark: 0 }, // 북마크 상태를 삭제(0)로 변경
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (response.status === 200) {
                // 상태 업데이트: 북마크에서 삭제
                setBookmarkedQuestions((prevQuestions) =>
                    prevQuestions.filter((q) => q.Q_id !== questionId)
                );
            }
        } catch (error) {
            console.error("북마크 삭제 중 오류 발생:", error);
        }
    };

    return (
        <div className="bookmark-tab">
            <h2>북마크된 문제</h2>
            <hr />
            {bookmarkedQuestions.length > 0 ? (
                <ul className="question-list">
                    {bookmarkedQuestions.map((question) => (
                        <li key={question.Q_id} className="question-item">
                            <h4>{question.Q_content}</h4>
                            <p>
                                <strong>자료: </strong> {question.Material_Title || '알 수 없음'}
                            </p>
                            <p>
                                <strong>문제 번호: </strong> {question.Question_Number || '알 수 없음'}
                            </p>
                            {/* 옵션 표시 (객관식일 경우에만) */}
                            {question.Q_options !== 'null' && (
                                <p>
                                    {JSON.parse(question.Q_options).map((option, index) => (
                                        <span key={index}>
                                            {index + 1}. {option}
                                            <br />
                                        </span>
                                    ))}
                                </p>
                            )}
                            {/* 정답 표시 (마우스 오버로 표시) */}
                            <p className="answer">
                                <strong>정답: </strong>
                                <span
                                    className="hidden-answer"
                                    onMouseEnter={(e) => {
                                        e.target.style.display = "none";
                                        const realAnswer = e.target.nextSibling;
                                        realAnswer.style.display = "inline-block";
                                    }}
                                >
                                    정답 확인하기
                                </span>
                                <span className="real-answer" style={{ display: "none" }}>
                                    {question.Q_answer}
                                </span>
                            </p>
                            <p className="explanation">
                                <strong>해설: </strong>
                                <span
                                    className="hidden-explanation"
                                    onMouseEnter={(e) => {
                                        e.target.style.display = "none";
                                        const realExplanation = e.target.nextSibling;
                                        realExplanation.style.display = "inline-block";
                                    }}
                                >
                                    해설 보기
                                </span>
                                <span className="real-explanation" style={{ display: "none" }}>
                                    {question.Q_explanation || "해설이 없습니다."}
                                </span>
                            </p>
                            {/* 북마크 삭제 버튼 */}
                            <div className="action-buttons">
                                <button
                                    className="bookmark-remove-button"
                                    onClick={() => toggleBookmark(question.Q_id)}
                                >
                                    북마크 삭제
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>북마크된 문제가 없습니다.</p>
            )}
        </div>
    );
};

export default BookmarkTab;
