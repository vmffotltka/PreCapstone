
# EduCraft Backend

Node.js + Express 기반의 RESTful API 서버입니다.

---

## 📁 파일 구조

```
back-end/
├── server.js                              # Express 메인 서버
├── routes/
│   └── questions.js                       # GPT-4 연동 문제 생성 라우터
├── services/
│   └── generateQuestionsFromFile.js        # LLM 프롬프트 생성 및 API 호출 핵심 로직
├── utils/
│   └── fileExtractor.js                   # PDF/TXT 파일 텍스트 파싱
└── Dump20241206.sql                       # MySQL 데이터베이스 초기화 스크립트
```

---

## 🔧 핵심 기능

### 1. 인증 & 계정 관리
- **회원가입** (`POST /users/signup`)
  - 사용자명, 이메일, 비밀번호 중복검사 및 저장
  - bcrypt 비밀번호 해싱
  
- **로그인** (`POST /users/login`)
  - 이메일 + 비밀번호 검증
  - JWT 토큰 발급 (12시간 유효)
  
- **사용자 정보 조회** (`GET /users/info`)
  - 프로필 정보 및 통계 (생성한 문제수, 모의고사수, 학습기록 등)
  
- **비밀번호 변경** (`PUT /users/update-password`)
  - 현재 비밀번호 검증 후 변경
  
- **회원탈퇴** (`DELETE /users/delete`)

---

### 2. 학습 자료 관리 (EduMaterial)

| Endpoint | 메서드 | 설명 |
|----------|--------|------|
| `/EduMaterials/upload` | POST | PDF/TXT 파일 업로드 및 DB 저장 |
| `/EduMaterials` | GET | 사용자의 모든 학습 자료 조회 |
| `/EduMaterials/:id` | PATCH | 자료 제목/설명 수정 |
| `/EduMaterials/:id` | DELETE | 자료 삭제 |

---

### 3. 문제 생성 & 관리 (Questions)

#### 🤖 LLM 연동 문제 생성
- **엔드포인트**: `POST /EduMaterials/questions` (routes/questions.js)
- **프로세스**:
  1. 파일 경로 + 난이도 + 문제 수 요청
  2. `generateQuestionsFromFile()` 호출
  3. GPT-4 API로 객관식/주관식 문제 생성
  4. JSON 형식 응답

#### 문제 관리 API

| Endpoint | 메서드 | 설명 |
|----------|--------|------|
| `/EduMaterials/questions/save` | POST | 생성된 문제를 DB에 저장 |
| `/EduMaterials/questions/user` | GET | 사용자가 생성한 모든 문제 조회 |
| `/EduMaterials/questions/:id` | DELETE | 문제 삭제 |
| `/EduMaterials/questions/:id/bookmark` | PATCH | 북마크 상태 토글 |
| `/EduMaterials/questions/bookmarks` | GET | 북마크된 문제만 조회 |

---

### 4. 모의고사 (MockExams)

| Endpoint | 메서드 | 설명 |
|----------|--------|------|
| `/EduMaterials/mockExams/upload` | POST | 모의고사 생성 (선택된 문제 묶음) |
| `/EduMaterials/mockExams` | GET | 사용자의 모든 모의고사 조회 |
| `/EduMaterials/mockExams/:id` | PUT | 모의고사 제목/설명 수정 |
| `/EduMaterials/mockExams/:id` | DELETE | 모의고사 삭제 |
| `/EduMaterials/mockExams/:id/questions` | GET | 모의고사에 포함된 문제 조회 |
| `/EduMaterials/mockExams/:id/submit` | POST | 답안 제출 및 채점 결과 저장 |
| `/EduMaterials/mockExams/:id/results` | GET | 모의고사 응시 기록 조회 |

---

## 🗄️ 데이터베이스 설계

### 핵심 테이블

#### User 테이블
```sql
CREATE TABLE User (
  User_id INT AUTO_INCREMENT PRIMARY KEY,
  User_name VARCHAR(50) UNIQUE NOT NULL,
  User_password VARCHAR(255) NOT NULL,
  User_email VARCHAR(100) UNIQUE NOT NULL,
  User_profile_image VARCHAR(255) NULL
);
```

#### EduMaterial 테이블 (학습 자료)
```sql
CREATE TABLE EduMaterial (
  EM_id INT AUTO_INCREMENT PRIMARY KEY,
  User_id INT NOT NULL,
  EM_title VARCHAR(255) NOT NULL,
  EM_content TEXT,
  EM_path VARCHAR(255) NOT NULL,
  EM_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (User_id) REFERENCES User(User_id)
);
```

#### Questions 테이블 (생성된 문제)
```sql
CREATE TABLE Questions (
  Q_id INT AUTO_INCREMENT PRIMARY KEY,
  User_id INT NOT NULL,
  EM_id INT NULL,
  Q_type VARCHAR(20) NOT NULL,           -- '객관식' 또는 '주관식'
  Q_content TEXT NOT NULL,
  Q_options JSON NULL,                   -- 객관식 선택지 (JSON 배열)
  Q_answer VARCHAR(255) NOT NULL,        -- 정답
  Q_explanation TEXT,                    -- 해설
  Q_difficulty VARCHAR(20),              -- 'low', 'normal', 'high'
  Q_bookmark BOOLEAN DEFAULT FALSE,      -- 북마크 여부
  Q_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (User_id) REFERENCES User(User_id),
  FOREIGN KEY (EM_id) REFERENCES EduMaterial(EM_id)
);
```

#### MockExams 테이블 (모의고사)
```sql
CREATE TABLE MockExams (
  ME_id INT AUTO_INCREMENT PRIMARY KEY,
  User_id INT NOT NULL,
  ME_title VARCHAR(255) NOT NULL,
  ME_description TEXT,
  ME_content JSON NOT NULL,              -- 포함된 자료 ID 목록 (JSON)
  ME_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (User_id) REFERENCES User(User_id)
);
```

#### MockExamResults 테이블 (응시 기록)
```sql
CREATE TABLE MockExamResults (
  Result_id INT AUTO_INCREMENT PRIMARY KEY,
  ME_id INT NOT NULL,
  User_id INT NOT NULL,
  TotalQuestions INT NOT NULL,
  CorrectAnswers INT NOT NULL,
  ObjectiveCorrect INT,                  -- 객관식 정답 수
  SubjectiveCorrect INT,                 -- 주관식 정답 수
  HighCorrect INT,                       -- 난이도 높음 정답 수
  MediumCorrect INT,                     -- 난이도 중간 정답 수
  LowCorrect INT,                        -- 난이도 낮음 정답 수
  ElapsedTime INT,                       -- 소요 시간 (초 단위)
  Result_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ME_id) REFERENCES MockExams(ME_id),
  FOREIGN KEY (User_id) REFERENCES User(User_id)
);
```

#### MockExamAnswers 테이블 (답안 상세 기록)
```sql
CREATE TABLE MockExamAnswers (
  Answer_id INT AUTO_INCREMENT PRIMARY KEY,
  Result_id INT NOT NULL,
  Question_id INT NOT NULL,
  SubmittedAnswer VARCHAR(255),          -- 사용자 답
  IsCorrect BOOLEAN,                     -- 정오 여부
  Feedback TEXT,                         -- 개별 피드백
  FOREIGN KEY (Result_id) REFERENCES MockExamResults(Result_id),
  FOREIGN KEY (Question_id) REFERENCES Questions(Q_id)
);
```

---

## 🔐 보안

- **JWT 기반 인증**: 모든 보호된 엔드포인트에서 Bearer 토큰 검증
- **비밀번호 암호화**: bcrypt를 이용한 단방향 해싱
- **CORS 설정**: 프론트엔드 도메인 허용
- **입력 검증**: 필수 필드 검사 및 SQL Injection 방지

---

## 🚀 환경변수 (.env)

```
JWT_SECRET=your_secret_key_here
OPENAI_API_KEY=your_openai_api_key
DB_HOST=3.38.194.124
DB_USER=root
DB_PASSWORD=password
DB_NAME=EduCraft
DB_PORT=3306
```

---

## 📊 주요 미들웨어

- **CORS**: 교차 출처 요청 허용
- **Body Parser**: JSON 파싱
- **authenticateUser**: JWT 토큰 검증 (보호된 라우트)
- **Multer**: 파일 업로드 처리 (사용자별 디렉토리 구성)

---

## 🔗 파일 구조 상세

### generateQuestionsFromFile.js
- **역할**: GPT-4 API 핵심 연동
- **입력**: 파일 경로, 객관식 수, 주관식 수, 난이도
- **출력**: 구조화된 문제 객체 배열
- **특징**: 프롬프트 엔지니어링으로 일관된 JSON 형식 응답 보장

### fileExtractor.js
- **역할**: PDF/TXT 파일 파싱
- **지원 포맷**: .pdf, .txt
- **출력**: 추출된 텍스트 문자열

---
