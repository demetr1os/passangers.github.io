// Моковые данные для инициализации приложения

const mockTrips = [
    {
        id: 'trip-1',
        number: '101',
        destination: 'Москва',
        departureTime: '08:00',
        bus: 'ПАЗ-3205',
        busNumber: 'А123БВ',
        driver: 'Иванов И.И.',
        seats: 40,
        fare: 800,
        status: 'active'
    },
    {
        id: 'trip-2',
        number: '102',
        destination: 'Санкт-Петербург',
        departureTime: '09:30',
        bus: 'НефАЗ-5299',
        busNumber: 'В456ГД',
        driver: 'Петров П.П.',
        seats: 50,
        fare: 1200,
        status: 'active'
    },
    {
        id: 'trip-3',
        number: '103',
        destination: 'Казань',
        departureTime: '10:15',
        bus: 'ЛИАЗ-5292',
        busNumber: 'Е789ЖЗ',
        driver: 'Сидоров С.С.',
        seats: 45,
        fare: 900,
        status: 'active'
    },
    {
        id: 'trip-4',
        number: '104',
        destination: 'Нижний Новгород',
        departureTime: '12:00',
        bus: 'ПАЗ-3204',
        busNumber: 'И012КЛ',
        driver: 'Кузнецов К.К.',
        seats: 35,
        fare: 700,
        status: 'active'
    },
    {
        id: 'trip-5',
        number: '105',
        destination: 'Ростов-на-Дону',
        departureTime: '14:45',
        bus: 'МАЗ-206',
        busNumber: 'М345НО',
        driver: 'Смирнов С.С.',
        seats: 55,
        fare: 1500,
        status: 'active'
    },
    {
        id: 'trip-6',
        number: '106',
        destination: 'Волгоград',
        departureTime: '16:20',
        bus: 'ЛИАЗ-5256',
        busNumber: 'П678РС',
        driver: 'Васильев В.В.',
        seats: 48,
        fare: 1100,
        status: 'active'
    },
    {
        id: 'trip-7',
        number: '107',
        destination: 'Екатеринбург',
        departureTime: '18:00',
        bus: 'НефАЗ-5299',
        busNumber: 'Т901УФ',
        driver: 'Николаев Н.Н.',
        seats: 52,
        fare: 1800,
        status: 'completed'
    },
    {
        id: 'trip-8',
        number: '108',
        destination: 'Новосибирск',
        departureTime: '20:30',
        bus: 'ПАЗ-3205',
        busNumber: 'Х234ЦЧ',
        driver: 'Алексеев А.А.',
        seats: 40,
        fare: 2500,
        status: 'completed'
    }
];

const mockWaybills = [
    {
        id: 'wb-1',
        tripId: 'trip-1',
        date: new Date().toISOString().split('T')[0], // Сегодня
        passengers: 32,
        fare: 800,
        revenue: 25600,
        notes: 'Рейс выполнен по расписанию',
        createdAt: new Date().toISOString()
    },
    {
        id: 'wb-2',
        tripId: 'trip-2',
        date: new Date().toISOString().split('T')[0],
        passengers: 45,
        fare: 1200,
        revenue: 54000,
        notes: '',
        createdAt: new Date().toISOString()
    },
    {
        id: 'wb-3',
        tripId: 'trip-3',
        date: new Date().toISOString().split('T')[0],
        passengers: 38,
        fare: 900,
        revenue: 34200,
        notes: 'Дополнительный багаж: 3 места',
        createdAt: new Date().toISOString()
    },
    {
        id: 'wb-4',
        tripId: 'trip-4',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Вчера
        passengers: 28,
        fare: 700,
        revenue: 19600,
        notes: '',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'wb-5',
        tripId: 'trip-5',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        passengers: 50,
        fare: 1500,
        revenue: 75000,
        notes: 'Рейс задержан на 15 минут',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'wb-6',
        tripId: 'trip-6',
        date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0], // Позавчера
        passengers: 40,
        fare: 1100,
        revenue: 44000,
        notes: '',
        createdAt: new Date(Date.now() - 2*86400000).toISOString()
    },
    {
        id: 'wb-7',
        tripId: 'trip-7',
        date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0],
        passengers: 48,
        fare: 1800,
        revenue: 86400,
        notes: 'Полная загрузка',
        createdAt: new Date(Date.now() - 2*86400000).toISOString()
    },
    {
        id: 'wb-8',
        tripId: 'trip-8',
        date: new Date(Date.now() - 3*86400000).toISOString().split('T')[0],
        passengers: 35,
        fare: 2500,
        revenue: 87500,
        notes: '2 пассажира с детьми',
        createdAt: new Date(Date.now() - 3*86400000).toISOString()
    },
    {
        id: 'wb-9',
        tripId: 'trip-1',
        date: new Date(Date.now() - 3*86400000).toISOString().split('T')[0],
        passengers: 30,
        fare: 800,
        revenue: 24000,
        notes: '',
        createdAt: new Date(Date.now() - 3*86400000).toISOString()
    },
    {
        id: 'wb-10',
        tripId: 'trip-2',
        date: new Date(Date.now() - 4*86400000).toISOString().split('T')[0],
        passengers: 42,
        fare: 1200,
        revenue: 50400,
        notes: 'Рейс выполнен по расписанию',
        createdAt: new Date(Date.now() - 4*86400000).toISOString()
    }
];

const mockData = {
    appName: 'Пассажиры',
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
};

// Экспортируем данные для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mockTrips, mockWaybills, mockData };
}