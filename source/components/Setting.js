import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Setting.css'; 

const API_URL = 'http://3.38.194.124:5000';

const Setting = ({ handleLogout }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        theme: 'light-theme',
        profileImage: null,
    });

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
    const [isAccountDeletionModalOpen, setIsAccountDeletionModalOpen] = useState(false);
    const [isAccountDeletionConfirmationModalOpen, setIsAccountDeletionConfirmationModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);  // 로그아웃 모달 상태
    
    useEffect(() => {
        /*
        const fetchProfileImage = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/users/profile-image/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFormData((prevData) => ({ ...prevData, profileImage: data.filePath }));
            } catch (error) {
                console.error('프로필 사진 로드 중 오류:', error);
            }
        };
    
        fetchProfileImage();
        */
        const currentTheme = document.body.className || 'light-theme';
        setFormData((prevData) => ({ ...prevData, theme: currentTheme }));

        // 현재 로그인한 사용자의 정보를 가져와서 설정
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('사용자 토큰이 없습니다.');
                }
                const headers = {
                    Authorization: `Bearer ${token}`,
                };
                const response = await axios.get(`${API_URL}/users/info`, { headers });
                // API에서 반환된 데이터 확인
                console.log("API 응답 데이터:", response.data);
                const { username, email, createdQuestions, createdMockExams, submittedExams, uploadedMaterials } = response.data;
    
                setFormData((prevData) => ({
                    ...prevData,
                    username,
                    email,
                    createdQuestions,
                    createdMockExams,
                    submittedExams,
                    uploadedMaterials,
                }));
            } catch (error) {
                console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', error);
            }
        };

        fetchUserData();
    }, []);

    

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profileImage', file);
    
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(`${API_URL}/users/upload-profile`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
    
                const filePath = response.data.filePath;
                setFormData((prevData) => ({ ...prevData, profileImage: filePath }));
                alert('프로필 사진이 성공적으로 변경되었습니다.');
            } catch (error) {
                console.error('프로필 사진 업로드 중 오류:', error);
                alert('프로필 사진 업로드 중 오류가 발생했습니다.');
            }
        }
    };
    
    /*
    const handleThemeChange = (e) => {
        const selectedTheme = e.target.value;
        setFormData({ ...formData, theme: selectedTheme });
        document.body.className = selectedTheme; // CSS 테마 클래스 적용
    };
    */

    const handlePasswordChangeClick = () => {
        setIsPasswordModalOpen(true);
        setIsCurrentPasswordValid(false);
    };

    const handlePasswordModalClose = () => {
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
    };

    const handlePasswordDataChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleLogoutModalOpen = () => {
        setIsLogoutModalOpen(true);
    };
    
    // 로그아웃 모달 닫기
    const handleLogoutModalClose = () => {
        setIsLogoutModalOpen(false);
    };

    const handleCurrentPasswordSubmit = async () => {
        try {
            // 현재 비밀번호 확인 로직 추가 필요 (API 호출)
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('사용자 토큰이 없습니다.');
            }
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            const response = await axios.post(`${API_URL}/users/verify-password`, { currentPassword: passwordData.currentPassword }, { headers });
            if (response.data.success) {
                setIsCurrentPasswordValid(true);
            } else {
                alert('현재 비밀번호가 맞지 않습니다.');
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                alert('현재 비밀번호가 맞지 않습니다.');
            } else {
                alert('비밀번호 확인 중 오류가 발생했습니다.');
            }
        }
    };

    const handleNewPasswordSubmit = async () => {
        try {
            // 새 비밀번호 변경 로직 추가 필요 (API 호출)
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('사용자 토큰이 없습니다.');
            }
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            await axios.put(`${API_URL}/users/update-password`, { newPassword: passwordData.newPassword }, { headers });
            alert('비밀번호가 성공적으로 변경되었습니다.');
            handlePasswordModalClose();
        } catch (error) {
            alert('비밀번호 변경 중 오류가 발생했습니다.');
        }
    };

    const handleAccountDeletionClick = () => {
        setIsAccountDeletionModalOpen(true);
    };

    const handleAccountDeletionModalClose = () => {
        setIsAccountDeletionModalOpen(false);
        setPasswordData({ currentPassword: '' });
    };

    const handleAccountDeletionSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('사용자 토큰이 없습니다.');
            }
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            const response = await axios.post(`${API_URL}/users/verify-password`, { currentPassword: passwordData.currentPassword }, { headers });
            if (response.data.success) {
                setIsAccountDeletionModalOpen(false);
                setIsAccountDeletionConfirmationModalOpen(true);
            } else {
                alert('현재 비밀번호가 맞지 않습니다. 계정 삭제를 진행할 수 없습니다.');
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                alert('현재 비밀번호가 맞지 않습니다. 계정 삭제를 진행할 수 없습니다.');
            } else {
                alert('계정 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    // 클라이언트 요청 시 계정 삭제 후 초기 화면으로 이동
    const handleAccountDeletionConfirmationSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('사용자 토큰이 없습니다.');
            }
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            await axios.delete(`${API_URL}/users/delete`, {
                headers,
                data: { password: passwordData.currentPassword },
            });
            
            alert('계정이 성공적으로 삭제되었습니다.');
            // 로그아웃 처리 및 초기 화면으로 이동
            localStorage.removeItem('token');
            window.location.href = '/';
        } catch (error) {
            alert('계정 삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="settings-container">
            <h2>프로필 및 설정</h2>
            <hr />
            <div className="settings-card">
                {/* 왼쪽: 프로필 이미지 */}
                <div className="profile-section">
                    <img
                        src={formData.profileImage || require('./default.png')}
                        alt="프로필"
                        className="profile-image"
                    />
                    <button 
                        onClick={() => document.getElementById('profileImage').click()} 
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007BFF', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer' }}
                    >
                        프로필 사진 변경
                    </button>
                    <input
                        type="file"
                        id="profileImage"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }} // 버튼을 클릭했을 때만 파일 선택 창이 열리게 하기 위해 input 필드는 숨김
                    />
                    <div style={{ marginTop: '10px' }}>
                    
                </div>

            </div>
    
                {/* 오른쪽: 사용자 이름과 이메일 */}
                <div className="info-section">
                    <div className="form-group-inline">
                        <label htmlFor="username" className="label-left">
                            사용자 이름:
                            <span style={{ marginLeft: '10px' }}>{formData.username}</span>
                        </label>
                    </div>
                    <div className="form-group-inline">
                        <label htmlFor="email" className="label-left">
                            사용자 이메일:
                            <span style={{ marginLeft: '10px' }}>{formData.email}</span>
                        </label>
                    </div>

                    <div className="form-group-inline">
                        <label htmlFor="createdQuestions" className="label-left">
                            만든 문제 수:
                            <span style={{ marginLeft: '10px' }}>{formData.createdQuestions || 0}</span>
                        </label>
                    </div>
                    <div className="form-group-inline">
                        <label htmlFor="createdMockExams" className="label-left">
                            만든 모의고사 수:
                            <span style={{ marginLeft: '10px' }}>{formData.createdMockExams || 0}</span>
                        </label>
                    </div>
                    <div className="form-group-inline">
                        <label htmlFor="submittedExams" className="label-left">
                            모의고사 제출 횟수:
                            <span style={{ marginLeft: '10px' }}>{formData.submittedExams || 0}</span>
                        </label>
                    </div>
                    <div className="form-group-inline">
                        <label htmlFor="uploadedMaterials" className="label-left">
                            올린 자료 개수:
                            <span style={{ marginLeft: '10px' }}>{formData.uploadedMaterials || 0}</span>
                        </label>
                    </div>
                </div>

            </div>
    
            {/* 설정 카드 바깥 UI */}
            <div className="out-setting" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* 테마 선택 부분 */}
                {/* <div className='theme-div' style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="theme" className="label-left" style={{ marginRight: '10px' }}>테마</label>
                    <select
                        name="theme"
                        className="readonly-field-right"
                        value={formData.theme}
                        onChange={handleThemeChange}
                    >
                        <option value="light-theme">기본</option>
                        <option value="dark-theme">어두운 테마</option>
                    </select>
                </div> */}

                {/* 버튼들: 비밀번호 변경, 로그아웃, 계정 탈퇴 */}
                <div className='button-container' style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="password-change-button" onClick={handlePasswordChangeClick} style={{ marginRight: '10px' }}>
                        비밀번호 변경
                    </button>
                    <button className="logout-button" onClick={handleLogoutModalOpen} style={{ marginRight: '10px' }}>
                        로그아웃
                    </button>
                    <button className="account-deletion-button" onClick={handleAccountDeletionClick}>
                        계정 탈퇴
                    </button>
                </div>
            </div>

    
            {/* 모달들 */}
            {isLogoutModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>정말로 로그아웃하시겠습니까?</h3>
                        <div className="modal-button-container">
                            <button onClick={handleLogout}>
                                로그아웃
                            </button>
                            <button onClick={handleLogoutModalClose}>
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        {!isCurrentPasswordValid ? (
                            <>
                                <h3>현재 비밀번호를 입력하세요.</h3>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="현재 비밀번호"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordDataChange}
                                    style={{ display: 'block', marginBottom: '10px' }}
                                />
                                <div className="modal-button-container">
                                    <button onClick={handleCurrentPasswordSubmit}>확인</button>
                                    <button onClick={handlePasswordModalClose} style={{ marginLeft: '10px' }}>취소</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3>새 비밀번호를 입력하세요.</h3>
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="새 비밀번호"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordDataChange}
                                    style={{ display: 'block', marginBottom: '10px' }}
                                />
                                <div className="modal-button-container">
                                    <button onClick={handleNewPasswordSubmit}>변경하기</button>
                                    <button onClick={handlePasswordModalClose} style={{ marginLeft: '10px' }}>취소</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isAccountDeletionModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>계정을 삭제하려면 현재 비밀번호를 입력하세요.</h3>
                        <input
                            type="password"
                            name="currentPassword"
                            placeholder="현재 비밀번호"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordDataChange}
                            style={{ display: 'block', marginBottom: '10px' }}
                        />
                        <div className="modal-button-container">
                            <button onClick={handleAccountDeletionSubmit}>확인</button>
                            <button onClick={handleAccountDeletionModalClose} style={{ marginLeft: '10px' }}>취소</button>
                        </div>
                    </div>
                </div>
            )}

            {isAccountDeletionConfirmationModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>계정을 삭제 하시겠습니까? 모든 정보가 삭제되며 복구가 불가능합니다.</h3>
                        <div className="modal-button-container">
                            <button onClick={handleAccountDeletionConfirmationSubmit}>계정 삭제</button>
                            <button onClick={() => setIsAccountDeletionConfirmationModalOpen(false)} style={{ marginLeft: '10px' }}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Setting;
