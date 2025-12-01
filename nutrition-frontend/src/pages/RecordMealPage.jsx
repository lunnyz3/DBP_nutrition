// src/pages/RecordMealPage.jsx
import { useState } from 'react';
import { api } from '../api';

const mealTypes = [
  { value: 'breakfast', label: '아침', icon: '🌅' },
  { value: 'lunch', label: '점심', icon: '☀️' },
  { value: 'dinner', label: '저녁', icon: '🌙' },
  { value: 'snack', label: '간식', icon: '🍪' },
];

export default function RecordMealPage({ userId }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [mealType, setMealType] = useState('breakfast');
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      const data = await api.searchFoods(query.trim());
      setSearchResult(data);
      if (data.length === 0) {
        setMessage('검색 결과가 없습니다.');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('검색 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!selectedFood) {
      setMessage('먼저 음식을 선택하세요');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      // 1) meal 생성
      const meal = await api.createMeal({
        userId,
        mealDate: date,
        mealType,
        memo: null,
      });

      // 2) meal_items 추가
      await api.addMealItem(meal.mealId, {
        foodId: selectedFood.id,
        quantity: Number(quantity),
        unitType: 'serving',
      });

      setMessage('식단이 성공적으로 저장되었습니다! 🎉');
      setMessageType('success');
      // 상태 초기화
      setSelectedFood(null);
      setSearchResult([]);
      setQuery('');
      setQuantity(1);
    } catch (err) {
      console.error(err);
      setMessage('저장 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const selectedMealType = mealTypes.find(mt => mt.value === mealType);

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>📝</span>
        <h2 className="card-title">식단 기록</h2>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">📅 날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">🍽 끼니</label>
          <select
            value={mealType}
            onChange={e => setMealType(e.target.value)}
            style={{ width: '100%' }}
          >
            {mealTypes.map(mt => (
              <option key={mt.value} value={mt.value}>
                {mt.icon} {mt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="추가할 음식 검색..."
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? '검색 중...' : '🔍 검색'}
        </button>
      </form>

      {loading && !message && (
        <div className="loading">
          <span>처리 중...</span>
        </div>
      )}

      {message && (
        <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔍</span>
            <span>검색 결과</span>
          </h3>
          {searchResult.length > 0 ? (
            <div className="food-list" style={{ marginTop: 0 }}>
              {searchResult.map(food => (
                <div
                  key={food.id}
                  className={`food-item ${selectedFood?.id === food.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFood(food)}
                >
                  <div className="food-info">
                    <div className="food-name">{food.name}</div>
                    <div className="food-details">
                      <span className="food-badge badge-primary">
                        🔥 {food.energy_kcal} kcal
                      </span>
                      <span className="food-badge">
                        📏 {food.serving_size_g} g
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">검색 결과가 없습니다</div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✅</span>
            <span>선택된 음식</span>
          </h3>
          {selectedFood ? (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="food-name" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  {selectedFood.name}
                </div>
                <div className="stats-grid" style={{ margin: 0 }}>
                  <div className="stat-card">
                    <div className="stat-value">{selectedFood.energy_kcal}</div>
                    <div className="stat-label">칼로리 (kcal)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{selectedFood.serving_size_g}</div>
                    <div className="stat-label">1인분 (g)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{selectedFood.protein_g}</div>
                    <div className="stat-label">단백질 (g)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{selectedFood.fat_g}</div>
                    <div className="stat-label">지방 (g)</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  📊 인분 수
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  style={{ width: '100%' }}
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  총 칼로리: {(selectedFood.energy_kcal * quantity).toFixed(1)} kcal
                </div>
              </div>

              <button
                onClick={handleSaveMeal}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {selectedMealType?.icon} {selectedMealType?.label}에 추가하기
              </button>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">👈</div>
              <div className="empty-state-text">왼쪽에서 음식을 선택하세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
