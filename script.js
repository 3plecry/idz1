const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Парсить святкові дні (підтримує YYYY-MM-DD та YYYY.MM.DD)
 */
function parseHolidays() {
    const text = document.getElementById('holidays').value.trim();
    if (!text) return [];

    return text
        .split(/[\n,;\s]+/)
        .map(s => s.trim())
        .map(s => s.replace(/\./g, '-'))  // 2020.08.24 → 2020-08-24
        .filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s));
}

/**
 * Надійна перевірка святкового дня (локальна дата)
 */
function isHoliday(date, holidays) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return holidays.includes(dateString);
}

/**
 * Чи є дата неділею
 */
function isSunday(date) {
    return date.getDay() === 0;
}

/**
 * Основна функція розрахунку
 */
function calculateVacation() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const durationInput = document.getElementById('duration').value;
    const holidays = parseHolidays();
    const output = document.getElementById('resultOutput');

    let warnings = [];

    const startDate = startDateInput ? new Date(startDateInput) : null;
    const endDate = endDateInput ? new Date(endDateInput) : null;
    const duration = durationInput ? parseInt(durationInput, 10) : null;

    let mode = 0; // 1: тривалість, 2: початок, 3: кінець

    if (startDate && endDate && !durationInput) mode = 1;
    else if (endDate && duration && !startDateInput) mode = 2;
    else if (startDate && duration && !endDateInput) mode = 3;
    else {
        output.innerHTML = "🔻 Помилка: Введіть хоча б два параметри.";
        return;
    }

    // Перевірка валідності
    if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
        output.innerHTML = "🔻 Помилка: Некоректний формат дати.";
        return;
    }
    if (duration !== null && (isNaN(duration) || duration <= 0)) {
        output.innerHTML = "🔻 Помилка: Тривалість має бути позитивним числом.";
        return;
    }

    let resultDate, resultDuration;

    switch (mode) {
        case 1: // Тривалість
            if (startDate > endDate) {
                output.innerHTML = "🔻 Помилка: Дата початку пізніше дати завершення.";
                return;
            }
            resultDuration = calculateDuration(startDate, endDate, holidays);
            output.innerHTML = `Тривалість відпустки: ${resultDuration} ${getNounCase(resultDuration)}`;
            break;

        case 2: // Дата початку
            resultDate = calculateStartDate(endDate, duration, holidays);
            output.innerHTML = `Розрахункова дата початку: ${formatDate(resultDate)}`;
            break;

        case 3: // Дата завершення
            resultDate = calculateEndDate(startDate, duration, holidays);
            output.innerHTML = `Розрахункова дата завершення: ${formatDate(resultDate)}`;
            break;
    }

    // === ВИЗНАЧЕННЯ ДАТ ДЛЯ ПЕРЕВІРКИ НА НЕДІЛЮ ===
    // В залежності від режиму визначаємо, які дати перевіряти
    let finalStartDate = mode === 2 ? resultDate : startDate;  // розрахований початок або введений
    let finalEndDate   = mode === 3 ? resultDate : endDate;    // розрахований кінець або введений

    // Якщо режим 1 (тривалість) — перевіряємо обидві введені дати
    if (mode === 1) {
        finalStartDate = startDate;
        finalEndDate = endDate;
    }

    // Додаємо попередження про неділю
    if (finalStartDate && isSunday(finalStartDate)) {
        warnings.push(`Дата початку (${formatDate(finalStartDate)}) припадає на неділю.`);
    }
    if (finalEndDate && isSunday(finalEndDate)) {
        warnings.push(`Дата завершення (${formatDate(finalEndDate)}) припадає на неділю.`);
    }

    // Вивід попереджень
    if (warnings.length > 0) {
        output.innerHTML += `<div class="warning" style="margin-top:15px; color:#e74c3c; font-weight:bold;">
            Увага:<br>• ${warnings.join('<br>• ')}
        </div>`;
    }
}

/**
 * Розрахунок тривалості (всі дні мінус свята)
 */
function calculateDuration(start, end, holidays) {
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
        if (!isHoliday(current, holidays)) {
            count++;
        }
        current = new Date(current.getTime() + MS_PER_DAY);
    }
    return count;
}

/**
 * Дата завершення
 */
function calculateEndDate(start, duration, holidays) {
    let daysLeft = duration;
    let current = new Date(start);

    while (daysLeft > 0) {
        if (!isHoliday(current, holidays)) {
            daysLeft--;
        }
        if (daysLeft > 0) {
            current = new Date(current.getTime() + MS_PER_DAY);
        }
    }
    return current;
}

/**
 * Дата початку
 */
function calculateStartDate(end, duration, holidays) {
    let daysLeft = duration;
    let current = new Date(end);

    while (daysLeft > 0) {
        if (!isHoliday(current, holidays)) {
            daysLeft--;
        }
        if (daysLeft > 0) {
            current = new Date(current.getTime() - MS_PER_DAY);
        }
    }
    return current;
}

/**
 * Формат дати DD.MM.YYYY
 */
function formatDate(date) {
    return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Відмінювання "день/дні/днів"
 */
function getNounCase(number) {
    if (number % 10 === 1 && number % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'дні';
    return 'днів';
}