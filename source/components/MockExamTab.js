import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UploadExamModal from "./UploadExamModal";
import MockEditModal from './MockEditModal';
import MockSolveModal from './MockSolveModal';
import MockResultModal from './MockResultModal';
import "./MockExamTab.css";

const API_URL = 'http://3.38.194.124:5000'; // 서버 주소

const MockExamTab = () => {
    const [mockExams, setMockExams] = useState([]);
    const [selectedMockExam, setSelectedMockExam] = useState(null);
    const [isSolveModalOpen, setIsSolveModalOpen] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedResultExam, setSelectedResultExam] = useState(null);

    const openUploadModal = () => setIsUploadModalOpen(true);
    const closeUploadModal = () => setIsUploadModalOpen(false);

    // 모의고사 목록 가져오기
    const fetchMockExams = async () => {
        try {
            const response = await axios.get(`${API_URL}/EduMaterials/mockExams`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMockExams(response.data); // 목록 상태 업데이트
            console.log(response.data);
        } catch (error) {
            console.error("모의고사 불러오기 오류:", error);
            alert("모의고사를 불러오는 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        fetchMockExams(); // 초기 목록 로드
    }, []);

    // 업로드 후 목록 업데이트
    const handleUploadSuccess = async () => {
        try {
            await fetchMockExams(); // 업로드 후 목록 다시 불러오기
        } catch (error) {
            console.error("목록 갱신 오류:", error);
        }
    };

    const handleMockExamUpdated = (updatedMockExam) => {
        setMockExams((prev) =>
            prev.map((exam) => (exam.ME_id === updatedMockExam.ME_id ? updatedMockExam : exam))
        );
    };

    const handleMockExamDeleted = (deletedMockExamId) => {
        setMockExams((prev) => prev.filter((exam) => exam.ME_id !== deletedMockExamId));
    };

    const handleSolveExam = (exam) => {
        setIsSolveModalOpen(exam); // 모달 열기
    };

    // 기록 보기 클릭 핸들러
    const handleViewResults = (exam) => {
        setSelectedResultExam(exam);
    };

    return (
        <div className="mock-exam-tab">
            <h2>모의고사 목록</h2>
            <hr></hr>
            {isUploadModalOpen && (
                <UploadExamModal
                    onClose={closeUploadModal}
                    onUploadSuccess={handleUploadSuccess} // 업로드 성공 시 콜백
                />
            )}
            {selectedMockExam && (
                <MockEditModal
                    mockExam={selectedMockExam}
                    onClose={() => setSelectedMockExam(null)}
                    onMockExamUpdated={handleMockExamUpdated}
                    onMockExamDeleted={handleMockExamDeleted}
                />
            )}
            {isSolveModalOpen && (
                <MockSolveModal
                    mockExam={isSolveModalOpen}
                    onClose={() => setIsSolveModalOpen(false)} // 모달 닫기
                />
            )}
            {selectedResultExam && (
                <MockResultModal
                    mockExam={selectedResultExam}
                    onClose={() => setSelectedResultExam(null)}
                />
            )}
            {mockExams.length > 0 ? (
                <ul className="mock-exam-list">
                    {mockExams.map((exam) => (
                        <li key={exam.ME_id} className="mock-exam-item">
                            <div className="mock-exam-content">
                                <h4>{exam.ME_title}</h4>
                                <p className="mock-exam-description">
                                    {exam.ME_description || "설명이 없습니다."}
                                </p>
                                <div className="mock-exam-actions">
                                    <button
                                        className="mock-edit-button"
                                        onClick={() => setSelectedMockExam(exam)} // 수정 버튼 클릭 시 MockEditModal 열기
                                    >
                                        모의고사 수정
                                    </button>
                                    <button
                                        className="mock-solve-button"
                                        onClick={() => handleSolveExam(exam)}
                                    >
                                        모의고사 풀기
                                    </button>
                                    <button
                                        className="mock-view-record-button"
                                        onClick={() => handleViewResults(exam)}
                                    >
                                        기록 보기
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>생성된 모의고사가 없습니다.</p>
            )}
            <button className="mock-upload-button" onClick={openUploadModal}>
                모의고사 업로드
            </button>
        </div>
    );
};

export default MockExamTab;
