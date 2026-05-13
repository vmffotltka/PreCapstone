import React, { useState } from 'react';
import './MockEditModal.css';
import axios from 'axios';

const API_URL = "http://3.38.194.124:5000";

const MockEditModal = ({ mockExam, onClose, onMockExamUpdated, onMockExamDeleted }) => {
    const [newTitle, setNewTitle] = useState(mockExam.title || '');
    const [newDescription, setNewDescription] = useState(mockExam.description || '');

    const handleSave = async () => {
        try {
            const response = await axios.put(
                `${API_URL}/EduMaterials/mockExams/${mockExam.ME_id}`,
                {
                    title: newTitle || mockExam.ME_title,
                    description: newDescription || mockExam.ME_description,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            onMockExamUpdated(response.data);
            alert("모의고사가 성공적으로 수정되었습니다.");
            onClose();
        } catch (error) {
            console.error("모의고사 수정 오류:", error);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        try {
            if (window.confirm("정말로 이 모의고사를 삭제하시겠습니까?")) {
                await axios.delete(`${API_URL}/EduMaterials/mockExams/${mockExam.ME_id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                alert("모의고사가 삭제되었습니다.");
                onMockExamDeleted(mockExam.ME_id);
                onClose();
            }
        } catch (error) {
            console.error("모의고사 삭제 오류:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <>
            <div className="mock-edit-overlay" onClick={onClose}></div>
            <div className="mock-edit-modal">
                <h2 className="mock-edit-title">모의고사 수정</h2>
                <div className="mock-edit-form">
                    <label className="mock-edit-label">모의고사 이름 변경:</label>
                    <input
                        type="text"
                        className="mock-edit-input"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />

                    <label className="mock-edit-label">모의고사 설명 변경:</label>
                    <textarea
                        className="mock-edit-textarea"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                    ></textarea>

                    <div className="mock-edit-actions">
                        <button className="mock-edit-button mock-edit-save" onClick={handleSave}>
                            저장
                        </button>
                        <button className="mock-edit-button mock-edit-delete" onClick={handleDelete}>
                            모의고사 삭제
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MockEditModal;
