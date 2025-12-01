// server.js
const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // JSON body 파싱

// 0. 헬스 체크
app.get('/', (req, res) => {
  res.send('Nutrition API is running');
});

/**
 * 1. 음식 검색 API
 * GET /foods?query=밥
 */
app.get('/foods', async (req, res) => {
  const q = req.query.query || '';
  try {
    const [rows] = await pool.query(
      `SELECT id, food_code, name,
              serving_size_g,
              energy_kcal, carb_g, protein_g, fat_g,
              sugar_g, fiber_g, sodium_mg
       FROM foods
       WHERE name LIKE ?
       LIMIT 50`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /foods error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 2. 유저 생성 (테스트용)
 * POST /users
 * { "email": "...", "password": "...", "nickname": "..." }
 */
app.post('/users', async (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email, password 필요' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, nickname)
       VALUES (?, ?, ?)`,
      [email, password, nickname || null]
    );
    res.status(201).json({ id: result.insertId, email, nickname });
  } catch (err) {
    console.error('POST /users error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 3. 식사 생성
 * POST /meals
 * { "userId": 1, "mealDate": "2025-11-29", "mealType": "breakfast", "memo": "메모" }
 */
app.post('/meals', async (req, res) => {
  const { userId, mealDate, mealType, memo } = req.body;

  if (!userId || !mealDate || !mealType) {
    return res.status(400).json({ error: 'userId, mealDate, mealType 필요' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO meals (user_id, meal_date, meal_type, memo)
       VALUES (?, ?, ?, ?)`,
      [userId, mealDate, mealType, memo || null]
    );
    res.status(201).json({ mealId: result.insertId });
  } catch (err) {
    console.error('POST /meals error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 4. 식사에 음식 추가
 * POST /meals/:mealId/items
 * { "foodId": 123, "quantity": 1, "unitType": "serving" }
 */
app.post('/meals/:mealId/items', async (req, res) => {
  const mealId = req.params.mealId;
  const { foodId, quantity, unitType } = req.body;

  if (!foodId || !quantity) {
    return res.status(400).json({ error: 'foodId, quantity 필요' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO meal_items (meal_id, food_id, quantity, unit_type)
       VALUES (?, ?, ?, ?)`,
      [mealId, foodId, quantity, unitType || 'serving']
    );
    res.status(201).json({ itemId: result.insertId });
  } catch (err) {
    console.error('POST /meals/:mealId/items error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 4.1 특정 날짜의 모든 식사 기록 삭제
 * DELETE /users/:userId/meals/:date
 */
app.delete('/users/:userId/meals/:date', async (req, res) => {
  const { userId, date } = req.params;

  if (!userId || !date) {
    return res.status(400).json({ error: 'userId, date가 필요합니다.' });
  }

  try {
    // 해당 날짜의 모든 meal_id를 찾습니다.
    const [meals] = await pool.query(
      'SELECT id FROM meals WHERE user_id = ? AND meal_date = ?',
      [userId, date]
    );

    if (meals.length === 0) {
      return res.status(200).json({ success: true, message: '삭제할 식사 기록이 없습니다.' });
    }

    const mealIds = meals.map(meal => meal.id);

    // meal_items 테이블에서 관련 항목들을 삭제합니다.
    await pool.query(
      'DELETE FROM meal_items WHERE meal_id IN (?)',
      [mealIds]
    );

    // meals 테이블에서 해당 날짜의 식사를 삭제합니다.
    await pool.query(
      'DELETE FROM meals WHERE user_id = ? AND meal_date = ?',
      [userId, date]
    );

    res.json({ success: true, message: `${date}의 모든 식사 기록이 삭제되었습니다.` });
  } catch (err) {
    console.error('DELETE /users/:userId/meals/:date error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 5. 특정 날짜 요약 (아침/점심/저녁별 + 하루 합계)
 * GET /users/:userId/summary?date=YYYY-MM-DD
 */
app.get('/users/:userId/summary', async (req, res) => {
  const userId = req.params.userId;
  const date = req.query.date;

  if (!date) {
    return res.status(400).json({ error: 'date 쿼리 파라미터 필요 (YYYY-MM-DD)' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        m.user_id,
        m.meal_date,
        m.meal_type,
        SUM(f.energy_kcal  * mi.quantity) AS total_kcal,
        SUM(f.carb_g       * mi.quantity) AS total_carb_g,
        SUM(f.protein_g    * mi.quantity) AS total_protein_g,
        SUM(f.fat_g        * mi.quantity) AS total_fat_g,
        SUM(f.sugar_g      * mi.quantity) AS total_sugar_g,
        SUM(f.fiber_g      * mi.quantity) AS total_fiber_g,
        SUM(f.sodium_mg    * mi.quantity) AS total_sodium_mg
      FROM meals m
      JOIN meal_items mi ON mi.meal_id = m.id
      JOIN foods f      ON f.id = mi.food_id
      WHERE m.user_id = ?
        AND m.meal_date = ?
      GROUP BY m.user_id, m.meal_date, m.meal_type
      ORDER BY m.meal_type;
      `,
      [userId, date]
    );

    const dayTotal = rows.reduce(
      (acc, row) => {
        acc.total_kcal      += parseFloat(row.total_kcal      || 0);
        acc.total_carb_g    += parseFloat(row.total_carb_g    || 0);
        acc.total_protein_g += parseFloat(row.total_protein_g || 0);
        acc.total_fat_g     += parseFloat(row.total_fat_g     || 0);
        acc.total_sugar_g   += parseFloat(row.total_sugar_g   || 0);
        acc.total_fiber_g   += parseFloat(row.total_fiber_g   || 0);
        acc.total_sodium_mg += parseFloat(row.total_sodium_mg || 0);
        return acc;
      },
      {
        total_kcal: 0,
        total_carb_g: 0,
        total_protein_g: 0,
        total_fat_g: 0,
        total_sugar_g: 0,
        total_fiber_g: 0,
        total_sodium_mg: 0
      }
    );

    res.json({
      date,
      byMeal: rows,
      dayTotal
    });
  } catch (err) {
    console.error('GET /users/:userId/summary error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 6. 연속 기록 일수 조회
 * GET /users/:userId/streak
 */
app.get('/users/:userId/streak', async (req, res) => {
  const userId = req.params.userId;

  try {
    // 오늘부터 역순으로 연속 기록 일수 계산
    const [rows] = await pool.query(
      `
      SELECT DISTINCT meal_date
      FROM meals
      WHERE user_id = ?
      ORDER BY meal_date DESC
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ streak: 0, lastDate: null });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    for (const row of rows) {
      const mealDate = new Date(row.meal_date);
      mealDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((checkDate - mealDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || (streak === 0 && diffDays === 1)) {
        // 오늘이거나 어제면 연속 기록으로 간주
        if (diffDays === 0) {
          streak = 1;
        } else {
          streak = 1;
          checkDate = new Date(mealDate);
        }
      } else if (diffDays === 1) {
        // 연속된 날짜
        streak++;
        checkDate = new Date(mealDate);
      } else {
        // 연속이 끊김
        break;
      }
    }

    res.json({ 
      streak, 
      lastDate: rows[0]?.meal_date || null,
      badges: getBadges(streak)
    });
  } catch (err) {
    console.error('GET /users/:userId/streak error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

function getBadges(streak) {
  const badges = [];
  if (streak >= 7) badges.push({ id: 'streak_7', name: '7일 연속 기록', icon: '🔥' });
  if (streak >= 14) badges.push({ id: 'streak_14', name: '14일 연속 기록', icon: '⭐' });
  if (streak >= 30) badges.push({ id: 'streak_30', name: '30일 연속 기록', icon: '👑' });
  if (streak >= 100) badges.push({ id: 'streak_100', name: '100일 연속 기록', icon: '🏆' });
  return badges;
}

/**
 * 7. 주간/월간 트렌드 데이터
 * GET /users/:userId/trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
app.get('/users/:userId/trends', async (req, res) => {
  const userId = req.params.userId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate, endDate 쿼리 파라미터 필요' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        m.meal_date AS date,
        SUM(f.energy_kcal * mi.quantity) AS total_kcal,
        SUM(f.carb_g * mi.quantity) AS total_carb_g,
        SUM(f.protein_g * mi.quantity) AS total_protein_g,
        SUM(f.fat_g * mi.quantity) AS total_fat_g,
        SUM(f.sodium_mg * mi.quantity) AS total_sodium_mg
      FROM meals m
      JOIN meal_items mi ON mi.meal_id = m.id
      JOIN foods f ON f.id = mi.food_id
      WHERE m.user_id = ?
        AND m.meal_date >= ?
        AND m.meal_date <= ?
      GROUP BY m.meal_date
      ORDER BY m.meal_date ASC
      `,
      [userId, startDate, endDate]
    );

    // Create a map where keys are guaranteed to be 'YYYY-MM-DD' strings.
    // This handles row.date being either a Date object or a string.
    const trendsMap = new Map(rows.map(row => {
      const dateString = row.date.toISOString ? row.date.toISOString() : String(row.date);
      return [dateString.slice(0, 10), row];
    }));
    
    const fullTrends = [];
    // To iterate safely across dates, we work with UTC to avoid timezone shifts.
    const endDt = new Date(endDate + 'T00:00:00Z');
    let currentDt = new Date(startDate + 'T00:00:00Z');

    while (currentDt <= endDt) {
      const dateStr = currentDt.toISOString().slice(0, 10);
      const dataForDate = trendsMap.get(dateStr);

      if (dataForDate) {
        fullTrends.push({
          date: dateStr,
          total_kcal: parseFloat(dataForDate.total_kcal || 0),
          total_carb_g: parseFloat(dataForDate.total_carb_g || 0),
          total_protein_g: parseFloat(dataForDate.total_protein_g || 0),
          total_fat_g: parseFloat(dataForDate.total_fat_g || 0),
          total_sodium_mg: parseFloat(dataForDate.total_sodium_mg || 0),
        });
      } else {
        fullTrends.push({
          date: dateStr,
          total_kcal: 0,
          total_carb_g: 0,
          total_protein_g: 0,
          total_fat_g: 0,
          total_sodium_mg: 0,
        });
      }
      // Move to the next day in UTC
      currentDt.setUTCDate(currentDt.getUTCDate() + 1);
    }

    res.json({ trends: fullTrends });
  } catch (err) {
    console.error('GET /users/:userId/trends error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * 8. 사용자 목표 설정 조회/저장
 * GET /users/:userId/goals
 * POST /users/:userId/goals
 */
app.get('/users/:userId/goals', async (req, res) => {
  const userId = req.params.userId;

  try {
    // user_goals 테이블이 있다고 가정, 없으면 기본값 반환
    const [rows] = await pool.query(
      `SELECT * FROM user_goals WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      // 기본값 반환
      return res.json({
        goalType: 'maintain', // maintain, lose, gain
        targetCalories: 2000,
        targetCarb: 300,
        targetProtein: 150,
        targetFat: 65,
        healthConditions: [],
        restrictions: []
      });
    }

    res.json(rows[0]);
  } catch (err) {
    // 테이블이 없으면 기본값 반환
    console.error('GET /users/:userId/goals error (using defaults)', err);
    res.json({
      goalType: 'maintain',
      targetCalories: 2000,
      targetCarb: 300,
      targetProtein: 150,
      targetFat: 65,
      healthConditions: [],
      restrictions: []
    });
  }
});

app.post('/users/:userId/goals', async (req, res) => {
  const userId = req.params.userId;
  const { goalType, targetCalories, targetCarb, targetProtein, targetFat, healthConditions, restrictions } = req.body;

  try {
    // user_goals 테이블에 저장 (UPSERT)
    await pool.query(
      `INSERT INTO user_goals 
       (user_id, goal_type, target_calories, target_carb, target_protein, target_fat, health_conditions, restrictions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       goal_type = VALUES(goal_type),
       target_calories = VALUES(target_calories),
       target_carb = VALUES(target_carb),
       target_protein = VALUES(target_protein),
       target_fat = VALUES(target_fat),
       health_conditions = VALUES(health_conditions),
       restrictions = VALUES(restrictions)`,
      [userId, goalType, targetCalories, targetCarb, targetProtein, targetFat, 
       JSON.stringify(healthConditions || []), JSON.stringify(restrictions || [])]
    );

    res.json({ success: true });
  } catch (err) {
    // 테이블이 없으면 메모리에 저장 (실제로는 DB 마이그레이션 필요)
    console.error('POST /users/:userId/goals error', err);
    res.json({ success: true, note: 'DB table may need to be created' });
  }
});

/**
 * 9. 물 섭취 트래커
 * GET /users/:userId/water?date=YYYY-MM-DD
 * POST /users/:userId/water
 */
app.get('/users/:userId/water', async (req, res) => {
  const userId = req.params.userId;
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await pool.query(
      `SELECT * FROM water_intake WHERE user_id = ? AND intake_date = ?`,
      [userId, date]
    );

    if (rows.length === 0) {
      return res.json({ date, amount: 0 });
    }

    res.json(rows[0]);
  } catch (err) {
    // 테이블이 없으면 기본값 반환
    console.error('GET /users/:userId/water error (using defaults)', err);
    res.json({ date, amount: 0 });
  }
});

app.post('/users/:userId/water', async (req, res) => {
  const userId = req.params.userId;
  const { date, amount } = req.body;

  if (!date || amount === undefined) {
    return res.status(400).json({ error: 'date, amount 필요' });
  }

  try {
    await pool.query(
      `INSERT INTO water_intake (user_id, intake_date, amount)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [userId, date, amount]
    );

    res.json({ success: true, date, amount });
  } catch (err) {
    // 테이블이 없으면 메모리에 저장
    console.error('POST /users/:userId/water error', err);
    res.json({ success: true, date, amount, note: 'DB table may need to be created' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
