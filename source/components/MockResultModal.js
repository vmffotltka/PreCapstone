import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MockResultModal.css';

const API_URL = 'http://3.38.194.124:5000';

const MockResultModal = ({ mockExam, onClose }) => {
    const [results, setResults] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // 정렬 상태

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get(`${API_URL}/EduMaterials/mockExams/${mockExam.ME_id}/results`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setResults(response.data);
            } catch (error) {
                console.error('결과 가져오기 오류:', error);
                alert('결과를 가져오는 중 오류가 발생했습니다.');
            }
        };

        fetchResults();
    }, [mockExam]);

    const sortedResults = [...results].map((result) => ({
        ...result,
        Accuracy: Math.round((result.CorrectAnswers / result.TotalQuestions) * 100),
    })).sort((a, b) => {
        if (sortConfig.key) {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
            if (typeof a[sortConfig.key] === 'string') {
                return direction * a[sortConfig.key].localeCompare(b[sortConfig.key]);
            } else {
                return direction * (a[sortConfig.key] - b[sortConfig.key]);
            }
        }
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig((prevConfig) => {
            // 동일 키 클릭 시 방향 변경
            if (prevConfig.key === key) {
                return {
                    key,
                    direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            // 새로운 키 클릭 시 오름차순
            return { key, direction: 'asc' };
        });
    };    

    return (
        <div className="mock-result-modal-overlay" onClick={onClose}>
            <div className="mock-result-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{mockExam.ME_title}: 모의고사 결과</h2>
                {results.length > 0 ? (
                    <table className="result-summary-table">
                        <thead>
                            <tr>
                                <th className={sortConfig.key === 'SubmittedAt' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('SubmittedAt')}>제출일</th>
                                <th className={sortConfig.key === 'ElapsedTime' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('ElapsedTime')}>걸린 시간</th>
                                <th className={sortConfig.key === 'TotalQuestions' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('TotalQuestions')}>총 문제</th>
                                <th className={sortConfig.key === 'CorrectAnswers' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('CorrectAnswers')}>맞은 문제 수</th>
                                <th className={sortConfig.key === 'ObjectiveCorrect' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('ObjectiveCorrect')}>객관식</th>
                                <th className={sortConfig.key === 'SubjectiveCorrect' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('SubjectiveCorrect')}>주관식</th>
                                <th className={sortConfig.key === 'HighCorrect' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('HighCorrect')}>어려움</th>
                                <th className={sortConfig.key === 'MediumCorrect' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('MediumCorrect')}>보통</th>
                                <th className={sortConfig.key === 'LowCorrect' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('LowCorrect')}>쉬움</th>
                                <th className={sortConfig.key === 'Accuracy' ? `sorted-${sortConfig.direction}` : ''} onClick={() => handleSort('Accuracy')}>정답률</th>
                            </tr>
                        </thead>
                        <tbody>
                        {sortedResults.map((result) => {
                            // 날짜 포맷팅
                            const submittedDate = new Date(result.SubmittedAt);
                            const formattedDate = `${submittedDate.getFullYear()}년 ${String(
                            submittedDate.getMonth() + 1
                            ).padStart(2, '0')}월 ${String(submittedDate.getDate()).padStart(2, '0')}일 ${String(
                            submittedDate.getHours()
                            ).padStart(2, '0')}시 ${String(submittedDate.getMinutes()).padStart(2, '0')}분 ${String(
                            submittedDate.getSeconds()
                            ).padStart(2, '0')}초`;

                            // 걸린 시간 포맷팅
                            const elapsedMinutes = Math.floor(result.ElapsedTime / 60);
                            const elapsedSeconds = result.ElapsedTime % 60;
                            const formattedElapsedTime = `${String(elapsedMinutes).padStart(2, '0')}분 ${String(
                            elapsedSeconds
                            ).padStart(2, '0')}초`;

                            return (
                            <tr key={result.Result_id}>
                                <td>{formattedDate}</td>
                                <td>{formattedElapsedTime}</td>
                                <td>{result.TotalQuestions}</td>
                                <td>{result.CorrectAnswers}</td>
                                <td>{result.ObjectiveCorrect}</td>
                                <td>{result.SubjectiveCorrect}</td>
                                <td>{result.HighCorrect}</td>
                                <td>{result.MediumCorrect}</td>
                                <td>{result.LowCorrect}</td>
                                <td>{`${Math.round((result.CorrectAnswers / result.TotalQuestions) * 100)}%`}</td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (
                    <p>결과 데이터가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default MockResultModal;
