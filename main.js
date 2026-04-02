// --- 1. 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    const hour = now.getHours();
    const ap = hour < 12 ? '上午' : '下午';
    const displayHour = String(hour % 12 || 12).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    timeDisplay.innerText = `${yyyy}/${mm}/${dd} ${ap} ${displayHour}:${mins}:${secs}`;
}

// --- 模組：資料顯示初始化 ---
function initDataDisplay() {
    const region = localStorage.getItem('user_region') || '臺北市';
    
    // 更新所有標題中的地區名稱
    document.querySelectorAll('.region-name-display').forEach(el => {
        el.innerText = `(${region})`;
    });

    // 將所有即時數值設為 --
    document.querySelectorAll('.value').forEach(el => {
        if (!el.closest('.status-card')) return; // 跳過控制面板的數值
        el.innerText = '--';
    });
}

// --- 模組：進階氣象圖表 ---
function initAdvancedCharts() {
    if (!document.getElementById('temp-north')) return;

    // 生成未來 7 天日期 (yyyy/mm/dd)
    const dateLabels = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dateLabels.push(`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`);
    }

    const chartConfig = (id, tempDataHigh, tempDataLow, rainData) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    { label: '最高溫', data: tempDataHigh, borderColor: '#e74c3c', yAxisID: 'y' },
                    { label: '最低溫', data: tempDataLow, borderColor: '#3498db', yAxisID: 'y' },
                    { label: '降雨機率', data: rainData, backgroundColor: 'rgba(21, 176, 242, 0.2)', fill: true, type: 'bar', yAxisID: 'y1' }
                ]
            },
            options: {
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: '溫度 (°C)' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: '降雨 (%)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    };

    // 範例呼叫 (數據可改為從 localStorage 讀取之地區對應數值)
    chartConfig('temp-north', [28, 30, 29, 32, 31, 28, 27], [22, 23, 22, 24, 23, 21, 20], [10, 20, 50, 30, 10, 0, 5]);
}

// --- 模組：設備控制中心 ---
const devices = ['power', 'fan', 'sprinkler', 'motor'];

function updateDeviceUI() {
    devices.forEach(dev => {
        const status = localStorage.getItem(`dev_${dev}`) === 'on';
        const led = document.getElementById(`led-${dev}`);
        const btn = document.getElementById(`btn-${dev}`);
        if (led) led.className = status ? 'led on' : 'led';
        if (btn) btn.innerText = status ? '關閉' : '啟動';
    });
}

window.toggleDevice = function(devName) {
    const current = localStorage.getItem(`dev_${devName}`) === 'on';
    localStorage.setItem(`dev_${devName}`, current ? 'off' : 'on');
    updateDeviceUI();
};

// --- 模組：數據狀態處理 ---
function updateDataDisplay(dataObj) {
    // dataObj 格式範例: { soilTemp: 35, humidity: null }
    const sensors = {
        'soil-temp': { val: dataObj.soilTemp, threshold: 30, unit: '°C' },
        'humidity': { val: dataObj.humidity, threshold: 50, unit: '%' }
    };

    for (let id in sensors) {
        const el = document.getElementById(id);
        const card = el?.closest('.info-card');
        if (!el || !card) continue;

        const sensor = sensors[id];
        
        if (sensor.val === null || sensor.val === undefined) {
            // 無資料狀態
            el.innerText = '--';
            card.querySelector('.desc').innerText = '狀態：載入中...';
            card.className = 'info-card status-card status-normal';
        } else {
            // 有資料：判定異常 (這裡你可以針對不同 ID 寫不同判斷式)
            el.innerText = sensor.val + sensor.unit;
            const isAbnormal = sensor.val > sensor.threshold; 
            
            card.querySelector('.desc').innerText = isAbnormal ? '狀態：異常' : '狀態：正常';
            card.className = isAbnormal ? 'info-card status-card status-danger' : 'info-card status-card status-success';
        }
    }
}

// --- 模組：設備定時與開關 ---
let deviceTimers = {};

function toggleDevice(dev) {
    const currentState = localStorage.getItem(`dev_${dev}`) === 'on';
    const newState = currentState ? 'off' : 'on';
    localStorage.setItem(`dev_${dev}`, newState);
    refreshDeviceUI();
}

function setDeviceTimer(dev, timeValue) {
    if (!timeValue) return;
    localStorage.setItem(`timer_${dev}`, timeValue);
    alert(`${dev} 已設定於 ${timeValue} 自動啟動`);
    refreshDeviceUI();
}

function refreshDeviceUI() {
    const devices = ['power', 'fan', 'sprinkler', 'motor'];
    devices.forEach(dev => {
        const state = localStorage.getItem(`dev_${dev}`) === 'on';
        const timer = localStorage.getItem(`timer_${dev}`);
        
        const led = document.getElementById(`led-${dev}`);
        const timerLabel = document.getElementById(`timer-display-${dev}`);
        
        if (led) led.className = `led-indicator ${state ? 'on' : 'off'}`;
        if (timerLabel) timerLabel.innerText = timer ? `定時：${timer}` : '定時：未設定';
    });
}

// 檢查定時任務 (每分鐘執行一次)
setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    ['power', 'fan', 'sprinkler', 'motor'].forEach(dev => {
        const targetTime = localStorage.getItem(`timer_${dev}`);
        if (targetTime === currentTime) {
            localStorage.setItem(`dev_${dev}`, 'on'); // 時間到，強制開啟
            refreshDeviceUI();
        }
    });
}, 60000);

// --- 2. 氣象圖表設定 ---
function initWeatherCharts() {
    if (!document.getElementById('temp-north')) return;
    if (typeof Chart === 'undefined') return;

    const weekLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    function createWeatherChart(id, label, data, color, type, fill = false) {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        new Chart(ctx, {
            type: type,
            data: {
                labels: weekLabels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '33',
                    fill: fill,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false }, x: { grid: { display: false } } }
            }
        });
    }

    createWeatherChart('temp-north', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-north', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#15b0f2', 'bar');
    createWeatherChart('temp-central', '最高溫', [28, 29, 31, 33, 30, 29, 28], '#e74c3c', 'line');   
    createWeatherChart('rain-central', '降雨機率', [0, 0, 5, 10, 0, 0, 0], '#3498db', 'bar');
    createWeatherChart('temp-south', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-south', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');
    createWeatherChart('temp-east', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-east', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');
}

// --- 3. 登入與安全邏輯 ---
const MAX_FAILS = 5;
const LOCK_TIME_MINS = 5;


// --- 3. 核心功能：讀取 Config (登入關鍵) ---
async function fetchConfig() {
    try {
        // 注意：請確保你的目錄下有 data/config.json 檔案
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error('檔案讀取失敗');
        const data = await response.json();
        sessionStorage.setItem('globalConfig', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("無法讀取 config.json:", error);
        // 備用方案：若 fetch 失敗，可在此填寫預設帳密供測試
        return { admins: [{ username: "admin", password: "123", displayName: "管理員" }] };
    }
}

// --- 4. 管理員頁面功能 ---
window.saveRegionSettings = function() {
    const selector = document.getElementById('region-selector');
    if (selector) {
        localStorage.setItem('user_region', selector.value);
        alert(`地區已成功設定為：${selector.value}`);
        location.reload(); 
    }
};

window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', async () => {
    
    updateClock();
    setInterval(updateClock, 1000);
    initDataDisplay();
    initAdvancedCharts();
    if (document.getElementById('admin-welcome')) updateDeviceUI();
    
    // [登入頁面邏輯]
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const passwordInput = document.getElementById('password'); 
        const togglePassword = document.getElementById('togglePassword'); 

        if (togglePassword && passwordInput) {
            togglePassword.onclick = () => {
                const isPass = passwordInput.type === 'password';
                passwordInput.type = isPass ? 'text' : 'password';
                togglePassword.innerText = isPass ? '🙈' : '👁️';
            };
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const msgDisplay = document.getElementById('login-msg');
            const usernameInput = document.getElementById('username');

            let config;
            try {
                const response = await fetch('data/config.json');
                if (!response.ok) throw new Error();
                config = await response.json();
            } catch (err) {
                // 備用帳密供測試
                config = { admins: [{ username: "admin", password: "123", displayName: "管理員" }] };
            }

            // 修正比對邏輯中的變數名稱
            const user = config.admins.find(u => 
                u.username === usernameInput.value && 
                String(u.password) === String(passwordInput.value)
            );

            if (user) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', user.displayName);
                window.location.href = 'admin.html';
            } else {
                if (msgDisplay) {
                    msgDisplay.innerText = "帳號或密碼錯誤！";
                    msgDisplay.className = "error";
                }
            }
        });
    }

    // [管理頁面初始化與安全檢查]
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('isAdmin') !== 'true') {
            window.location.href = 'login.html';
        } else {
            const adminName = sessionStorage.getItem('adminName') || '管理員';
            const welcomeMsg = document.getElementById('admin-welcome');
            if (welcomeMsg) welcomeMsg.innerText = `歡迎回來，${adminName}`;

            const selector = document.getElementById('region-selector');
            if (selector) {
                selector.value = localStorage.getItem('user_region') || '臺北市';
            }
        }
    }
});