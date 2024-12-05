require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// CORS 설정
app.use(cors());
app.options('*', cors()); // 모든 경로에 대해 OPTIONS 메서드 허용

// JSON 및 Body Parser 설정
app.use(express.json());
app.use(bodyParser.json());

const questionRoutes = require('./routes/questions');
app.use('/EduMaterials', questionRoutes);

// MySQL 데이터베이스 연결
const db = mysql.createConnection({
    host: '3.38.194.124', // 서버 컴퓨터 IP
    user: 'root', // MySQL 사용자 이름
    password: '000000', // MySQL 비밀번호
    database: 'EduCraft', // 사용할 데이터베이스 이름
    port: 3306,
});

// 데이터베이스 연결 확인
db.connect(err => {
    if (err) {
        console.error('DB 연결 오류: ', err);
        return;
    }
    console.log('DB에 연결되었습니다.');
});

// 사용자 정보 조회 API
app.get('/users/info', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const secretKey = process.env.JWT_SECRET;

    if (!token) {
        return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        const userId = decoded.id;

        // 1. 사용자 기본 정보 쿼리
        const userInfoQuery = 'SELECT User_id, User_name, User_email FROM User WHERE User_id = ?';

        // 2. 사용자 통계 정보 쿼리
        const statsQueries = {
            createdQuestions: 'SELECT COUNT(*) as count FROM Questions WHERE User_id = ?',
            createdMockExams: 'SELECT COUNT(*) as count FROM MockExams WHERE User_id = ?',
            submittedExams: 'SELECT COUNT(*) as count FROM MockExamResults WHERE User_id = ?',
            uploadedMaterials: 'SELECT COUNT(*) as count FROM EduMaterial WHERE User_id = ?',
        };

        db.query(userInfoQuery, [userId], (err, userResults) => {
            if (err) {
                return res.status(500).json({ error: 'DB 조회 중 오류가 발생했습니다.' });
            }

            if (userResults.length === 0) {
                return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            }

            const user = userResults[0];
            const statsPromises = Object.keys(statsQueries).map((key) =>
                new Promise((resolve, reject) => {
                    db.query(statsQueries[key], [userId], (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ [key]: results[0].count });
                        }
                    });
                })
            );

            // 모든 통계 쿼리를 병렬 실행
            Promise.all(statsPromises)
                .then((stats) => {
                    const statsData = stats.reduce((acc, stat) => ({ ...acc, ...stat }), {});
                    res.json({
                        username: user.User_name,
                        email: user.User_email,
                        ...statsData, // 통계 데이터 병합
                    });
                })
                .catch((err) => {
                    console.error('통계 데이터 조회 중 오류:', err);
                    res.status(500).json({ error: '통계 데이터 조회 중 오류가 발생했습니다.' });
                });
        });
    } catch (error) {
        return res.status(401).json({ error: '잘못된 토큰입니다.' });
    }
});

app.post('/users/signup', (req, res) => {
    // console.log(req.body); // 요청 데이터 출력
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            status: 'error',
            error: '잘못된 요청입니다.',
            message: '필수 필드가 누락되었습니다.',
        });
    }

    // 유저 아이디 중복 체크
    db.query('SELECT * FROM User WHERE User_name = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: '유저 이름이 중복되었습니다.',
            });
        }

        // 비밀번호 해싱
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: '비밀번호 해싱 실패' });
            }

            // 새로운 사용자 추가
            db.query(
                'INSERT INTO User (User_name, User_password, User_email) VALUES (?, ?, ?)',
                [username, hashedPassword, email],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ message: 'User registered successfully' });
                }
            );
        });
    });
});

// 비밀번호 확인 API
app.post('/users/verify-password', (req, res) => {
    const { currentPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 시크릿 키는 실제로 환경 변수로 설정하세요.
        const userId = decoded.id;

        db.query('SELECT User_password FROM User WHERE User_id = ?', [userId], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'DB 조회 중 오류가 발생했습니다.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            }

            try {
                const isMatch = await bcrypt.compare(currentPassword, results[0].User_password);
                if (!isMatch) {
                    return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
                }

                res.json({ success: true });
            } catch (compareError) {
                return res.status(500).json({ error: '비밀번호 비교 중 오류가 발생했습니다.' });
            }
        });
    } catch (error) {
        return res.status(401).json({ error: '잘못된 토큰입니다.' });
    }
});

// 비밀번호 변경 API
app.put('/users/update-password', (req, res) => {
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 시크릿 키는 실제로 환경 변수로 설정하세요.
        const userId = decoded.id;

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: '비밀번호 해싱 실패' });
            }

            db.query('UPDATE User SET User_password = ? WHERE User_id = ?', [hashedPassword, userId], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: '비밀번호 업데이트 중 오류가 발생했습니다.' });
                }

                res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
            });
        });
    } catch (error) {
        return res.status(401).json({ error: '잘못된 토큰입니다.' });
    }
});

// 로그인 요청
app.post('/users/login', (req, res) => {
    const { email, password } = req.body;

    // 데이터베이스에서 사용자를 찾기
    db.query('SELECT * FROM User WHERE User_email = ?', [email], (err, results) => {
        if (err) {
            console.error('쿼리 오류:', err);
            return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
        }

        // 사용자 정보 가져오기
        const user = results[0];

        // 비밀번호 비교
        bcrypt.compare(password, user.User_password, (err, isMatch) => {
            if (err) {
                console.error('비밀번호 비교 오류:', err);
                return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
            }

            if (!isMatch) {
                return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호입니다.' });
            }

            // JWT 토큰 생성
            const token = jwt.sign({ id: user.User_id }, process.env.JWT_SECRET, { expiresIn: '12h' });
	    console.log('생성된 JWT 토큰:', token); // 토큰 로그 출력
            res.json({ token, userId: user.User_id });
        });
    });
});

// 회원탈퇴요청
app.delete('/users/delete', (req, res) => {
    // console.log("요청된 비밀번호:", req.body.password);
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 시크릿 키는 실제로 환경 변수로 설정하세요.
        const userId = decoded.id;

        db.query('SELECT User_password FROM User WHERE User_id = ?', [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'DB 조회 중 오류가 발생했습니다.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            }

            if (!req.body.password) {
                return res.status(400).json({ error: '비밀번호가 필요합니다.' });
            }

            bcrypt.compare(req.body.password, results[0].User_password, (err, isMatch) => {
                console.log("비밀번호 비교 결과:", isMatch);
                if (err) {
                    return res.status(500).json({ error: '비밀번호 확인 중 오류가 발생했습니다.' });
                }

                if (!isMatch) {
                    return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
                }

                const query = 'DELETE FROM User WHERE User_id = ?';
                db.query(query, [userId], (err, result) => {
                    if (err) {
                        console.error('DB 오류: ', err);
                        return res.status(500).json({ status: 'error', message: '서버 오류입니다.' });
                    }

                    res.status(200).json({ message: '회원정보가 삭제되었습니다.' });
                });
            });
        });
    } catch (error) {
        return res.status(401).json({ error: '잘못된 토큰입니다.' });
    }
});

const getUserDirectory = async (userId) => {
    if (!userId) {
        throw new Error('Invalid user ID');
    }

    const userDir = path.join(__dirname, 'uploads', `user_${userId}`);
    if (!fs.existsSync(userDir)) {
        await fs.promises.mkdir(userDir, { recursive: true });
    }
    return userDir;
};

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const userId = req.userId; // 인증된 사용자 ID
            const userDir = await getUserDirectory(userId);
            cb(null, userDir);
        } catch (error) {
            console.error('Error setting destination:', error);
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        // 고유한 파일 이름 생성: 타임스탬프 + UUID
        const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


// 인증 미들웨어
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization; // 헤더에서 Authorization 가져오기
    // console.log('Authorization 헤더:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('인증 실패: Authorization 헤더가 없음 또는 형식이 잘못됨');
        return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1]; // Bearer 다음의 토큰 부분만 가져오기
    // console.log('Extracted Token:', token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // 토큰 검증
        // console.log('Decoded JWT Payload:', decoded);
        req.userId = decoded.id; // JWT의 payload에서 사용자 ID 추출
        next(); // 다음 미들웨어로 진행
    } catch (error) {
        // console.error('JWT 인증 오류:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// 프로필 사진 업로드
app.post('/users/upload-profile', authenticateUser, upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.userId;
        const filePath = path.join('uploads', `user_${userId}`, req.file.filename);

        // DB에 파일 경로 업데이트
        await db.promise().query(
            'UPDATE User SET User_profile_image = ? WHERE User_id = ?',
            [filePath, userId]
        );

        res.status(200).json({ message: '프로필 사진이 성공적으로 업데이트되었습니다.', filePath });
    } catch (error) {
        console.error('프로필 사진 업로드 중 오류:', error);
        res.status(500).json({ message: '프로필 사진 업로드 중 오류가 발생했습니다.' });
    }
});

// 프로필 사진 가져오기
app.get('/users/profile-image/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [rows] = await db.promise().query('SELECT User_profile_image FROM User WHERE User_id = ?', [userId]);
        if (rows.length === 0 || !rows[0].profile_image) {
            return res.status(404).json({ message: '프로필 이미지를 찾을 수 없습니다.' });
        }

        const imagePath = path.join(__dirname, rows[0].profile_image);
        res.sendFile(imagePath);
    } catch (error) {
        console.error('프로필 사진 가져오기 중 오류:', error);
        res.status(500).json({ message: '프로필 사진 가져오는 중 오류가 발생했습니다.' });
    }
});


// 업로드 라우트
app.post('/EduMaterials/upload', authenticateUser, upload.single('file'), (req, res) => {
    const userId = req.userId; // 인증된 사용자 ID
    const { title, content } = req.body;

    // 업로드된 파일의 고유 경로
    const filePath = `/uploads/user_${userId}/${req.file.filename}`;

    if (!title || !req.file) {
        return res.status(400).json({ error: "Title and file are required." });
    }

    // DB에 저장
    const query =
        "INSERT INTO EduMaterial (User_id, EM_title, EM_content, EM_path) VALUES (?, ?, ?, ?)";
    db.query(query, [userId, title, content, filePath], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "DB 저장 중 오류가 발생했습니다." });
        }
        res.status(201).json({ message: "파일이 업로드되었습니다.", filePath });
    });
});


// 전체 자료 조회
app.get('/EduMaterials', authenticateUser, (req, res) => {
    const userId = req.userId; // 인증된 사용자 ID
    // console.log('자료 목록 요청 사용자 ID:', userId);

    const query = 'SELECT *, (SELECT COUNT(*) FROM Questions WHERE EM_id = EduMaterial.EM_id) AS questionCount FROM EduMaterial WHERE User_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('DB 조회 중 오류:', err);
            return res.status(500).json({ error: 'DB 조회 중 오류가 발생했습니다.' });
        }

        // console.log('자료 목록 조회 결과:', results);
        res.json(results);
    });
});

// 문제 저장 API
app.post('/EduMaterials/questions/save', async (req, res) => {
    const { userId, emId, questions } = req.body;
    console.log("받은 요청 데이터:", { userId, emId, questions });

    if (!userId || !questions || questions.length === 0) {
        return res.status(400).json({ error: '유효하지 않은 요청 데이터입니다.' });
    }

    try {
        // 1. 자료 제목(Material_Title) 가져오기
        const [materialRows] = await db.promise().query(
            `SELECT EM_title FROM EduMaterial WHERE EM_id = ?`,
            [emId]
        );

        if (materialRows.length === 0) {
            return res.status(404).json({ error: '해당 자료를 찾을 수 없습니다.' });
        }

        const materialTitle = materialRows[0].EM_title;

        // 2. 현재 자료와 연결된 기존 문제 개수 가져오기
        const [questionCountRows] = await db.promise().query(
            `SELECT COUNT(*) AS count FROM Questions WHERE EM_id = ?`,
            [emId]
        );

        let questionCount = questionCountRows[0].count;

        // 3. 각 문제 저장 준비
        const values = questions.map((q) => {
            questionCount += 1; // 새로운 문제 번호 생성
            return [
                userId,
                emId || null,
                q.type,
                q.content,
                JSON.stringify(q.options) || null,
                q.answer,
                q.comment || "해설이 제공되지 않았습니다.", // 기본값 설정
                q.difficulty || "normal", // 난이도 추가, 기본값은 'normal'
                questionCount, // 문제 번호
                materialTitle, // 자료 제목
            ];
        });

        const sql = `
            INSERT INTO Questions (User_id, EM_id, Q_type, Q_content, Q_options, Q_answer, Q_explanation, Q_difficulty, Question_Number, Material_Title)
            VALUES ?
        `;

        // 4. DB에 문제 삽입
        await db.promise().query(sql, [values]);

        res.status(201).json({ message: '문제가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('문제 저장 중 오류:', error);
        res.status(500).json({ error: '문제 저장 중 오류가 발생했습니다.' });
    }
});

// 사용자가 생성한 문제 가져오기
app.get('/EduMaterials/questions/user', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId; // 미들웨어에서 인증된 사용자 ID
        console.log('인증된 사용자 ID:', userId);
        if (!userId) {
            return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
        }

	// 최근 생성된 문제가 맨 위로 오도록 정렬
        const query = 'SELECT * FROM Questions WHERE User_id = ? ORDER BY Q_created DESC';
        const [rows] = await db.promise().execute(query, [userId]); // 비구조화 할당 확인
        console.log('조회된 문제 데이터:', rows);

        if (rows.length === 0) {
            return res.status(200).json([]); // 빈 배열 반환
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error('문제를 가져오는 중 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// 자료 삭제
app.delete('/EduMaterials/:id', authenticateUser, (req, res) => {
    const materialId = req.params.id;
    const userId = req.userId;

    console.log('삭제 요청:', { id: materialId, userId });

    const query = 'SELECT * FROM EduMaterial WHERE EM_id = ? AND User_id = ?';
    db.query(query, [materialId, userId], (err, results) => {
        if (err) {
            console.error('DB 조회 오류:', err);
            return res.status(500).json({ error: 'DB 조회 중 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            console.log('삭제 요청 실패: 자료를 찾을 수 없습니다.');
            return res.status(404).json({ error: '자료를 찾을 수 없습니다.' });
        }

        const filePath = path.join(__dirname, results[0].EM_path);
        console.log('파일 경로:', filePath);

        // 파일 삭제
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('파일 삭제 오류:', unlinkErr);
                return res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
            }

            // DB 삭제
            const deleteQuery = 'DELETE FROM EduMaterial WHERE EM_id = ?';
            db.query(deleteQuery, [materialId], (deleteErr) => {
                if (deleteErr) {
                    console.error('DB 삭제 오류:', deleteErr);
                    return res.status(500).json({ error: 'DB 삭제 중 오류가 발생했습니다.' });
                }

                console.log('자료 삭제 성공:', materialId);
                res.status(200).json({ message: '자료가 성공적으로 삭제되었습니다.' });
            });
        });
    });
});


// 문제 삭제
app.delete('/EduMaterials/questions/:id', authenticateUser, async (req, res) => {
    const questionId = req.params.id;

    try {
        const query = 'DELETE FROM Questions WHERE Q_id = ?';
        const [results] = await db.promise().execute(query, [questionId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '문제가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('문제 삭제 중 오류:', error);
        res.status(500).json({ message: '문제 삭제 중 오류가 발생했습니다.' });
    }
});

// 북마크 상태 업데이트 API
app.patch('/EduMaterials/questions/:id/bookmark', authenticateUser, async (req, res) => {
    const questionId = req.params.id; // URL에서 Q_id 가져오기
    const { bookmark } = req.body; // 요청 본문에서 북마크 상태 가져오기
    const userId = req.userId; // 인증된 사용자 ID 가져오기

    if (bookmark === undefined) {
        return res.status(400).json({ error: '유효하지 않은 요청 데이터입니다. bookmark 값을 제공해야 합니다.' });
    }

    try {
        // 사용자가 소유한 문제인지 확인
        const [rows] = await db.promise().query('SELECT * FROM Questions WHERE Q_id = ? AND User_id = ?', [questionId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: '문제를 찾을 수 없거나 접근 권한이 없습니다.' });
        }

        // 북마크 상태 업데이트
        await db.promise().query('UPDATE Questions SET Q_bookmark = ? WHERE Q_id = ?', [bookmark, questionId]);

        res.status(200).json({ message: '북마크 상태가 성공적으로 업데이트되었습니다.', bookmark });
    } catch (error) {
        console.error('북마크 상태 업데이트 중 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 북마크 문제 불러오기
app.get('/EduMaterials/questions/bookmarks', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId; // 인증된 사용자 ID
        const query = `
            SELECT * 
            FROM Questions 
            WHERE User_id = ? AND Q_bookmark = 1 
            ORDER BY Q_created DESC
        `;
        const [rows] = await db.promise().execute(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('북마크된 문제를 가져오는 중 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 문제 자료 수정
app.patch('/EduMaterials/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    try {
        const query = 'UPDATE EduMaterial SET EM_title = ?, EM_content = ? WHERE EM_id = ?';
        await db.promise().execute(query, [title, content, id]);
        const [updatedMaterial] = await db.promise().query('SELECT * FROM EduMaterial WHERE EM_id = ?', [id]);
        res.status(200).json(updatedMaterial[0]);
    } catch (error) {
        console.error('자료 수정 오류:', error);
        res.status(500).json({ message: '자료 수정 중 오류가 발생했습니다.' });
    }
});

// 모의고사 업로드 API
app.post('/EduMaterials/mockExams/upload', authenticateUser, async (req, res) => {
    try {
        const { title, description, content } = req.body;
        const userId = req.userId;

        if (!title || !description) {
            return res.status(400).json({ message: "제목과 설명은 필수입니다." });
        }

        // content를 JSON으로 파싱 후 섞기
        const parsedContent = JSON.parse(content);
        const shuffledContent = parsedContent.sort(() => Math.random() - 0.5);

        const query = `
            INSERT INTO MockExams (ME_title, ME_description, ME_content, User_id) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.promise().query(query, [title, description, JSON.stringify(shuffledContent), userId]);

        res.status(201).json({
            ME_id: result.insertId,
            title,
            description,
            content: shuffledContent, // 섞인 content를 반환
        });
    } catch (error) {
        console.error("모의고사 업로드 오류:", error);
        res.status(500).json({ message: "모의고사를 업로드하는 중 오류가 발생했습니다." });
    }
});

// 모의고사 불러오기 API
app.get('/EduMaterials/mockExams', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const query = `
            SELECT ME_id, ME_title, ME_description, ME_content 
            FROM MockExams 
            WHERE User_id = ? 
            ORDER BY ME_created DESC
        `;
        const [rows] = await db.promise().query(query, [userId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("모의고사 불러오기 오류:", error);
        res.status(500).json({ message: "모의고사를 불러오는 중 오류가 발생했습니다." });
    }
});

// 자료와 문제 데이터를 함께 가져오는 API
app.get('/EduMaterials/details', authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        const query = `
            SELECT 
                em.EM_id,
                em.EM_title AS title,
                COUNT(CASE WHEN q.Q_type = '객관식' THEN 1 END) AS objectiveCount,
                COUNT(CASE WHEN q.Q_type = '주관식' THEN 1 END) AS subjectiveCount,
                COUNT(CASE WHEN q.Q_difficulty = 'high' || q.Q_difficulty = '어려움' THEN 1 END) AS high,
                COUNT(CASE WHEN q.Q_difficulty = 'normal' || q.Q_difficulty = '중간' THEN 1 END) AS medium,
                COUNT(CASE WHEN q.Q_difficulty = 'low' || q.Q_difficulty = '쉬움' THEN 1 END) AS low
            FROM EduMaterial em
            LEFT JOIN Questions q ON em.EM_id = q.EM_id
            WHERE em.User_id = ?
            GROUP BY em.EM_id
        `;

        const [rows] = await db.promise().query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("자료 세부 정보 조회 오류:", error);
        res.status(500).json({ message: "자료 세부 정보를 가져오는 중 오류가 발생했습니다." });
    }
});

// 모의고사 수정 API
app.put('/EduMaterials/mockExams/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
        const query = `
            UPDATE MockExams 
            SET ME_title = ?, ME_description = ? 
            WHERE ME_id = ?
        `;
        await db.promise().query(query, [title, description, id]);

        const [updatedMockExam] = await db.promise().query('SELECT * FROM MockExams WHERE ME_id = ?', [id]);
        res.status(200).json(updatedMockExam[0]); // 수정된 데이터 반환
    } catch (error) {
        console.error("모의고사 수정 오류:", error);
        res.status(500).json({ message: "모의고사를 수정하는 중 오류가 발생했습니다." });
    }
});

// 모의고사 안에 포함된 질문 조회 API
app.get('/EduMaterials/mockExams/:id/questions', authenticateUser, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. MockExams 테이블에서 ME_content 가져오기
        const getMockExamQuery = `
            SELECT ME_content
            FROM MockExams
            WHERE ME_id = ?
        `;
        const [mockExamRows] = await db.promise().query(getMockExamQuery, [id]);

        if (mockExamRows.length === 0) {
            return res.status(404).json({ message: "해당 모의고사를 찾을 수 없습니다." });
        }

        // 2. ME_content(JSON)에서 EM_id 추출
        const mockExamContent = JSON.parse(mockExamRows[0].ME_content || "[]");
        const emIds = mockExamContent.map((item) => item.EM_id);

        if (emIds.length === 0) {
            return res.status(404).json({ message: "연결된 자료가 없습니다." });
        }

        // 3. Questions 테이블에서 EM_id 기반으로 질문 조회 (Q_answer 추가)
        const getQuestionsQuery = `
            SELECT Q_id, Q_type, Q_content, Q_options, Q_answer, Q_explanation, Q_difficulty, Q_bookmark
            FROM Questions
            WHERE EM_id IN (?)
        `;
        const [questionRows] = await db.promise().query(getQuestionsQuery, [emIds]);

        res.status(200).json(questionRows);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "질문을 불러오는 중 오류가 발생했습니다." });
    }
});

// 모의고사 답안 저장 API
app.post('/EduMaterials/mockExams/:id/submit', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const {
        User_id,
        TotalQuestions,
        CorrectAnswers,
        ObjectiveCorrect,
        SubjectiveCorrect,
        HighCorrect,
        MediumCorrect,
        LowCorrect,
	ElapsedTime,
        Answers,
    } = req.body;

    try {
        // MockExamResults 테이블에 저장
        const [result] = await db.promise().query(
            `INSERT INTO MockExamResults 
            (ME_id, User_id, TotalQuestions, CorrectAnswers, ObjectiveCorrect, SubjectiveCorrect, HighCorrect, MediumCorrect, LowCorrect, ElapsedTime) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, User_id, TotalQuestions, CorrectAnswers, ObjectiveCorrect, SubjectiveCorrect, HighCorrect, MediumCorrect, LowCorrect, ElapsedTime]
        );

        const Result_id = result.insertId;

        // MockExamAnswers 테이블에 저장
        const answersData = Answers.map((answer) => [
            Result_id,
            answer.Question_id,
            answer.SubmittedAnswer,
            answer.IsCorrect,
            answer.Feedback,
        ]);
        await db.promise().query(
            `INSERT INTO MockExamAnswers (Result_id, Question_id, SubmittedAnswer, IsCorrect, Feedback) VALUES ?`,
            [answersData]
        );

        res.status(201).json({ message: "결과 저장 완료" });
    } catch (error) {
        console.error("결과 저장 오류:", error);
        res.status(500).json({ message: "결과를 저장하는 중 오류가 발생했습니다." });
    }
});


// 모의고사 삭제 API
app.delete('/EduMaterials/mockExams/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;

    try {
        // MockExamResults 및 관련 MockExamAnswers 삭제
        await db.promise().query(
            `DELETE FROM MockExamAnswers 
             WHERE Result_id IN (SELECT Result_id FROM MockExamResults WHERE ME_id = ?)`,
            [id]
        );
        await db.promise().query(
            `DELETE FROM MockExamResults WHERE ME_id = ?`,
            [id]
        );

        // MockExams 삭제
        const [result] = await db.promise().query(
            `DELETE FROM MockExams WHERE ME_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "삭제할 모의고사가 없습니다." });
        }
        res.status(200).json({ message: "모의고사가 삭제되었습니다." });
    } catch (error) {
        console.error("모의고사 삭제 오류:", error);
        res.status(500).json({ message: "모의고사를 삭제하는 중 오류가 발생했습니다." });
    }
});

app.get('/EduMaterials/mockExams/:id/results', authenticateUser, async (req, res) => {
    const { id } = req.params;

    try {
        // MockExamResults에서 결과 데이터 가져오기
        const [results] = await db.promise().query(
            `SELECT * FROM MockExamResults WHERE ME_id = ?`,
            [id]
        );

        if (results.length === 0) {
            return res.status(200).json([]);
        }

        // 각 결과에 대한 답안 데이터 추가
        const resultsWithAnswers = await Promise.all(
            results.map(async (result) => {
                const [answers] = await db.promise().query(
                    `SELECT * FROM MockExamAnswers WHERE Result_id = ?`,
                    [result.Result_id]
                );
                return { ...result, Answers: answers };
            })
        );

        res.status(200).json(resultsWithAnswers);
    } catch (error) {
        console.error("결과 가져오기 오류:", error);
        res.status(500).json({ message: "결과를 가져오는 중 오류가 발생했습니다." });
    }
});


// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
