import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import UploadMaterial from './components/UploadMaterial';
import MaterialCollection from './components/MaterialCollection';
import Setting from './components/Setting';
import Tabs from './components/Tabs';
import Modal from './components/Modal';
import QuestionModal from './components/QuestionModal';
import BookmarkTab from './components/BookmarkTab';
import MockExamTab from "./components/MockExamTab";
import './App.css';
import axios from "axios";

const API_URL = 'http://3.38.194.124:5000';

const App = () => {
    const [token, setToken] = useState(null);
    const [materials, setMaterials] = useState([]); // 자료 목록
    const [questions, setQuestions] = useState([]); // 문제 목록
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    // 모드 상태 추가 (기본 모드와 어두운 모드)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // 문제 목록 가져오기
    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${API_URL}/EduMaterials/questions/user`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setQuestions(response.data);
        } catch (error) {
            console.error("문제 목록 가져오기 오류:", error);
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
        }
        fetchQuestions(); // 초기 로딩 시 문제 목록 가져오기

        // 테마 변경 시 HTML에 해당 클래스 추가
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, [theme]);

    // 테마 토글 메서드
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme); // 테마 상태를 로컬 스토리지에 저장
    };

    const openUploadModal = () => setIsUploadModalOpen(true);
    const closeUploadModal = () => setIsUploadModalOpen(false);

    const addMaterial = (newMaterial) => {
        setMaterials((prevMaterials) => [...prevMaterials, newMaterial]);
        closeUploadModal();
    };

    const addQuestion = (newQuestion) => {
        setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
        setIsQuestionModalOpen(false);
    };

    const handleOpenQuestionModal = (material) => {
        setSelectedMaterial(material);
        setIsQuestionModalOpen(true);
    };

    const handleCloseQuestionModal = () => {
        setSelectedMaterial(null);
        setIsQuestionModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    const tabs = [
        {
            label: "자료 모음",
            content: (
                <div>
                    
                    {isUploadModalOpen && (
                        <Modal isOpen={isUploadModalOpen} onClose={closeUploadModal}>
                            <UploadMaterial
                                onSuccess={addMaterial}
                                onClose={closeUploadModal}
                            />
                        </Modal>
                    )}
                    <MaterialCollection
                        materials={materials}
                        onDelete={(id) =>
                            setMaterials((prevMaterials) =>
                                prevMaterials.filter((material) => material.EM_id !== id)
                            )
                        }
                        onCreateQuestion={(material, event) => handleOpenQuestionModal(material, event)}
                    />
                    <div className="upload-container">
                        <button onClick={openUploadModal} className="open-modal-button">
                            자료 업로드
                        </button>
                    </div>
                    {isQuestionModalOpen && (
                        <Modal isOpen={handleOpenQuestionModal} onClose={handleCloseQuestionModal}>
                            <QuestionModal
                                material={selectedMaterial}
                                onSuccess={addQuestion}
                            />
                        </Modal>
                    )}
                </div>
            ),
        },
        { label: "북마크", content: <BookmarkTab /> },
        { label: "모의고사", content: <MockExamTab /> },
        { label: "프로필 및 설정", content: <Setting handleLogout={handleLogout} toggleTheme={toggleTheme} /> },
    ];

    return (
        <Router>
            <div className='app'>
                <h1 className="title">EduCraft</h1>
                {token ? (
                    <Tabs tabs={tabs} />
                ) : (
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <Login
                                    setToken={(token) => {
                                        localStorage.setItem('token', token);
                                        setToken(token);
                                    }}
                                />
                            }
                        />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/"
                            element={
                                <Login
                                    setToken={(token) => {
                                        localStorage.setItem('token', token);
                                        setToken(token);
                                    }}
                                />
                            }
                        />
                    </Routes>
                )}
                {isQuestionModalOpen && (
                    <Modal isOpen={isQuestionModalOpen} onClose={handleCloseQuestionModal}>
                        <QuestionModal material={selectedMaterial} onClose={handleCloseQuestionModal} />
                    </Modal>
                )}
            </div>
        </Router>
    );
};

export default App;
