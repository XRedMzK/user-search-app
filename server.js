const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Подключаемся к существующей БД users.db
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к SQLite БД users.db');
    }
});

// Статика
app.use(express.static(path.join(__dirname, 'public')));

// ===== Хелпер для поиска/сортировки =====

// GET /api/users/search
// Параметры (query):
//   registrationFrom: yyyy-mm-dd
//   registrationTo:   yyyy-mm-dd
//   token:            подстрока токена
//   minAge:           число
//   maxAge:           число
//   sortBy:           registration_date | nickname | age | token
//   sortDir:          asc | desc
//
app.get('/api/users/search', (req, res) => {
    const {
        registrationFrom,
        registrationTo,
        token,
        minAge,
        maxAge,
        sortBy,
        sortDir,
    } = req.query;

    const where = [];
    const params = [];

    // фильтр по дате регистрации
    if (registrationFrom) {
        where.push('registration_date >= ?');
        params.push(registrationFrom);
    }
    if (registrationTo) {
        where.push('registration_date <= ?');
        params.push(registrationTo);
    }

    // фильтр по токену (LIKE %...%)
    if (token) {
        where.push('token LIKE ?');
        params.push(`%${token}%`);
    }

    // фильтр по возрасту, считаем возраст по birth_date
    // age = (julianday('now') - julianday(birth_date)) / 365.25
    if (minAge) {
        where.push("( (julianday('now') - julianday(birth_date)) / 365.25 ) >= ?");
        params.push(parseFloat(minAge));
    }
    if (maxAge) {
        where.push("( (julianday('now') - julianday(birth_date)) / 365.25 ) <= ?");
        params.push(parseFloat(maxAge));
    }

    let whereClause = '';
    if (where.length > 0) {
        whereClause = 'WHERE ' + where.join(' AND ');
    }

    // сортировка
    let orderClause = 'ORDER BY id DESC'; // по умолчанию
    const dir = (sortDir && sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    if (sortBy === 'registration_date') {
        orderClause = `ORDER BY registration_date ${dir}`;
    } else if (sortBy === 'nickname') {
        orderClause = `ORDER BY nickname ${dir}`;
    } else if (sortBy === 'token') {
        orderClause = `ORDER BY token ${dir}`;
    } else if (sortBy === 'age') {
        orderClause = `ORDER BY ( (julianday('now') - julianday(birth_date)) / 365.25 ) ${dir}`;
    }

    const sql = `
    SELECT
      id,
      registration_date,
      nickname,
      birth_date,
      token,
      CAST( (julianday('now') - julianday(birth_date)) / 365.25 AS INT ) AS age
    FROM users
    ${whereClause}
    ${orderClause}
    LIMIT 500
  `;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Простой эндпоинт "все пользователи" (демо)
app.get('/api/users', (req, res) => {
    const sql = `
    SELECT
      id,
      registration_date,
      nickname,
      birth_date,
      token,
      CAST( (julianday('now') - julianday(birth_date)) / 365.25 AS INT ) AS age
    FROM users
    ORDER BY id DESC
    LIMIT 500
  `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Search UI available at http://localhost:${PORT}`);
});
