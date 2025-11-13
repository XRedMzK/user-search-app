const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const regFromEl = document.getElementById('regFrom');
const regToEl = document.getElementById('regTo');
const tokenEl = document.getElementById('token');
const minAgeEl = document.getElementById('minAge');
const maxAgeEl = document.getElementById('maxAge');
const sortByEl = document.getElementById('sortBy');
const sortDirEl = document.getElementById('sortDir');

const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const loadAllBtn = document.getElementById('loadAllBtn');

searchBtn.addEventListener('click', () => {
    fetchUsersWithFilters();
});

resetBtn.addEventListener('click', () => {
    regFromEl.value = '';
    regToEl.value = '';
    tokenEl.value = '';
    minAgeEl.value = '';
    maxAgeEl.value = '';
    sortByEl.value = '';
    sortDirEl.value = 'desc';
    statusEl.textContent = 'Фильтры сброшены.';
    resultEl.innerHTML = '';
});

loadAllBtn.addEventListener('click', async () => {
    await fetchAllUsers();
});

// При заходе на страницу сразу показываем последние 500
fetchAllUsers();

async function fetchUsersWithFilters() {
    setButtonsDisabled(true);
    statusEl.textContent = 'Загружаем данные...';

    const params = new URLSearchParams();

    if (regFromEl.value) params.append('registrationFrom', regFromEl.value);
    if (regToEl.value) params.append('registrationTo', regToEl.value);
    if (tokenEl.value.trim()) params.append('token', tokenEl.value.trim());
    if (minAgeEl.value) params.append('minAge', minAgeEl.value);
    if (maxAgeEl.value) params.append('maxAge', maxAgeEl.value);
    if (sortByEl.value) params.append('sortBy', sortByEl.value);
    if (sortDirEl.value) params.append('sortDir', sortDirEl.value);

    try {
        const resp = await fetch('/api/users/search?' + params.toString());
        const data = await resp.json();

        if (!resp.ok) {
            statusEl.textContent = 'Ошибка: ' + (data.error || 'unknown');
            resultEl.innerHTML = '';
            return;
        }

        statusEl.textContent = `Найдено пользователей: ${data.length}`;
        renderUsersTable(data);
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Ошибка запроса.';
        resultEl.innerHTML = '';
    } finally {
        setButtonsDisabled(false);
    }
}

async function fetchAllUsers() {
    setButtonsDisabled(true);
    statusEl.textContent = 'Загружаем последние 500 пользователей...';

    try {
        const resp = await fetch('/api/users');
        const data = await resp.json();

        if (!resp.ok) {
            statusEl.textContent = 'Ошибка: ' + (data.error || 'unknown');
            resultEl.innerHTML = '';
            return;
        }

        statusEl.textContent = `Загружено пользователей: ${data.length}`;
        renderUsersTable(data);
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Ошибка запроса.';
        resultEl.innerHTML = '';
    } finally {
        setButtonsDisabled(false);
    }
}

function setButtonsDisabled(disabled) {
    searchBtn.disabled = disabled;
    resetBtn.disabled = disabled;
    loadAllBtn.disabled = disabled;
}

function renderUsersTable(users) {
    if (!users || users.length === 0) {
        resultEl.innerHTML = '<p class="status">Нет данных для отображения.</p>';
        return;
    }

    const rows = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.registration_date)}</td>
      <td>${escapeHtml(u.nickname)}</td>
      <td>
        <div class="age-badge">
          ${escapeHtml(u.birth_date)}
          <span>${Number.isFinite(u.age) ? `(${u.age} лет)` : ''}</span>
        </div>
      </td>
      <td class="token">${escapeHtml(u.token)}</td>
    </tr>
  `).join('');

    resultEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Дата регистрации</th>
          <th>Ник</th>
          <th>Дата рождения / возраст</th>
          <th>Токен</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Простая защита от XSS (данные всё равно из твоей БД)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
