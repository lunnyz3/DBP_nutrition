// src/pages/GoalsPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

const goalTypes = [
  { value: 'lose', label: '다이어트 (감량)', icon: '📉', description: '체중 감량을 목표로 합니다' },
  { value: 'maintain', label: '건강 유지', icon: '⚖️', description: '현재 체중을 유지합니다' },
  { value: 'gain', label: '근육 증가 (증량)', icon: '📈', description: '근육량 증가를 목표로 합니다' },
];

const healthConditions = [
  { id: 'diabetes', label: '당뇨', icon: '🩺' },
  { id: 'hypertension', label: '고혈압', icon: '🩺' },
  { id: 'keto', label: '키토제닉', icon: '🥑' },
  { id: 'low_sodium', label: '저나트륨', icon: '🧂' },
];

export default function GoalsPage({ userId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [goalType, setGoalType] = useState('maintain');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [targetCarb, setTargetCarb] = useState(300);
  const [targetProtein, setTargetProtein] = useState(150);
  const [targetFat, setTargetFat] = useState(65);
  const [selectedConditions, setSelectedConditions] = useState([]);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await api.getGoals(userId);
      setGoalType(data.goalType || 'maintain');
      setTargetCalories(data.targetCalories || 2000);
      setTargetCarb(data.targetCarb || 300);
      setTargetProtein(data.targetProtein || 150);
      setTargetFat(data.targetFat || 65);
      setSelectedConditions(data.healthConditions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalTypeChange = (newType) => {
    setGoalType(newType);
    // 목표 타입에 따라 권장값 자동 설정
    if (newType === 'lose') {
      setTargetCalories(1500);
      setTargetCarb(150);
      setTargetProtein(120);
      setTargetFat(50);
    } else if (newType === 'maintain') {
      setTargetCalories(2000);
      setTargetCarb(300);
      setTargetProtein(150);
      setTargetFat(65);
    } else if (newType === 'gain') {
      setTargetCalories(2500);
      setTargetCarb(350);
      setTargetProtein(180);
      setTargetFat(80);
    }
  };

  const handleConditionToggle = (conditionId) => {
    setSelectedConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      await api.saveGoals(userId, {
        goalType,
        targetCalories: Number(targetCalories),
        targetCarb: Number(targetCarb),
        targetProtein: Number(targetProtein),
        targetFat: Number(targetFat),
        healthConditions: selectedConditions,
        restrictions: selectedConditions, // 건강 상태에 따른 제한사항
      });

      setMessage('목표가 성공적으로 저장되었습니다! 🎉');
      setMessageType('success');
    } catch (err) {
      console.error(err);
      setMessage('저장 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="loading">
          <span>로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <span style={{ fontSize: '1.5rem' }}>🎯</span>
        <h2 className="card-title">목표 설정</h2>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>목표 타입</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {goalTypes.map(type => (
            <div
              key={type.value}
              onClick={() => handleGoalTypeChange(type.value)}
              className="card"
              style={{
                cursor: 'pointer',
                border: goalType === type.value ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: goalType === type.value
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)'
                  : 'var(--bg-card)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{type.label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {type.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>일일 목표 영양소</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">🔥 목표 칼로리 (kcal)</label>
            <input
              type="number"
              value={targetCalories}
              onChange={e => setTargetCalories(e.target.value)}
              min="1000"
              max="5000"
              step="50"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">🍞 목표 탄수화물 (g)</label>
            <input
              type="number"
              value={targetCarb}
              onChange={e => setTargetCarb(e.target.value)}
              min="0"
              max="500"
              step="10"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">🥩 목표 단백질 (g)</label>
            <input
              type="number"
              value={targetProtein}
              onChange={e => setTargetProtein(e.target.value)}
              min="0"
              max="300"
              step="10"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">🧈 목표 지방 (g)</label>
            <input
              type="number"
              value={targetFat}
              onChange={e => setTargetFat(e.target.value)}
              min="0"
              max="200"
              step="5"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>건강 상태</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          건강 상태를 선택하면 해당 영양소를 중점적으로 관리합니다.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {healthConditions.map(condition => {
            const selected = selectedConditions.includes(condition.id);
            return (
              <div
                key={condition.id}
                onClick={() => handleConditionToggle(condition.id)}
                style={{
                  padding: '1rem',
                  border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: selected
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)'
                    : 'var(--bg-secondary)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{condition.icon}</div>
                <div style={{ fontWeight: 500 }}>{condition.label}</div>
                {selected && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)' }}>
                    ✓ 선택됨
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {saving ? '저장 중...' : '💾 목표 저장하기'}
      </button>
    </div>
  );
}

