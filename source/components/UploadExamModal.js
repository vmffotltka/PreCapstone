import React, { useState, useEffect } from 'react';
import './UploadExamModal.css'; // CSS 파일 적용
import axios from 'axios';

const API_URL = "http://3.38.194.124:5000";

const UploadExamModal = ({ onClose, onUploadSuccess }) => {
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [summary, setSummary] = useState({
        objective: 0,
        subjective: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
    });
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const fetchMaterialDetails = async () => {
            try {
                const response = await axios.get(`${API_URL}/EduMaterials/details`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setAvailableMaterials(response.data);
            } catch (error) {
                console.error("자료 세부 정보 불러오기 오류:", error);
            }
        };
        fetchMaterialDetails();
    }, []);

    const handleMaterialSelect = (material) => {
        const isSelected = selectedMaterials.find((item) => item.EM_id === material.EM_id);

        if (isSelected) {
            // 선택 해제
            const updatedMaterials = selectedMaterials.filter((item) => item.EM_id !== material.EM_id);
            setSelectedMaterials(updatedMaterials);
            updateSummary(updatedMaterials);
        } else {
            // 선택 추가
            const updatedMaterials = [...selectedMaterials, material];
            setSelectedMaterials(updatedMaterials);
            updateSummary(updatedMaterials);
        }
    };

    const updateSummary = (materials) => {
        const newSummary = materials.reduce(
            (acc, material) => {
                return {
                    objective: acc.objective + material.objectiveCount,
                    subjective: acc.subjective + material.subjectiveCount,
                    high: acc.high + material.high,
                    medium: acc.medium + material.medium,
                    low: acc.low + material.low,
                    total: acc.total + material.objectiveCount + material.subjectiveCount, // 총 문제 수 계산
                };
            },
            { objective: 0, subjective: 0, high: 0, medium: 0, low: 0, total: 0 }
        );
        setSummary(newSummary);
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!title || selectedMaterials.length === 0) {
            alert("제목과 자료를 선택해주세요!");
            return;
        }
    
        try {
            const response = await axios.post(
                `${API_URL}/EduMaterials/mockExams/upload`,
                {
                    title, // 제목
                    description, // 설명 추가
                    content: JSON.stringify(selectedMaterials), // 선택된 자료를 JSON 형태로 변환하여 content로 전달
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
    
            console.log("응답 데이터:", response.data);
    
            onClose();
            alert("모의고사가 성공적으로 업로드되었습니다!");
    
            // 목록 즉시 갱신
            onUploadSuccess((prev) => [response.data, ...prev]);
        } catch (error) {
            console.error("업로드 중 오류:", error);
            alert("업로드 중 오류가 발생했습니다.");
        }
    };
    

    return (
        <>
            <div className="upload-exam-modal-overlay" onClick={onClose}></div>
            <div className="upload-exam-modal">
                <div className="upload-exam-modal-header">
                    <h2>모의고사 업로드</h2>
                    <button className="upload-exam-modal-close" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="upload-exam-modal-content">
                    <label className="upload-exam-modal-label">제목:</label>
                    <input
                        type="text"
                        className="upload-exam-modal-input"
                        placeholder="모의고사 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <label className="upload-exam-modal-label">설명:</label>
                    <input
                        className="upload-exam-modal-textarea"
                        placeholder="모의고사 설명을 입력하세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <label className="upload-exam-modal-label">자료 선택:</label>
                    <div className="upload-exam-modal-scroll">
                        <table className="upload-exam-material-table">
                            <thead>
                                <tr>
                                    <th>자료 이름</th>
                                    <th>객관식 문제 수</th>
                                    <th>주관식 문제 수</th>
                                    <th>상</th>
                                    <th>중</th>
                                    <th>하</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableMaterials.map((material) => (
                                    <tr
                                        key={material.EM_id}
                                        className={selectedMaterials.find((item) => item.EM_id === material.EM_id) ? "selected" : ""}
                                        onClick={() => handleMaterialSelect(material)}
                                    >
                                        <td>{material.title}</td>
                                        <td>{material.objectiveCount}</td>
                                        <td>{material.subjectiveCount}</td>
                                        <td>{material.high}</td>
                                        <td>{material.medium}</td>
                                        <td>{material.low}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <label className="upload-exam-modal-label">난이도:</label>
                    <div className="upload-exam-modal-difficulty">
                        <div>
                            <label>상:</label>
                            <input type="number" value={summary.high} readOnly />
                        </div>
                        <div>
                            <label>중:</label>
                            <input type="number" value={summary.medium} readOnly />
                        </div>
                        <div>
                            <label>하:</label>
                            <input type="number" value={summary.low} readOnly />
                        </div>
                    </div>
                    <div className="upload-exam-modal-input-group">
                        <div>
                            <label className="upload-exam-modal-label">객관식:</label>
                            <input type="number" value={summary.objective} readOnly />
                        </div>
                        <div>
                            <label className="upload-exam-modal-label">주관식:</label>
                            <input type="number" value={summary.subjective} readOnly />
                        </div>
                        <div>
                            <label className="upload-exam-modal-label">총 문제 수:</label>
                            <input type="number" value={summary.total} readOnly />
                        </div>
                    </div>
                    <button className="upload-exam-modal-button upload-exam-modal-submit" onClick={handleSubmit}>
                        업로드
                    </button>
                </div>
            </div>
        </>
    );
};

export default UploadExamModal;