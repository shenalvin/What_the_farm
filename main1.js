// --- 1. 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: true 
    };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}

// --- 2. 氣象圖表設定 ---
function initWeatherCharts() {
    // 檢查頁面上是否有圖表元件，若無則跳過（避免其他頁面報錯）
    if (!document.getElementById('temp-north')) return;

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
                scales: {
                    y: { beginAtZero: false },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 渲染各區數據
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
//let currentCaptcha = "";
const MAX_FAILS = 5;
const LOCK_TIME_MINS = 5;
/*
function generateCaptcha() {
    const display = document.getElementById('captcha-code');
    const input = document.getElementById('captcha-input');
    if (!display) return;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = code;
    display.innerText = code;
    if (input) input.value = "";
}*/

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

// --- 2. 核心初始化邏輯 ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // [時間更新]
    const updateClock = () => {
        const timeDisplay = document.getElementById('current-time');
        if (timeDisplay) {
            const now = new Date();
            timeDisplay.innerText = now.toLocaleString('zh-TW', {
                year: 'numeric', month: 'numeric', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
            });
        }
    };
    setInterval(updateClock, 1000);
    updateClock();

    // [LED 切換 - 首頁]
    const led = document.getElementById('myLed');
    if (led) {
        led.onclick = () => led.classList.toggle('on');
    }

    // [登入邏輯處理 - 登入頁]
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const togglePass = document.getElementById('togglePassword');
        const passInput = document.getElementById('password');
        
        // --- 修正：密碼可見性切換 ---
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                // 切換 type 屬性
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                // 切換圖示
                this.innerText = isPassword ? '🙈' : '👁️';
            });
        }

        // 核心：使用 addEventListener 並阻止預設行為
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const msgDisplay = document.getElementById('login-msg');
            const usernameInput = document.getElementById('username');

            // 取得 Config
            let config;
            try {
                const response = await fetch('data/config.json');
                if (!response.ok) throw new Error();
                config = await response.json();
                sessionStorage.setItem('globalConfig', JSON.stringify(config));
            } catch (err) {
                // 備用測試帳密
                config = { admins: [{ username: "admin", password: "123", displayName: "管理員" }] };
            }

            const user = config.admins.find(u => 
                u.username === usernameInput.value && 
                String(u.password) === String(passInput.value)
            );

            if (user) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', user.displayName);
                window.location.href = 'admin.html'; // 確保執行跳轉
            } else {
                if (msgDisplay) {
                    msgDisplay.innerText = "帳號或密碼錯誤！";
                    msgDisplay.className = "error";
                }
                // 移除原有的 generateCaptcha 呼叫以免報錯
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
    /*

        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const msgDisplay = document.getElementById('login-msg');
            // const captchaInput = document.getElementById('captcha-input');
            const usernameInput = document.getElementById('username');

            // 驗證碼檢查
            /*
            if (captchaInput.value.toUpperCase() !== currentCaptcha) {
                msgDisplay.innerText = "驗證碼錯誤！";
                msgDisplay.className = "error";
                generateCaptcha();
                return;
            }

            // 取得或讀取 Config
            let config = JSON.parse(sessionStorage.getItem('globalConfig'));
            if (!config) config = await fetchConfig();

            if (!config) {
                msgDisplay.innerText = "系統設定載入失敗。";
                return;
            }

            const user = config.admins.find(u => 
                u.username === usernameInput.value && 
                u.password === String(passInput.value)
            );

            if (user) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', user.displayName);
                window.location.href = 'admin.html';
            } else {
                msgDisplay.innerText = "帳號或密碼錯誤！";
                msgDisplay.className = "error";
                loginForm.reset();
                generateCaptcha();
            }
        };
    }

    // --- 管理員介面安全檢查 ---
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('isAdmin') !== 'true') {
            window.location.href = 'login.html';
        } else {
            const adminName = sessionStorage.getItem('adminName') || '管理員';
            const welcomeMsg = document.getElementById('admin-welcome');
            if (welcomeMsg) welcomeMsg.innerText = `歡迎回來，${adminName}`;

            const savedRegion = localStorage.getItem('user_region') || '臺北市';
            const selector = document.getElementById('region-selector');
            if (selector) selector.value = savedRegion;
        }
    }*/
   

