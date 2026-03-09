# 🥗 영양 관리 서비스 (Nutrition App)

이 프로젝트는 사용자의 일일 식단을 기록하고, 영양소 섭취 목표 달성 현황을 시각적으로 추적하며 관리할 수 있도록 돕는 풀스택 웹 애플리케이션입니다.

## 🛠 기술 스택

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MySQL (mysql2 라이브러리 사용)
- **Environment**: dotenv (환경 변수 관리)

### **Frontend**
- **Framework**: React
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Routing**: React Router DOM

---

## 📂 프로젝트 구조

```text
dbp_nutrition/
├── nutrition-app/          # Express 백엔드 서버
│   ├── db.js               # MySQL 데이터베이스 연결 설정
│   ├── server.js           # API 엔드포인트 및 서버 로직
│   └── .env                # 데이터베이스 접속 정보 (설정 필요)
└── nutrition-frontend/     # React 프론트엔드 애플리케이션
    ├── src/
    │   ├── pages/          # 기능별 페이지 컴포넌트
    │   │   ├── RecordMealPage.jsx  # 식단 기록 페이지
    │   │   ├── GoalsPage.jsx       # 목표 설정 페이지
    │   │   ├── TrendsPage.jsx      # 섭취 추이 분석 페이지
    │   │   ├── SummaryPage.jsx     # 영양 요약 페이지
    │   │   ├── BadgesPage.jsx      # 업적/배지 페이지
    │   │   └── FoodSearchPage.jsx  # 음식 검색 페이지
    │   ├── App.jsx         # 라우팅 및 메인 구조
    │   └── api.js          # 백엔드 API 통신 모듈
    └── index.html
