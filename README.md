
🥗 영양 관리 애플리케이션 (Nutrition App)
이 프로젝트는 사용자의 식단을 기록하고 영양 섭취 목표를 설정하며, 그 추이를 추적할 수 있는 풀스택 웹 애플리케이션입니다.

🛠 기술 스택
Backend
Runtime: Node.js

Framework: Express

Database: MySQL (연동을 위한 mysql2 라이브러리 사용)

Environment Management: dotenv

Frontend
Library: React

Build Tool: Vite

HTTP Client: Axios

📂 프로젝트 구조
Plaintext
dbp_nutrition/
├── nutrition-app/          # Express 기반 백엔드 API 서버
│   ├── db.js               # 데이터베이스 연결 설정
│   ├── server.js           # 서버 메인 진입점 및 API 엔드포인트 정의
│   ├── package.json        # 백엔드 의존성 관리
│   └── .env                # 환경 변수 설정 파일
└── nutrition-frontend/     # React 기반 프론트엔드 애플리케이션
    ├── src/
    │   ├── pages/          # 각 기능별 페이지 (식단 기록, 목표 설정, 트렌드 등)
    │   ├── App.jsx         # 메인 애플리케이션 컴포넌트
    │   └── api.js          # 백엔드 API 연동 모듈
    ├── package.json        # 프론트엔드 의존성 관리
    └── index.html          # 메인 HTML 파일
🚀 주요 기능
식단 기록 (Record Meal): 매일 먹은 음식과 영양 정보를 기록합니다.

음식 검색 (Food Search): 데이터베이스 내의 음식 정보를 검색합니다.

영양 목표 설정 (Goals): 일일 섭취 목표 영양소를 설정하고 관리합니다.

추이 분석 (Trends): 기간별 영양 섭취 데이터의 변화를 시각적으로 확인합니다.

배지 시스템 (Badges): 특정 성과 달성 시 배지를 부여받습니다.

요약 (Summary): 현재 영양 섭취 현황에 대한 요약 정보를 제공합니다.

⚙️ 설치 및 실행 방법
1. 백엔드 설정 (nutrition-app)
nutrition-app 디렉토리로 이동합니다.

의존성을 설치합니다:

Bash
npm install
.env 파일을 생성하고 MySQL 연결 정보를 입력합니다:

코드 스니펫
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_db_name
PORT=3000
서버를 실행합니다:

Bash
npm start
2. 프론트엔드 설정 (nutrition-frontend)
nutrition-frontend 디렉토리로 이동합니다.

의존성을 설치합니다:

Bash
npm install
개발 서버를 실행합니다:

Bash
npm run dev
🔌 API 엔드포인트 (기본)
GET /: 서버 연결 확인

기타 상세 API는 server.js에서 정의된 라우트를 참조하십시오.
