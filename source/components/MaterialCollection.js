import React, { useEffect, useState } from "react";
import "./MaterialCollection.css";
import { fetchMaterials, deleteMaterial } from "../api";
import QuestionModal from "./QuestionModal"; // QuestionModal import
import SolveModal from "./SolveModal"; // SolveModal import
import EditMaterialModal from "./EditMaterialModal";

const MaterialCollection = () => {
    const [materials, setMaterials] = useState([]); // 자료 목록 상태
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false); // 문제 생성 모달 상태
    const [selectedMaterial, setSelectedMaterial] = useState(null); // 선택된 자료
    const [isSolveModalOpen, setIsSolveModalOpen] = useState(false); // 문제 풀이 모달 상태
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const openEditModal = (material) => {
        setSelectedMaterial(material);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedMaterial(null);
        setIsEditModalOpen(false);
    };

    useEffect(() => {
        // 자료 목록 가져오기
        const loadMaterials = async () => {
            try {
                const data = await fetchMaterials(); // 서버에서 자료 목록 불러오기
                const materialsWithStatus = data.map((material) => ({
                    ...material,
                    hasQuestions: material.questionCount > 0, // 서버에서 questionCount 제공
                }));
                setMaterials(materialsWithStatus);
            } catch (error) {
                console.error("자료를 불러오는 중 오류가 발생했습니다:", error);
            }
        };

        loadMaterials();
    }, [materials]); // 빈 배열로 설정하여 컴포넌트가 처음 마운트될 때만 실행

    // 문제 만들기 버튼 클릭 처리
    const handleCreateQuestion = (material) => {
        setSelectedMaterial(material);
        setIsQuestionModalOpen(true); // 모달 열기
    };

    // 문제 풀기 버튼 클릭 처리
    const handleSolveQuestions = async (material) => {
        setSelectedMaterial(material);
        setIsSolveModalOpen(true); // 문제 풀기 모달 열기
    };

    return (
        <div className="material-collection">
            <h2>업로드된 자료 목록</h2>
            <hr></hr>
            {materials.length === 0 ? (
                <p>업로드된 자료가 없습니다.</p>
            ) : (
                <ul className="material-list">
                    {materials.map((material) => (
                        <li key={material.EM_id} className="material-item">
                            <div className="material-content">
                                <h4 className="material-title">{material.EM_title}</h4>
                                <p className="material-description">{material.EM_content}</p>
                            </div>
                            <div className="material-actions">
                                <button
                                    onClick={() => handleCreateQuestion(material)}
                                    className="small-button generate-button"
                                >
                                    문제 만들기
                                </button>
                                <button
                                    onClick={() => handleSolveQuestions(material)}
                                    className="small-button solve-button"
                                    disabled={!material.hasQuestions} // 문제가 없으면 비활성화
                                >
                                    문제 풀기
                                </button>
                                <button
                                    className="edit-button"
                                    onClick={() => openEditModal(material)}
                                >
                                    자료 정보 수정
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* QuestionModal 연결 */}
            {isQuestionModalOpen && (
                <QuestionModal
                    onClose={() => setIsQuestionModalOpen(false)} // 모달 닫기
                    material={selectedMaterial} // 선택된 자료 전달
                />
            )}
            {/* 문제 풀이 모달 */}
            {isSolveModalOpen && (
                <SolveModal
                    onClose={() => setIsSolveModalOpen(false)} // 모달 닫기
                    material={selectedMaterial} // 선택된 자료 전달
                />
            )}
            {/* 수정 모달 */}
            {isEditModalOpen && (
                <EditMaterialModal
                    material={selectedMaterial}
                    onClose={closeEditModal}
                    onUpdate={(updatedMaterial) => {
                        setMaterials((prevMaterials) =>
                            prevMaterials.map((m) =>
                                m.EM_id === updatedMaterial.EM_id ? updatedMaterial : m
                            )
                        );
                    }}
                    onDelete={(deletedId) => {
                        setMaterials((prevMaterials) =>
                            prevMaterials.filter((m) => m.EM_id !== deletedId)
                        );
                    }}
                />
            )}
        </div>
    );
};

export default MaterialCollection;
