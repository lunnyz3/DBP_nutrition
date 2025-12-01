// src/pages/TrendsPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function TrendsPage({ userId }) {
  const [period, setPeriod] = useState('week'); // 'week' or 'month'
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrends();
  }, [userId, period]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate, endDate;

      if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
      } else {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
      }

      const data = await api.getTrends(userId, startDate, endDate);
      setTrends(data.trends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxKcal = trends.length > 0 ? Math.max(...trends.map(t => Number(t.total_kcal || 0))) : 1;

  // 간단한 막대 그래프 컴포넌트
  const BarChart = ({ data, maxValue, label }) => {
    return (
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{label}</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px' }}>
          {data.map((item, idx) => {
            const height = maxValue > 0 ? (Number(item.total_kcal || 0) / maxValue) * 100 : 0;
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${height}%`,
                    background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'height 0.3s ease',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  {new Date(item.date).getDate()}일
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const avgKcal = trends.length > 0 
    ? (trends.reduce((sum, t) => sum + (t.total_kcal || 0), 0) / trends.length).toFixed(0)
    : 0;

  const avgCarb = trends.length > 0
    ? (trends.reduce((sum, t) => sum + (t.total_carb_g || 0), 0) / trends.length).toFixed(1)
    : 0;

  const avgProtein = trends.length > 0
    ? (trends.reduce((sum, t) => sum + (t.total_protein_g || 0), 0) / trends.length).toFixed(1)
    : 0;

  const avgFat = trends.length > 0
    ? (trends.reduce((sum, t) => sum + (t.total_fat_g || 0), 0) / trends.length).toFixed(1)
    : 0;

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>📈</span>
        <h2 className="card-title">트렌드 리포트</h2>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">📅 기간 선택</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <span>데이터 로딩 중...</span>
        </div>
      ) : trends.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">트렌드 데이터가 없습니다</div>
          <div className="empty-state-subtext">식단을 기록하면 트렌드를 확인할 수 있습니다</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📊 평균 섭취량</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{avgKcal}</div>
                <div className="stat-label">평균 칼로리 (kcal)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{avgCarb}</div>
                <div className="stat-label">평균 탄수화물 (g)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{avgProtein}</div>
                <div className="stat-label">평균 단백질 (g)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{avgFat}</div>
                <div className="stat-label">평균 지방 (g)</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>📈 일별 칼로리 추이</h3>
            <BarChart data={trends} maxValue={maxKcal} label="일별 칼로리 (kcal)" />
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📋 상세 데이터</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>칼로리</th>
                    <th>탄수화물</th>
                    <th>단백질</th>
                    <th>지방</th>
                    <th>나트륨</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend, idx) => (
                    <tr key={idx}>
                      <td>{new Date(trend.date).toLocaleDateString('ko-KR')}</td>
                      <td><strong>{Number(trend.total_kcal || 0).toFixed(0)}</strong> kcal</td>
                      <td>{Number(trend.total_carb_g || 0).toFixed(1)} g</td>
                      <td>{Number(trend.total_protein_g || 0).toFixed(1)} g</td>
                      <td>{Number(trend.total_fat_g || 0).toFixed(1)} g</td>
                      <td>{Number(trend.total_sodium_mg || 0).toFixed(0)} mg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

