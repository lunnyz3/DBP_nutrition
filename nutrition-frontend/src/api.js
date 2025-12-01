// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} - ${text}`);
  }
  return res.json();
}

export const api = {
  // 음식 검색
  searchFoods(query) {
    const q = encodeURIComponent(query);
    return request(`/foods?query=${q}`);
  },

  // 유저 생성 (테스트용)
  createUser({ email, password, nickname }) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    });
  },

  // 식사(meal) 생성
  createMeal({ userId, mealDate, mealType, memo }) {
    return request('/meals', {
      method: 'POST',
      body: JSON.stringify({ userId, mealDate, mealType, memo }),
    });
  },

  // 식사에 음식 추가
  addMealItem(mealId, { foodId, quantity, unitType }) {
    return request(`/meals/${mealId}/items`, {
      method: 'POST',
      body: JSON.stringify({ foodId, quantity, unitType }),
    });
  },

  // 특정 날짜 식단 초기화
  resetDay(userId, date) {
    return request(`/users/${userId}/meals/${date}`, {
      method: 'DELETE',
    });
  },

  // 하루 요약
  getDailySummary(userId, date) {
    const d = encodeURIComponent(date);
    return request(`/users/${userId}/summary?date=${d}`);
  },

  // 연속 기록 일수
  getStreak(userId) {
    return request(`/users/${userId}/streak`);
  },

  // 트렌드 데이터
  getTrends(userId, startDate, endDate) {
    const start = encodeURIComponent(startDate);
    const end = encodeURIComponent(endDate);
    return request(`/users/${userId}/trends?startDate=${start}&endDate=${end}`);
  },

  // 목표 설정 조회
  getGoals(userId) {
    return request(`/users/${userId}/goals`);
  },

  // 목표 설정 저장
  saveGoals(userId, goals) {
    return request(`/users/${userId}/goals`, {
      method: 'POST',
      body: JSON.stringify(goals),
    });
  },

  // 물 섭취 조회
  getWaterIntake(userId, date) {
    const d = encodeURIComponent(date);
    return request(`/users/${userId}/water?date=${d}`);
  },

  // 물 섭취 저장
  saveWaterIntake(userId, date, amount) {
    return request(`/users/${userId}/water`, {
      method: 'POST',
      body: JSON.stringify({ date, amount }),
    });
  },
};
