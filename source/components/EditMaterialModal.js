import React, { useState } from 'react';
import axios from 'axios';
import "./EditMaterialModal.css";
import { deleteMaterial } from "../api";

const API_URL = 'http://3.38.194.124:5000'; // 서버 주소

const EditMaterialModal = ({ material, onClose, onUpdate, onDelete }) => {
    const [title, setTitle] = useState(material.EM_title);
    const [content, setContent] = useState(material.EM_content);

    const handleSave = async () => {
        try {
            const response = await axios.patch(`${API_URL}/EduMaterials/${material.EM_id}`, {
                title,
                content,
            });
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error("자료 수정 오류:", error);
            alert("자료를 수정하는 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            '이 자료를 삭제하면 관련된 모든 문제가 삭제됩니다. 계속하시겠습니까?'
        );

        if (!confirmDelete) return; // 사용자가 취소하면 중단
        try {
            await deleteMaterial(material.EM_id);
            onDelete(material.EM_id); // 부모 컴포넌트에서 상태 업데이트
            onClose();
            alert("자료가 성공적으로 삭제되었습니다.");
        } catch (error) {
            console.error("자료 삭제 중 오류:", error);
            alert("자료 삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal">
                <div className="modal-header">
                    <h2>자료 수정</h2>
                    <button className="close-edit-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <label>
                    제목 수정:
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </label>
                <label>
                    내용 수정:
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </label>
                <div className="button-container">
                    <button onClick={handleSave} className="save-button">수정하기</button>
                    <button onClick={handleDelete} className="delete-button">자료 삭제</button>
                </div>
            </div>
        </>
    );
    
};

export default EditMaterialModal;