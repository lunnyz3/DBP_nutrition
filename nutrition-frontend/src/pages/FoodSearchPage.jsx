// src/pages/FoodSearchPage.jsx
import { useState } from 'react';
import { api } from '../api';

export default function FoodSearchPage() {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.searchFoods(query.trim());
      setFoods(data);
      if (data.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
      }
    } catch (err) {
      console.error(err);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>🔍</span>
        <h2 className="card-title">음식 검색</h2>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="예: 김밥, 국밥, 치킨..."
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? '검색 중...' : '검색'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <span>검색 중...</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && foods.length > 0 && (
        <div className="food-list">
          {foods.map(food => (
            <div key={food.id} className="food-item">
              <div className="food-info">
                <div className="food-name">{food.name}</div>
                <div className="food-details">
                  <span className="food-badge badge-primary">
                    🔥 {food.energy_kcal} kcal
                  </span>
                  <span className="food-badge badge-secondary">
                    📏 {food.serving_size_g} g
                  </span>
                  <span className="food-badge">
                    🥩 단백질 {food.protein_g} g
                  </span>
                  <span className="food-badge">
                    🧈 지방 {food.fat_g} g
                  </span>
                  <span className="food-badge">
                    🍞 탄수 {food.carb_g} g
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && foods.length === 0 && query && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">검색 결과가 없습니다</div>
          <div className="empty-state-subtext">다른 키워드로 검색해보세요</div>
        </div>
      )}

      {!loading && !error && foods.length === 0 && !query && (
        <div className="empty-state">
          <div className="empty-state-icon">🍽</div>
          <div className="empty-state-text">음식을 검색해보세요</div>
          <div className="empty-state-subtext">위 검색창에 음식 이름을 입력하세요</div>
        </div>
      )}
    </div>
  );
}
