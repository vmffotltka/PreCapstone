
import React, { useState } from 'react';
import { login } from '../api'; // API 호출 함수
import { Link } from 'react-router-dom';
import './Login.css'; 

const Login = ({ setToken }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(credentials);
            const { token, userId } = response.data;
    
            console.log("서버 응답 토큰:", token); // 토큰 확인
            console.log("userId:", userId); // 토큰 확인
            // 토큰과 userId를 로컬 스토리지에 저장
            localStorage.setItem('token', token); // 제대로 된 JWT인지 확인
            localStorage.setItem('userId', userId);
    
            setToken(token);
            alert("로그인에 성공했습니다!");
        } catch (error) {
            console.error("로그인 오류:", error.response ? error.response.data : error.message);
            alert("로그인에 실패했습니다.");
        }
    };
    

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="form-content">
                <h2>로그인</h2>
                <input name="email" type="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                <button type="submit">Login</button>
                <br /><br />
                <p>아직 계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
            </form>
        </div>
    );
};

export default Login;
