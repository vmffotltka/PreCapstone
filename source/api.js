
import axios from 'axios';

const API_URL = 'http://3.38.194.124:5000';

export const signup = async (formData) => {
  try {
      
      const response = await axios.post(`${API_URL}/users/signup`, formData);
      return response.data;
  } catch (error) {
      console.error('Signup error:', error);  // 오류 메시지 출력
      throw error;
  }
};

export const fetchMaterials = async () => {
  const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
  if (!token) {
      throw new Error('사용자 토큰이 없습니다.');
  }

  const headers = {
      Authorization: `Bearer ${token}`, // Authorization 헤더 추가
  };

  const response = await axios.get(`${API_URL}/EduMaterials/`, { headers });
  return response.data; // 서버에서 받은 자료 데이터 반환
};

export const deleteMaterial = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) {
      throw new Error('사용자 토큰이 없습니다.');
  }

  const headers = {
      Authorization: `Bearer ${token}`,
  };

  try {
      const response = await axios.delete(`${API_URL}/EduMaterials/${id}`, { headers });
      console.log('삭제 요청 응답:', response.data); // 확인 로그
      return response.data;
  } catch (error) {
      console.error('삭제 요청 실패:', error);
      throw error;
  }
};

export const saveQuestions = async (data) => {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  try {
      const response = await axios.post(`${API_URL}/EduMaterials/questions/save`, data, { headers });
      return response.data;
  } catch (error) {
      console.error('문제 저장 중 오류:', error);
      throw error;
  }
};

export const fetchQuestions = async () => {
  const token = localStorage.getItem('token');
  // console.log('클라이언트 토큰:', token);
  const headers = { Authorization: `Bearer ${token}` };

  const response = await axios.get(`${API_URL}/EduMaterials/questions/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,

  });

  return response.data;
};

export const login = async (credentials) => axios.post(`${API_URL}/users/login`, credentials);
export const uploadMaterial = async (materialData) => axios.post(`${API_URL}/materials`, materialData);

export const submitAnswer = async (answerData) => axios.post(`${API_URL}/answers`, answerData);
