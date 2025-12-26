// Основной файл JavaScript для сайта "Пассажиры"

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ФУНКЦИИ ====================

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем текущую дату в шапке
    setCurrentDate();
    
    // Загружаем данные
    initializeData();
    
    // Инициализируем страницу в зависимости от того, на какой мы находимся
    initPage();
});

// Установка текущей даты
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateElements = document.querySelectorAll('#current-date');
    dateElements.forEach(el => {
        if (el) el.textContent = now.toLocaleDateString('ru-RU', options);
    });
}

// Инициализация данных
function initializeData() {
    // Если данных в localStorage нет, инициализируем моковыми данными
    if (!localStorage.getItem('passengersData')) {
        localStorage.setItem('passengersData', JSON.stringify(mockData));
        localStorage.setItem('waybills', JSON.stringify(mockWaybills));
        localStorage.setItem('trips', JSON.stringify(mockTrips));
    }
}

// Определяем, на какой странице мы находимся и инициализируем её
function initPage() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        initDashboardPage();
    } else if (path.includes('trips.html')) {
        initTripsPage();
    } else if (path.includes('reports.html')) {
        initReportsPage();
    }
}

// ==================== ГЛАВНАЯ СТРАНИЦА (ДАШБОРД) ====================

function initDashboardPage() {
    // Загрузка данных для дашборда
    loadDashboardData();
    
    // Обработчик изменения периода
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', loadDashboardData);
    }
}

function loadDashboardData() {
    const period = document.getElementById('period-select')?.value || 'month';
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Фильтруем путевые листы по периоду
    let filteredWaybills = filterWaybillsByPeriod(waybills, period);
    
    // Расчет метрик
    const totalPassengers = filteredWaybills.reduce((sum, w) => sum + w.passengers, 0);
    const totalRevenue = filteredWaybills.reduce((sum, w) => sum + w.revenue, 0);
    const totalTrips = [...new Set(filteredWaybills.map(w => w.tripId))].length;
    
    // Средняя загрузка
    let avgLoad = 0;
    if (filteredWaybills.length > 0) {
        const totalLoad = filteredWaybills.reduce((sum, w) => {
            const trip = trips.find(t => t.id === w.tripId);
            return sum + (trip ? (w.passengers / trip.seats * 100) : 0);
        }, 0);
        avgLoad = Math.round(totalLoad / filteredWaybills.length);
    }
    
    // Обновляем метрики на странице
    updateElementText('total-passengers', totalPassengers.toLocaleString('ru-RU'));
    updateElementText('total-revenue', `${totalRevenue.toLocaleString('ru-RU')} руб.`);
    updateElementText('total-trips', totalTrips);
    updateElementText('avg-load', `${avgLoad}%`);
    
    // Сегодняшние показатели
    const today = new Date().toISOString().split('T')[0];
    const todayWaybills = waybills.filter(w => w.date === today);
    const todayPassengers = todayWaybills.reduce((sum, w) => sum + w.passengers, 0);
    const todayRevenue = todayWaybills.reduce((sum, w) => sum + w.revenue, 0);
    
    updateElementText('today-passengers', todayPassengers);
    updateElementText('today-revenue', todayRevenue);
    
    // Топ направлений
    loadTopDirections(filteredWaybills, trips);
}

function filterWaybillsByPeriod(waybills, period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
        default:
            startDate = new Date(0); // Все время
    }
    
    return waybills.filter(w => {
        const waybillDate = new Date(w.date);
        return waybillDate >= startDate && waybillDate <= now;
    });
}

function loadTopDirections(waybills, trips) {
    // Группируем по направлениям
    const directionMap = {};
    
    waybills.forEach(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (trip) {
            if (!directionMap[trip.destination]) {
                directionMap[trip.destination] = {
                    passengers: 0,
                    revenue: 0
                };
            }
            directionMap[trip.destination].passengers += waybill.passengers;
            directionMap[trip.destination].revenue += waybill.revenue;
        }
    });
    
    // Преобразуем в массив и сортируем
    const directionsArray = Object.entries(directionMap)
        .map(([destination, data]) => ({
            destination,
            passengers: data.passengers,
            revenue: data.revenue
        }))
        .sort((a, b) => b.passengers - a.passengers)
        .slice(0, 5); // Берем топ-5
    
    // Отображаем на странице
    const container = document.getElementById('top-directions-list');
    if (container) {
        if (directionsArray.length === 0) {
            container.innerHTML = '<p class="loading">Нет данных за выбранный период</p>';
            return;
        }
        
        container.innerHTML = directionsArray.map(dir => `
            <div class="direction-item">
                <span class="direction-name">${dir.destination}</span>
                <span class="direction-passengers">${dir.passengers} пасс.</span>
            </div>
        `).join('');
    }
}

// ==================== СТРАНИЦА РЕЙСОВ И ПУТЕВЫХ ЛИСТОВ ====================

function initTripsPage() {
    // Устанавливаем сегодняшнюю дату в фильтре
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.value = today;
        dateFilter.max = today; // Нельзя выбрать будущую дату
    }
    
    // Загружаем активные рейсы
    loadActiveTrips();
    
    // Загружаем историю путевых листов
    loadWaybillsHistory();
    
    // Инициализируем форму создания путевого листа
    initWaybillForm();
    
    // Обработчики событий
    document.getElementById('addWaybillBtn')?.addEventListener('click', showWaybillForm);
    document.getElementById('cancelWaybillBtn')?.addEventListener('click', hideWaybillForm);
    document.getElementById('applyFilterBtn')?.addEventListener('click', loadWaybillsHistory);
    document.getElementById('createWaybillForm')?.addEventListener('submit', handleCreateWaybill);
    
    // Авторасчет выручки
    const passengersInput = document.getElementById('passengers-count');
    const fareInput = document.getElementById('fare');
    const revenueInput = document.getElementById('revenue');
    
    if (passengersInput && fareInput && revenueInput) {
        const calculateRevenue = () => {
            const passengers = parseInt(passengersInput.value) || 0;
            const fare = parseInt(fareInput.value) || 0;
            revenueInput.value = passengers * fare;
        };
        
        passengersInput.addEventListener('input', calculateRevenue);
        fareInput.addEventListener('input', calculateRevenue);
    }
}

function loadActiveTrips() {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const activeTripsContainer = document.getElementById('active-trips');
    
    if (!activeTripsContainer) return;
    
    // Фильтруем активные рейсы (можно добавить логику для проверки расписания)
    const activeTrips = trips.filter(trip => trip.status === 'active').slice(0, 6);
    
    if (activeTrips.length === 0) {
        activeTripsContainer.innerHTML = '<p class="loading">Нет активных рейсов на сегодня</p>';
        return;
    }
    
    activeTripsContainer.innerHTML = activeTrips.map(trip => `
        <div class="trip-card">
            <div class="trip-header">
                <span class="trip-number">Рейс ${trip.number}</span>
                <span class="trip-status status-active">Активен</span>
            </div>
            <div class="trip-info">
                <div class="trip-info-item">
                    <span class="trip-label">Направление</span>
                    <span class="trip-value">${trip.destination}</span>
                </div>
                <div class="trip-info-item">
                    <span class="trip-label">Время</span>
                    <span class="trip-value">${trip.departureTime}</span>
                </div>
                <div class="trip-info-item">
                    <span class="trip-label">Автобус</span>
                    <span class="trip-value">${trip.bus}</span>
                </div>
                <div class="trip-info-item">
                    <span class="trip-label">Водитель</span>
                    <span class="trip-value">${trip.driver}</span>
                </div>
            </div>
            <div class="trip-actions">
                <button class="btn-primary btn-small" onclick="createWaybillForTrip('${trip.id}')">
                    <i class="fas fa-plus"></i> Путевой лист
                </button>
                <button class="btn-secondary btn-small" onclick="viewTripDetails('${trip.id}')">
                    <i class="fas fa-eye"></i> Подробнее
                </button>
            </div>
        </div>
    `).join('');
}

function loadWaybillsHistory() {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const dateFilter = document.getElementById('date-filter')?.value;
    
    // Фильтрация по дате
    let filteredWaybills = waybills;
    if (dateFilter) {
        filteredWaybills = waybills.filter(w => w.date === dateFilter);
    }
    
    // Сортировка по дате (новые сначала)
    filteredWaybills.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('waybills-history');
    const totalElement = document.getElementById('total-waybills');
    
    if (!container) return;
    
    if (filteredWaybills.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="loading">Нет путевых листов за выбранную дату</td>
            </tr>
        `;
        if (totalElement) totalElement.textContent = '0';
        return;
    }
    
    container.innerHTML = filteredWaybills.map(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (!trip) return '';
        
        const loadPercentage = Math.round((waybill.passengers / trip.seats) * 100);
        const loadClass = loadPercentage < 30 ? 'low-load' : 
                         loadPercentage < 70 ? 'medium-load' : 'high-load';
        
        return `
            <tr>
                <td>${formatDate(waybill.date)}</td>
                <td>Рейс ${trip.number}</td>
                <td>${trip.destination}</td>
                <td>${waybill.passengers}</td>
                <td>${waybill.revenue.toLocaleString('ru-RU')} руб.</td>
                <td>${waybill.fare} руб.</td>
                <td><span class="${loadClass}">${loadPercentage}%</span></td>
                <td>
                    <button class="btn-icon" title="Просмотреть" onclick="viewWaybillDetails('${waybill.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" title="Редактировать" onclick="editWaybill('${waybill.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    if (totalElement) totalElement.textContent = filteredWaybills.length;
}

function initWaybillForm() {
    const tripSelect = document.getElementById('trip-select');
    const dateInput = document.getElementById('waybill-date');
    
    if (!tripSelect || !dateInput) return;
    
    // Устанавливаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
    
    // Загружаем активные рейсы в выпадающий список
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const activeTrips = trips.filter(trip => trip.status === 'active');
    
    tripSelect.innerHTML = '<option value="">-- Выберите рейс --</option>' +
        activeTrips.map(trip => `
            <option value="${trip.id}" data-fare="${trip.fare || 500}">
                Рейс ${trip.number} - ${trip.destination} (${trip.departureTime})
            </option>
        `).join('');
    
    // При выборе рейса устанавливаем тариф по умолчанию
    tripSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const fare = selectedOption?.dataset.fare || 500;
        document.getElementById('fare').value = fare;
        
        // Пересчитываем выручку
        const passengersInput = document.getElementById('passengers-count');
        if (passengersInput && passengersInput.value) {
            document.getElementById('revenue').value = parseInt(passengersInput.value) * fare;
        }
    });
}

function showWaybillForm() {
    document.getElementById('waybill-form').style.display = 'block';
    window.scrollTo({ top: document.getElementById('waybill-form').offsetTop - 100, behavior: 'smooth' });
}

function hideWaybillForm() {
    document.getElementById('waybill-form').style.display = 'none';
    document.getElementById('createWaybillForm').reset();
}

function createWaybillForTrip(tripId) {
    showWaybillForm();
    const tripSelect = document.getElementById('trip-select');
    if (tripSelect) {
        tripSelect.value = tripId;
        tripSelect.dispatchEvent(new Event('change'));
    }
}

function handleCreateWaybill(event) {
    event.preventDefault();
    
    const tripId = document.getElementById('trip-select').value;
    const date = document.getElementById('waybill-date').value;
    const passengers = parseInt(document.getElementById('passengers-count').value);
    const fare = parseInt(document.getElementById('fare').value);
    const revenue = parseInt(document.getElementById('revenue').value);
    const notes = document.getElementById('notes').value;
    
    if (!tripId || !date || isNaN(passengers) || isNaN(fare) || isNaN(revenue)) {
        alert('Пожалуйста, заполните все обязательные поля корректно!');
        return;
    }
    
    // Получаем существующие путевые листы
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    
    // Создаем новый путевой лист
    const newWaybill = {
        id: generateId(),
        tripId: tripId,
        date: date,
        passengers: passengers,
        fare: fare,
        revenue: revenue,
        notes: notes,
        createdAt: new Date().toISOString()
    };
    
    // Добавляем и сохраняем
    waybills.push(newWaybill);
    localStorage.setItem('waybills', JSON.stringify(waybills));
    
    // Показываем уведомление
    alert('Путевой лист успешно создан!');
    
    // Скрываем форму и обновляем таблицу
    hideWaybillForm();
    loadWaybillsHistory();
    
    // Обновляем данные на главной странице
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadDashboardData();
    }
}

function viewWaybillDetails(waybillId) {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    const waybill = waybills.find(w => w.id === waybillId);
    if (!waybill) return;
    
    const trip = trips.find(t => t.id === waybill.tripId);
    if (!trip) return;
    
    const loadPercentage = Math.round((waybill.passengers / trip.seats) * 100);
    
    const modal = document.getElementById('waybill-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('deleteWaybillBtn');
    const editBtn = document.getElementById('editWaybillBtn');
    
    if (!modal || !modalBody || !modalTitle) return;
    
    modalTitle.textContent = `Путевой лист от ${formatDate(waybill.date)}`;
    
    modalBody.innerHTML = `
        <div class="waybill-details">
            <div class="detail-row">
                <span class="detail-label">Рейс:</span>
                <span class="detail-value">${trip.number} - ${trip.destination}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Дата:</span>
                <span class="detail-value">${formatDate(waybill.date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Время отправления:</span>
                <span class="detail-value">${trip.departureTime}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Автобус:</span>
                <span class="detail-value">${trip.bus}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Водитель:</span>
                <span class="detail-value">${trip.driver}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Кол-во пассажиров:</span>
                <span class="detail-value">${waybill.passengers} из ${trip.seats}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Загрузка:</span>
                <span class="detail-value">${loadPercentage}%</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Тариф:</span>
                <span class="detail-value">${waybill.fare} руб.</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Выручка:</span>
                <span class="detail-value">${waybill.revenue.toLocaleString('ru-RU')} руб.</span>
            </div>
            ${waybill.notes ? `
            <div class="detail-row">
                <span class="detail-label">Примечания:</span>
                <span class="detail-value">${waybill.notes}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Настройка кнопок
    deleteBtn.style.display = 'inline-block';
    editBtn.style.display = 'inline-block';
    
    deleteBtn.onclick = function() {
        if (confirm('Вы уверены, что хотите удалить этот путевой лист?')) {
            deleteWaybill(waybillId);
        }
    };
    
    editBtn.onclick = function() {
        editWaybill(waybillId);
    };
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Закрытие модального окна
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.onclick = function() {
            modal.style.display = 'none';
        };
    });
    
    // Закрытие по клику вне окна
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function deleteWaybill(waybillId) {
    let waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    waybills = waybills.filter(w => w.id !== waybillId);
    localStorage.setItem('waybills', JSON.stringify(waybills));
    
    // Закрываем модальное окно
    document.getElementById('waybill-modal').style.display = 'none';
    
    // Обновляем таблицу
    loadWaybillsHistory();
    
    // Обновляем дашборд
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadDashboardData();
    }
    
    alert('Путевой лист удален!');
}

function editWaybill(waybillId) {
    // В реальном приложении здесь была бы форма редактирования
    alert('Функция редактирования в разработке. Пока можно удалить и создать новый.');
}

function viewTripDetails(tripId) {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip) return;
    
    const modal = document.getElementById('waybill-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('deleteWaybillBtn');
    const editBtn = document.getElementById('editWaybillBtn');
    
    if (!modal || !modalBody || !modalTitle) return;
    
    modalTitle.textContent = `Рейс ${trip.number}`;
    
    modalBody.innerHTML = `
        <div class="trip-details">
            <div class="detail-row">
                <span class="detail-label">Направление:</span>
                <span class="detail-value">${trip.destination}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Время отправления:</span>
                <span class="detail-value">${trip.departureTime}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Автобус:</span>
                <span class="detail-value">${trip.bus}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Гос. номер:</span>
                <span class="detail-value">${trip.busNumber}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Водитель:</span>
                <span class="detail-value">${trip.driver}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Количество мест:</span>
                <span class="detail-value">${trip.seats}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Тариф:</span>
                <span class="detail-value">${trip.fare || 500} руб.</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Статус:</span>
                <span class="detail-value ${trip.status === 'active' ? 'status-active' : 'status-completed'}">${trip.status === 'active' ? 'Активен' : 'Завершен'}</span>
            </div>
        </div>
    `;
    
    // Скрываем ненужные кнопки
    deleteBtn.style.display = 'none';
    editBtn.style.display = 'none';
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Закрытие модального окна
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.onclick = function() {
            modal.style.display = 'none';
        };
    });
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// ==================== СТРАНИЦА ОТЧЕТОВ ====================

function initReportsPage() {
    // Настройка навигации по отчетам
    setupReportsNavigation();
    
    // Загрузка первого отчета (пассажиропотоки)
    loadPassengerFlowReport();
    
    // Инициализация фильтров
    initReportFilters();
    
    // Обработчики событий
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
    document.getElementById('exportReportBtn')?.addEventListener('click', exportReport);
    
    // Показываем произвольный диапазон дат при выборе соответствующей опции
    const periodSelect = document.getElementById('report-period-select');
    const customDateRange = document.getElementById('custom-date-range');
    
    if (periodSelect && customDateRange) {
        periodSelect.addEventListener('change', function() {
            customDateRange.style.display = this.value === 'custom' ? 'flex' : 'none';
        });
    }
}

function setupReportsNavigation() {
    const navLinks = document.querySelectorAll('.report-nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем активный класс у всех ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            this.classList.add('active');
            
            // Скрываем все разделы отчетов
            document.querySelectorAll('.report-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Показываем выбранный раздел
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // Загружаем данные для этого отчета
                switch(targetId) {
                    case 'passenger-flow':
                        loadPassengerFlowReport();
                        break;
                    case 'directions':
                        loadDirectionsLoadReport();
                        break;
                    case 'trips-load':
                        loadTripsLoadReport();
                        break;
                    case 'money':
                        loadMoneyReport();
                        break;
                }
            }
        });
    });
}

function initReportFilters() {
    // Заполняем выпадающий список направлений
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const directionSelect = document.getElementById('direction-select');
    
    if (directionSelect) {
        // Получаем уникальные направления
        const directions = [...new Set(trips.map(t => t.destination))];
        
        directionSelect.innerHTML = '<option value="all">Все направления</option>' +
            directions.map(dir => `<option value="${dir}">${dir}</option>`).join('');
    }
    
    // Устанавливаем даты по умолчанию для произвольного диапазона
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) startDateInput.value = monthAgoStr;
    if (endDateInput) endDateInput.value = today;
}

function generateReport() {
    // Определяем, какой отчет активен
    const activeLink = document.querySelector('.report-nav-link.active');
    if (!activeLink) return;
    
    const reportType = activeLink.getAttribute('href').substring(1);
    
    // Загружаем соответствующий отчет
    switch(reportType) {
        case 'passenger-flow':
            loadPassengerFlowReport();
            break;
        case 'directions':
            loadDirectionsLoadReport();
            break;
        case 'trips-load':
            loadTripsLoadReport();
            break;
        case 'money':
            loadMoneyReport();
            break;
    }
}

function loadPassengerFlowReport() {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Фильтруем по периоду
    const filteredWaybills = filterWaybillsForReport(waybills);
    
    // Группируем по направлениям
    const flowData = {};
    
    filteredWaybills.forEach(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (trip) {
            if (!flowData[trip.destination]) {
                flowData[trip.destination] = {
                    passengers: 0,
                    revenue: 0
                };
            }
            flowData[trip.destination].passengers += waybill.passengers;
            flowData[trip.destination].revenue += waybill.revenue;
        }
    });
    
    // Преобразуем в массив и сортируем
    const flowArray = Object.entries(flowData)
        .map(([destination, data]) => ({
            destination,
            passengers: data.passengers,
            revenue: data.revenue
        }))
        .sort((a, b) => b.passengers - a.passengers);
    
    // Обновляем таблицу
    const tableBody = document.getElementById('passenger-flow-table');
    const totalPassengersElement = document.getElementById('total-flow-passengers');
    const totalRevenueElement = document.getElementById('total-flow-revenue');
    
    if (tableBody) {
        if (flowArray.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading">Нет данных за выбранный период</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = flowArray.map(item => {
            const totalPassengers = flowArray.reduce((sum, i) => sum + i.passengers, 0);
            const percentage = totalPassengers > 0 ? 
                Math.round((item.passengers / totalPassengers) * 100) : 0;
            
            return `
                <tr>
                    <td>${item.destination}</td>
                    <td>${item.passengers.toLocaleString('ru-RU')}</td>
                    <td>${percentage}%</td>
                    <td>${item.revenue.toLocaleString('ru-RU')} руб.</td>
                </tr>
            `;
        }).join('');
        
        // Обновляем итоги
        const totalPassengers = flowArray.reduce((sum, item) => sum + item.passengers, 0);
        const totalRevenue = flowArray.reduce((sum, item) => sum + item.revenue, 0);
        
        if (totalPassengersElement) totalPassengersElement.textContent = totalPassengers.toLocaleString('ru-RU');
        if (totalRevenueElement) totalRevenueElement.textContent = `${totalRevenue.toLocaleString('ru-RU')} руб.`;
    }
    
    // Строим график
    createPassengerFlowChart(flowArray);
}

function loadDirectionsLoadReport() {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Фильтруем по периоду
    const filteredWaybills = filterWaybillsForReport(waybills);
    
    // Получаем выбранное направление
    const directionSelect = document.getElementById('direction-select');
    const selectedDirection = directionSelect?.value || 'all';
    
    // Группируем по направлениям
    const directionsData = {};
    
    filteredWaybills.forEach(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (trip && (selectedDirection === 'all' || trip.destination === selectedDirection)) {
            if (!directionsData[trip.destination]) {
                directionsData[trip.destination] = {
                    trips: 0,
                    passengers: 0,
                    seats: 0,
                    revenue: 0
                };
            }
            directionsData[trip.destination].trips += 1;
            directionsData[trip.destination].passengers += waybill.passengers;
            directionsData[trip.destination].seats += trip.seats;
            directionsData[trip.destination].revenue += waybill.revenue;
        }
    });
    
    // Преобразуем в массив
    const directionsArray = Object.entries(directionsData)
        .map(([destination, data]) => {
            const avgPassengers = data.trips > 0 ? data.passengers / data.trips : 0;
            const loadPercentage = data.seats > 0 ? Math.round((data.passengers / data.seats) * 100) : 0;
            const avgRevenue = data.trips > 0 ? data.revenue / data.trips : 0;
            
            return {
                destination,
                trips: data.trips,
                avgPassengers: Math.round(avgPassengers),
                seats: data.seats,
                loadPercentage,
                avgRevenue: Math.round(avgRevenue)
            };
        })
        .sort((a, b) => b.loadPercentage - a.loadPercentage);
    
    // Обновляем таблицу
    const tableBody = document.getElementById('directions-load-table');
    
    if (tableBody) {
        if (directionsArray.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">Нет данных за выбранный период</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = directionsArray.map(item => `
            <tr>
                <td>${item.destination}</td>
                <td>${item.trips}</td>
                <td>${item.avgPassengers}</td>
                <td>${item.seats}</td>
                <td>
                    <div class="load-bar-container">
                        <div class="load-bar" style="width: ${item.loadPercentage}%; 
                            background-color: ${getLoadColor(item.loadPercentage)};">
                        </div>
                        <span>${item.loadPercentage}%</span>
                    </div>
                </td>
                <td>${item.avgRevenue.toLocaleString('ru-RU')} руб.</td>
            </tr>
        `).join('');
    }
    
    // Строим график
    createDirectionsLoadChart(directionsArray);
}

function loadTripsLoadReport() {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Фильтруем по периоду
    const filteredWaybills = filterWaybillsForReport(waybills);
    
    // Фильтруем по поисковому запросу
    const filterInput = document.getElementById('trip-filter');
    const filterValue = filterInput?.value.toLowerCase() || '';
    
    // Собираем данные по рейсам
    const tripsData = [];
    
    filteredWaybills.forEach(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (trip) {
            // Применяем фильтр
            if (filterValue && 
                !trip.number.toLowerCase().includes(filterValue) && 
                !trip.destination.toLowerCase().includes(filterValue)) {
                return;
            }
            
            const loadPercentage = Math.round((waybill.passengers / trip.seats) * 100);
            
            tripsData.push({
                number: trip.number,
                destination: trip.destination,
                date: waybill.date,
                departureTime: trip.departureTime,
                passengers: waybill.passengers,
                seats: trip.seats,
                loadPercentage,
                driver: trip.driver,
                status: 'Завершен'
            });
        }
    });
    
    // Сортируем по дате (новые сначала)
    tripsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Обновляем таблицу
    const tableBody = document.getElementById('trips-load-table');
    
    if (tableBody) {
        if (tripsData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading">Нет данных за выбранный период</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = tripsData.map(trip => `
            <tr>
                <td>Рейс ${trip.number}</td>
                <td>${trip.destination}</td>
                <td>${formatDate(trip.date)}</td>
                <td>${trip.departureTime}</td>
                <td>${trip.passengers}</td>
                <td>${trip.seats}</td>
                <td>
                    <span style="color: ${getLoadColor(trip.loadPercentage)}; font-weight: 600;">
                        ${trip.loadPercentage}%
                    </span>
                </td>
                <td>${trip.driver}</td>
                <td><span class="status-completed">${trip.status}</span></td>
            </tr>
        `).join('');
    }
    
    // Обработчик для кнопки фильтра
    const applyFilterBtn = document.getElementById('applyTripFilter');
    if (applyFilterBtn) {
        applyFilterBtn.onclick = loadTripsLoadReport;
    }
    
    // Обработчик для ввода с клавиатуры
    if (filterInput) {
        filterInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadTripsLoadReport();
            }
        });
    }
}

function loadMoneyReport() {
    const waybills = JSON.parse(localStorage.getItem('waybills') || '[]');
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    // Фильтруем по периоду
    const filteredWaybills = filterWaybillsForReport(waybills);
    
    // Получаем тип сортировки
    const sortSelect = document.getElementById('money-sort');
    const sortType = sortSelect?.value || 'revenue';
    
    // Собираем финансовые данные
    const moneyData = [];
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalPassengers = 0;
    
    filteredWaybills.forEach(waybill => {
        const trip = trips.find(t => t.id === waybill.tripId);
        if (trip) {
            // В реальном приложении затраты хранились бы в отдельной таблице
            // Здесь используем примерную логику расчета
            const costs = Math.round(waybill.revenue * 0.6); // 60% от выручки - примерные затраты
            const profit = waybill.revenue - costs;
            const avgCheck = waybill.passengers > 0 ? Math.round(waybill.revenue / waybill.passengers) : 0;
            const profitability = waybill.revenue > 0 ? Math.round((profit / waybill.revenue) * 100) : 0;
            
            moneyData.push({
                number: trip.number,
                destination: trip.destination,
                date: waybill.date,
                revenue: waybill.revenue,
                costs: costs,
                profit: profit,
                avgCheck: avgCheck,
                profitability: profitability
            });
            
            totalRevenue += waybill.revenue;
            totalCosts += costs;
            totalPassengers += waybill.passengers;
        }
    });
    
    // Сортируем
    moneyData.sort((a, b) => {
        switch(sortType) {
            case 'revenue': return b.revenue - a.revenue;
            case 'profit': return b.profit - a.profit;
            case 'trip': return a.number.localeCompare(b.number);
            default: return b.revenue - a.revenue;
        }
    });
    
    // Обновляем таблицу
    const tableBody = document.getElementById('money-table');
    const totalRevenueElement = document.getElementById('total-money-revenue');
    const totalCostsElement = document.getElementById('total-money-costs');
    const totalProfitElement = document.getElementById('total-money-profit');
    
    if (tableBody) {
        if (moneyData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">Нет данных за выбранный период</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = moneyData.map(item => {
            const profitabilityClass = item.profitability >= 30 ? 'high-profit' : 
                                     item.profitability >= 10 ? 'medium-profit' : 'low-profit';
            
            return `
                <tr>
                    <td>Рейс ${item.number}</td>
                    <td>${item.destination}</td>
                    <td>${formatDate(item.date)}</td>
                    <td>${item.revenue.toLocaleString('ru-RU')} руб.</td>
                    <td>${item.costs.toLocaleString('ru-RU')} руб.</td>
                    <td style="color: ${item.profit >= 0 ? '#1cc88a' : '#e74a3b'}; font-weight: 600;">
                        ${item.profit.toLocaleString('ru-RU')} руб.
                    </td>
                    <td>${item.avgCheck.toLocaleString('ru-RU')} руб.</td>
                    <td><span class="${profitabilityClass}">${item.profitability}%</span></td>
                </tr>
            `;
        }).join('');
        
        // Обновляем итоги
        const totalProfit = totalRevenue - totalCosts;
        const avgCheck = totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0;
        
        if (totalRevenueElement) totalRevenueElement.textContent = `${totalRevenue.toLocaleString('ru-RU')} руб.`;
        if (totalCostsElement) totalCostsElement.textContent = `${totalCosts.toLocaleString('ru-RU')} руб.`;
        if (totalProfitElement) totalProfitElement.textContent = `${totalProfit.toLocaleString('ru-RU')} руб.`;
        
        // Обновляем сводку
        updateElementText('total-revenue-summary', `${totalRevenue.toLocaleString('ru-RU')} руб.`);
        updateElementText('avg-check', `${avgCheck.toLocaleString('ru-RU')} руб.`);
        updateElementText('total-profit', `${totalProfit.toLocaleString('ru-RU')} руб.`);
    }
    
    // Строим график
    createMoneyChart(moneyData.slice(0, 10)); // Показываем топ-10 по выручке
}

function filterWaybillsForReport(waybills) {
    const periodSelect = document.getElementById('report-period-select');
    const period = periodSelect?.value || 'month';
    
    const now = new Date();
    let startDate;
    let endDate = now;
    
    switch(period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'custom':
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
                startDate = new Date(startDateInput.value);
                endDate = new Date(endDateInput.value);
                endDate.setHours(23, 59, 59, 999);
            } else {
                // По умолчанию - последний месяц
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
            }
            break;
        default:
            startDate = new Date(0); // Все время
    }
    
    return waybills.filter(w => {
        const waybillDate = new Date(w.date);
        return waybillDate >= startDate && waybillDate <= endDate;
    });
}

// ==================== ГРАФИКИ ====================

function createPassengerFlowChart(data) {
    const ctx = document.getElementById('passengerFlowChart');
    if (!ctx) return;
    
    // Если уже есть график, уничтожаем его
    if (window.passengerFlowChart) {
        window.passengerFlowChart.destroy();
    }
    
    const labels = data.map(item => item.destination);
    const passengers = data.map(item => item.passengers);
    const revenues = data.map(item => item.revenue);
    
    // Определяем цвета
    const backgroundColors = [
        'rgba(78, 154, 241, 0.7)',
        'rgba(28, 200, 138, 0.7)',
        'rgba(246, 194, 62, 0.7)',
        'rgba(231, 74, 59, 0.7)',
        'rgba(108, 117, 125, 0.7)',
        'rgba(54, 185, 204, 0.7)',
        'rgba(155, 89, 182, 0.7)'
    ];
    
    window.passengerFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Количество пассажиров',
                    data: passengers,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                },
                {
                    label: 'Выручка (тыс. руб.)',
                    data: revenues.map(r => Math.round(r / 1000)),
                    backgroundColor: 'rgba(201, 203, 207, 0.5)',
                    borderColor: 'rgba(201, 203, 207, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Количество пассажиров'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Выручка (тыс. руб.)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y.toLocaleString('ru-RU') + ' пасс.';
                            } else {
                                label += context.parsed.y.toLocaleString('ru-RU') + ' тыс. руб.';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function createDirectionsLoadChart(data) {
    const ctx = document.getElementById('directionsLoadChart');
    if (!ctx) return;
    
    if (window.directionsLoadChart) {
        window.directionsLoadChart.destroy();
    }
    
    const labels = data.map(item => item.destination);
    const loadPercentages = data.map(item => item.loadPercentage);
    
    // Определяем цвета в зависимости от загрузки
    const backgroundColors = loadPercentages.map(p => getLoadColor(p, 0.7));
    const borderColors = loadPercentages.map(p => getLoadColor(p, 1));
    
    window.directionsLoadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Процент загрузки',
                data: loadPercentages,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Загрузка, %'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Загрузка: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

function createMoneyChart(data) {
    const ctx = document.getElementById('moneyChart');
    if (!ctx) return;
    
    if (window.moneyChart) {
        window.moneyChart.destroy();
    }
    
    const labels = data.map(item => `Рейс ${item.number}`);
    const revenues = data.map(item => item.revenue);
    const profits = data.map(item => item.profit);
    
    window.moneyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Выручка',
                    data: revenues,
                    backgroundColor: 'rgba(78, 154, 241, 0.7)',
                    borderColor: 'rgba(78, 154, 241, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Прибыль',
                    data: profits,
                    backgroundColor: 'rgba(28, 200, 138, 0.7)',
                    borderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Сумма, руб.'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('ru-RU') + ' руб.';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toLocaleString('ru-RU') + ' руб.';
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getLoadColor(percentage, alpha = 1) {
    if (percentage < 30) {
        return alpha === 1 ? '#e74a3b' : `rgba(231, 74, 59, ${alpha})`;
    } else if (percentage < 70) {
        return alpha === 1 ? '#f6c23e' : `rgba(246, 194, 62, ${alpha})`;
    } else {
        return alpha === 1 ? '#1cc88a' : `rgba(28, 200, 138, ${alpha})`;
    }
}

function exportReport() {
    alert('В реальном приложении здесь был бы экспорт в Excel/PDF. Пока можно сделать скриншот.');
    // В реальном приложении здесь была бы логика экспорта с использованием библиотек
    // Например, SheetJS для Excel или jsPDF для PDF
}

// Стили для загрузки в таблицах
document.head.insertAdjacentHTML('beforeend', `
<style>
.low-load { color: #e74a3b; font-weight: 600; }
.medium-load { color: #f6c23e; font-weight: 600; }
.high-load { color: #1cc88a; font-weight: 600; }
.high-profit { color: #1cc88a; font-weight: 600; }
.medium-profit { color: #f6c23e; font-weight: 600; }
.low-profit { color: #e74a3b; font-weight: 600; }
.load-bar-container {
    display: flex;
    align-items: center;
    gap: 10px;
}
.load-bar {
    height: 20px;
    border-radius: 10px;
    min-width: 5px;
}
.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}
.detail-row:last-child {
    border-bottom: none;
}
.detail-label {
    font-weight: 600;
    color: #555;
}
.detail-value {
    color: #333;
}
</style>
`);