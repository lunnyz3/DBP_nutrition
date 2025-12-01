// src/pages/SummaryPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

// 숫자 안전 변환 헬퍼
const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

// 영양소별 색상
const nutrientColors = {
  kcal: { primary: '#6366f1', secondary: '#818cf8' },
  carb: { primary: '#10b981', secondary: '#34d399' },
  protein: { primary: '#f59e0b', secondary: '#fbbf24' },
  fat: { primary: '#ef4444', secondary: '#f87171' },
};

// 진행률 바 컴포넌트
const ProgressBar = ({ value, max, label, color }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {value.toFixed(1)} / {max > 0 ? max.toFixed(1) : '?'}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color.primary} 0%, ${color.secondary} 100%)`,
            transition: 'width 0.3s ease',
            borderRadius: '999px',
          }}
        />
      </div>
    </div>
  );
};

// 끼니별 아이콘
const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

// 끼니 이름 변환
const mealLabels = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

// 영양 밸런스 점수 계산
const calculateBalanceScore = (carb, protein, fat) => {
  const total = carb + protein + fat;
  if (total === 0) return 0;
  
  // 권장 비율: 탄수 50%, 단백질 30%, 지방 20%
  const carbRatio = (carb / total) * 100;
  const proteinRatio = (protein / total) * 100;
  const fatRatio = (fat / total) * 100;
  
  // 각 비율이 권장값에 얼마나 가까운지 계산 (100점 만점)
  const carbScore = Math.max(0, 100 - Math.abs(carbRatio - 50) * 2);
  const proteinScore = Math.max(0, 100 - Math.abs(proteinRatio - 30) * 2);
  const fatScore = Math.max(0, 100 - Math.abs(fatRatio - 20) * 2);
  
  return Math.round((carbScore + proteinScore + fatScore) / 3);
};

// 신호등 색상 결정
const getTrafficLightColor = (value, max) => {
  if (max === 0) return 'gray';
  const ratio = value / max;
  if (ratio < 0.8) return 'green';
  if (ratio < 1.2) return 'yellow';
  return 'red';
};

export default function SummaryPage({ userId }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [goals, setGoals] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLoad = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const [summaryRes, goalsRes, waterRes] = await Promise.all([
        api.getDailySummary(userId, date),
        api.getGoals(userId).catch(() => null),
        api.getWaterIntake(userId, date).catch(() => ({ amount: 0 })),
      ]);
      
      setData(summaryRes);
      setGoals(goalsRes);
      setWaterIntake(waterRes.amount || 0);
      
      if (!summaryRes.byMeal || summaryRes.byMeal.length === 0) {
        setMsg('해당 날짜에 기록된 식단이 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setMsg('요약 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  // 날짜 변경 시 자동 조회
  useEffect(() => {
    handleLoad();
  }, [handleLoad]);

  const handleWaterChange = async (newAmount) => {
    try {
      await api.saveWaterIntake(userId, date, newAmount);
      setWaterIntake(newAmount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDay = async () => {
    if (window.confirm(`정말로 ${date}의 모든 식단 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await api.resetDay(userId, date);
        alert(`${date}의 식단 기록이 성공적으로 초기화되었습니다.`);
        handleLoad(); // 데이터 다시 로드
      } catch (err) {
        console.error(err);
        alert('기록 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const dayTotal = data?.dayTotal || {};
  const totalKcal = toNum(dayTotal.total_kcal);
  const totalCarb = toNum(dayTotal.total_carb_g);
  const totalProtein = toNum(dayTotal.total_protein_g);
  const totalFat = toNum(dayTotal.total_fat_g);
  const totalSodium = toNum(dayTotal.total_sodium_mg);
  const totalSugar = toNum(dayTotal.total_sugar_g);

  // 목표 설정에서 권장 섭취량 가져오기 (없으면 기본값)
  const recommendedKcal = goals?.targetCalories || 2000;
  const recommendedCarb = goals?.targetCarb || 300;
  const recommendedProtein = goals?.targetProtein || 150;
  const recommendedFat = goals?.targetFat || 65;
  const recommendedSodium = 2000; // mg
  const recommendedSugar = 50; // g

  // 영양 밸런스 점수
  const balanceScore = calculateBalanceScore(totalCarb, totalProtein, totalFat);

  // 경고 메시지 생성
  const warnings = [];
  if (totalSodium > recommendedSodium * 1.2) {
    warnings.push({
      type: 'danger',
      message: `⚠️ 나트륨 섭취가 권장량의 ${((totalSodium / recommendedSodium) * 100).toFixed(0)}%입니다. (${totalSodium.toFixed(0)}mg / ${recommendedSodium}mg)`,
    });
  }
  if (totalSugar > recommendedSugar * 1.2) {
    warnings.push({
      type: 'danger',
      message: `⚠️ 당류 섭취가 권장량의 ${((totalSugar / recommendedSugar) * 100).toFixed(0)}%입니다. (${totalSugar.toFixed(1)}g / ${recommendedSugar}g)`,
    });
  }
  if (totalProtein < recommendedProtein * 0.8) {
    const deficit = recommendedProtein - totalProtein;
    warnings.push({
      type: 'warning',
      message: `💪 단백질이 ${deficit.toFixed(1)}g 부족합니다. (${totalProtein.toFixed(1)}g / ${recommendedProtein}g)`,
    });
  }
  if (totalCarb < recommendedCarb * 0.7) {
    warnings.push({
      type: 'info',
      message: `🍞 탄수화물 섭취가 권장량보다 낮습니다.`,
    });
  }

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <h2 className="card-title">하루 요약</h2>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">📅 날짜 선택</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleLoad} disabled={loading} style={{ width: '100%' }}>
            {loading ? '조회 중...' : '🔄 새로고침'}
          </button>
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleResetDay} disabled={loading} className="danger" style={{ width: '100%' }}>
            🗑️ 초기화
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <span>조회 중...</span>
        </div>
      )}

      {msg && !data && (
        <div className="info-message">
          {msg}
        </div>
      )}

      {data && data.dayTotal && (
        <>
          {/* 영양 밸런스 점수 */}
          <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>⚖️ 영양 밸런스 점수</h3>
            <div style={{
              margin: '0 auto 1rem',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: balanceScore >= 80 
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' // Green
                : balanceScore >= 60
                ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' // Yellow
                : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', // Red
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              {balanceScore}점
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {balanceScore >= 80 ? '✅ 균형잡힌 영양 섭취입니다!' 
               : balanceScore >= 60 ? '⚠️ 영양 밸런스를 개선해보세요'
               : '❌ 영양 밸런스가 좋지 않습니다'}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                탄수: {totalCarb > 0 ? ((totalCarb / (totalCarb + totalProtein + totalFat)) * 100).toFixed(0) : 0}% | 
                단백질: {totalProtein > 0 ? ((totalProtein / (totalCarb + totalProtein + totalFat)) * 100).toFixed(0) : 0}% | 
                지방: {totalFat > 0 ? ((totalFat / (totalCarb + totalProtein + totalFat)) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          {warnings.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              {warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className={warning.type === 'danger' ? 'error-message' : warning.type === 'warning' ? 'warning-message' : 'info-message'}
                  style={{
                    background: warning.type === 'danger'
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                      : warning.type === 'warning'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)'
                      : 'var(--bg-secondary)',
                    border: warning.type === 'danger'
                      ? '2px solid var(--danger)'
                      : warning.type === 'warning'
                      ? '2px solid var(--warning)'
                      : '2px solid var(--border)',
                    color: warning.type === 'danger'
                      ? 'var(--danger)'
                      : warning.type === 'warning'
                      ? 'var(--warning)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {warning.message}
                </div>
              ))}
            </div>
          )}

          {/* 물 섭취 트래커 */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💧</span>
              <span>물 섭취량</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>오늘 마신 물</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {waterIntake}ml
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min((waterIntake / 2000) * 100, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  목표: 2000ml (권장 일일 섭취량)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[250, 500, 750, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleWaterChange(waterIntake + amount)}
                  className="secondary"
                  style={{ flex: 1, minWidth: '100px' }}
                >
                  +{amount}ml
                </button>
              ))}
              <button
                onClick={() => handleWaterChange(0)}
                className="secondary"
                style={{ flex: 1, minWidth: '100px' }}
              >
                초기화
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📈</span>
              <span>하루 합계</span>
            </h3>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{totalKcal.toFixed(0)}</div>
                <div className="stat-label">칼로리 (kcal)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalCarb.toFixed(1)}</div>
                <div className="stat-label">탄수화물 (g)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalProtein.toFixed(1)}</div>
                <div className="stat-label">단백질 (g)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalFat.toFixed(1)}</div>
                <div className="stat-label">지방 (g)</div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                권장 섭취량 대비
              </h4>
              <ProgressBar
                value={totalKcal}
                max={recommendedKcal}
                label="칼로리"
                color={nutrientColors.kcal}
              />
              <ProgressBar
                value={totalCarb}
                max={recommendedCarb}
                label="탄수화물"
                color={nutrientColors.carb}
              />
              <ProgressBar
                value={totalProtein}
                max={recommendedProtein}
                label="단백질"
                color={nutrientColors.protein}
              />
              <ProgressBar
                value={totalFat}
                max={recommendedFat}
                label="지방"
                color={nutrientColors.fat}
              />
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>당류</span>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: getTrafficLightColor(totalSugar, recommendedSugar) === 'green' ? '#10b981' 
                        : getTrafficLightColor(totalSugar, recommendedSugar) === 'yellow' ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {toNum(dayTotal.total_sugar_g).toFixed(1)} g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    권장: {recommendedSugar}g
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>식이섬유</div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {toNum(dayTotal.total_fiber_g).toFixed(1)} g
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>나트륨</span>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: getTrafficLightColor(totalSodium, recommendedSodium) === 'green' ? '#10b981' 
                        : getTrafficLightColor(totalSodium, recommendedSodium) === 'yellow' ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {toNum(dayTotal.total_sodium_mg).toFixed(1)} mg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    권장: {recommendedSodium}mg
                  </div>
                </div>
              </div>
            </div>
          </div>

          {data.byMeal && data.byMeal.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🍽</span>
                <span>끼니별 상세</span>
              </h3>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>끼니</th>
                      <th>칼로리</th>
                      <th>탄수화물</th>
                      <th>단백질</th>
                      <th>지방</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byMeal.map((m) => (
                      <tr key={m.meal_type}>
                        <td>
                          <span style={{ marginRight: '0.5rem' }}>
                            {mealIcons[m.meal_type] || '🍽'}
                          </span>
                          {mealLabels[m.meal_type] || m.meal_type}
                        </td>
                        <td>
                          <strong>{toNum(m.total_kcal).toFixed(1)}</strong> kcal
                        </td>
                        <td>{toNum(m.total_carb_g).toFixed(1)} g</td>
                        <td>{toNum(m.total_protein_g).toFixed(1)} g</td>
                        <td>{toNum(m.total_fat_g).toFixed(1)} g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && !msg && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">날짜를 선택하고 조회해보세요</div>
          <div className="empty-state-subtext">식단 기록을 확인할 수 있습니다</div>
        </div>
      )}
    </div>
  );
}
