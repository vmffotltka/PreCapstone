
import React, { useState } from 'react';
import { signup } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css'; 

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate(); // useNavigate 훅을 사용해 페이지 이동을 처리합니다.

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData); // 전달되는 formData 확인용 로그
        try {
            const response = await signup(formData);
            alert("회원가입이 완료되었습니다!");
            navigate('/'); // 회원가입 성공 시 로그인 페이지로 이동
        } catch (error) {
            alert("회원가입 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="form-content">
                <h2>회원가입</h2>
                <input name="username" type="text" placeholder="Username" onChange={handleChange} />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                <button type="submit">Sign Up</button>
                <br /><br />
                <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
            </form>
        </div>
    );
};

export default Signup;
