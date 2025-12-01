// src/pages/BadgesPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function BadgesPage({ userId }) {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, [userId]);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const data = await api.getStreak(userId);
      setStreak(data.streak || 0);
      setBadges(data.badges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allBadges = [
    { id: 'streak_7', name: '7일 연속 기록', icon: '🔥', description: '7일 연속으로 식단을 기록하세요!', required: 7 },
    { id: 'streak_14', name: '14일 연속 기록', icon: '⭐', description: '2주간 꾸준히 기록하세요!', required: 14 },
    { id: 'streak_30', name: '30일 연속 기록', icon: '👑', description: '한 달간의 성실함을 증명하세요!', required: 30 },
    { id: 'streak_100', name: '100일 연속 기록', icon: '🏆', description: '100일의 기록, 대단한 성취입니다!', required: 100 },
  ];

  const earnedBadgeIds = new Set(badges.map(b => b.id));

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>🏅</span>
        <h2 className="card-title">뱃지 & 성취</h2>
      </div>

      {loading ? (
        <div className="loading">
          <span>로딩 중...</span>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔥</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', 
                         background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                         WebkitBackgroundClip: 'text',
                         WebkitTextFillColor: 'transparent',
                         backgroundClip: 'text' }}>
              {streak}일
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              연속 기록 중입니다!
            </div>
            {streak >= 7 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', 
                           background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                           borderRadius: 'var(--radius-sm)',
                           color: 'var(--secondary-dark)',
                           fontWeight: 600 }}>
                🎉 축하합니다! {streak >= 7 ? streak >= 30 ? '30일' : streak >= 14 ? '14일' : '7일' : ''} 연속 기록 뱃지를 획득하셨습니다!
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎖️</span>
              <span>뱃지 컬렉션</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {allBadges.map(badge => {
                const earned = earnedBadgeIds.has(badge.id);
                const progress = Math.min((streak / badge.required) * 100, 100);
                
                return (
                  <div
                    key={badge.id}
                    className="card"
                    style={{
                      textAlign: 'center',
                      opacity: earned ? 1 : 0.6,
                      border: earned ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: earned 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)'
                        : 'var(--bg-card)',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem', filter: earned ? 'none' : 'grayscale(100%)' }}>
                      {badge.icon}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {badge.description}
                    </div>
                    {!earned && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          진행률: {progress.toFixed(0)}%
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          {badge.required - streak}일 남음
                        </div>
                      </div>
                    )}
                    {earned && (
                      <div style={{ 
                        padding: '0.5rem',
                        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginTop: '0.5rem'
                      }}>
                        ✓ 획득 완료
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

