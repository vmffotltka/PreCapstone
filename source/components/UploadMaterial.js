import React, { useState } from "react";
import "./UploadMaterial.css";
const API_URL = "http://3.38.194.124:5000";

const UploadMaterial = ({ onSuccess, onClose }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // 파일과 제목 입력 확인
        if (!title || !file) {
            alert("제목과 파일을 모두 입력해주세요.");
            return;
        }
    
        // 허용된 파일 확장자
        const allowedExtensions = ['pdf', 'txt', 'docx'];
    
        // 파일 확장자 확인
        const fileExtension = file.name.split('.').pop().toLowerCase(); // 확장자를 소문자로 변환
        if (!allowedExtensions.includes(fileExtension)) {
            alert("허용된 파일 형식이 아닙니다. pdf, txt, docx 파일만 업로드 가능합니다.");
            return;
        }
    
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);
        formData.append("content", content);
    
        try {
            const response = await fetch(`${API_URL}/EduMaterials/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });
    
            if (!response.ok) {
                throw new Error("자료 업로드에 실패했습니다.");
            }
    
            const result = await response.json();
            alert("자료 업로드가 성공적으로 완료되었습니다.");
            onSuccess(result); // 성공 시 부모 컴포넌트에 알림
            onClose(); // 모달 닫기
        } catch (error) {
            console.error("자료 업로드 오류:", error);
            alert("자료 업로드 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="upload-material-container">
            <h2></h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="title">학습 자료 제목</label>
                <input
                    id="title"
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <label htmlFor="file">문제로 만들 자료를 업로드해주세요 (pdf, txt, docx)</label>
                <input id="file" type="file" onChange={handleFileChange} />
                <label htmlFor="content">자료 내용 설명 (Optional)</label>
                <input
                    id="content"
                    type="text"
                    placeholder="내용을 입력하세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="button-group">
                    <button type="submit" className="upload-button">
                        자료 올리기
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadMaterial;
