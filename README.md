# EduCraft | LLM 기반 교육 보조 플랫폼

> 사용자가 업로드한 문서를 기반으로 맞춤형 학습 문제를 자동 생성하는 플랫폼입니다.
> 한성대학교 프리캡스톤디자인 교내 공모전 **🏆 우수상** (2024.08 – 2024.11 / 4인 팀: BE 2, FE 2)

---

## 🛠 Tech Stack

`Node.js` `Express` `MySQL` `OpenAI API (GPT-4)` `React` `JWT` `AWS EC2`

---

## ⚙️ 핵심 구현

### 1. LLM 연동 문제 생성 파이프라인

사용자가 업로드한 문서(PDF, TXT 등)를 파싱·정규화한 뒤 GPT-4 API를 호출하여
객관식·주관식 문제와 해설을 자동 생성합니다.
```
파일 업로드 → 텍스트 추출 (fileExtractor)
           → 프롬프트 생성 (난이도·문제 수 포함)
           → GPT-4 API 호출
           → JSON 파싱 → DB 저장
```

### 2. 학습 이력 RDB 모델링

생성된 비정형 데이터(문제/정답/해설/난이도)를 MySQL에 구조화하여 적재하고,
사용자별 학습 이력(북마크, 모의고사 결과, 정답률)을 효율적으로 조회할 수 있는
관계형 스키마를 설계했습니다.

**핵심 테이블**

| 테이블 | 설명 |
|---|---|
| `User` | 사용자 정보 (JWT 인증) |
| `EduMaterial` | 업로드된 학습 자료 |
| `Questions` | 생성된 문제 (타입/난이도/북마크) |
| `MockExams` | 모의고사 (문제 묶음) |
| `MockExamResults` | 모의고사 응시 결과 |

### 3. E2E 비동기 통신

React 클라이언트의 문제 생성 요청부터 OpenAI API 연동,
응답 데이터 가공 후 클라이언트 반환까지 전체 비동기 흐름을 담당했습니다.

---

## 📁 구조
```
├── back-end/
│   ├── server.js                         # Express 서버, 인증/자료/모의고사 API
│   ├── routes/questions.js               # 문제 생성 라우터
│   ├── services/generateQuestionsFromFile.js  # GPT-4 연동 핵심 로직
│   └── utils/fileExtractor.js            # 파일 텍스트 추출
└── source/                               # React 프론트엔드
```

---

## 🚀 Quick Start
```bash
# 백엔드
cd back-end
npm install
node server.js

# 프론트엔드
cd source
npm install
npm start
```

> **환경변수 설정 필요** `.env` 파일에 `JWT_SECRET`, `OPENAI_API_KEY`, DB 접속 정보 입력
