// --- 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}
updateClock();
setInterval(updateClock, 1000);

// 氣象圖表設定
// 改顯示日期 yyyy/mm/dd(week)
const weekLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

// 圖表生成函數：保持代碼簡潔
function createWeatherChart(id, label, data, color, type, fill = false) {
    // const ctx = document.getElementById(id).getContext('2d');
    const ctx = document.getElementById(id);
    new Chart(ctx, {
        type: type,
        data: {
            labels: weekLabels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '33', // 15% 透明度
                fill: fill, // 根據需求決定是否填充
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, // 隱藏小標籤讓畫面更乾淨
            scales: {
                y: { beginAtZero: false },
                x: { grid: { display: false } }
            }
        }
    });
}

// 渲染北部數據 (示範)
createWeatherChart('temp-north', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('rain-north', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#15b0f2', 'bar');

// 渲染中部數據 (示範)
createWeatherChart('temp-central', '最高溫', [28, 29, 31, 33, 30, 29, 28], '#e74c3c', 'line', false);   
createWeatherChart('rain-central', '降雨機率', [0, 0, 5, 10, 0, 0, 0], '#3498db', 'bar');

createWeatherChart('temp-south', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('rain-south', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');

createWeatherChart('temp-east', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('rain-east', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');

// 取得 UI 元件
// login.html
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const captchaInput = document.getElementById('captcha-input');
const captchaCodeDisplay = document.getElementById('captcha-code');
const btnRefreshCaptcha = document.getElementById('btn-refresh-captcha');
const togglePassword = document.getElementById('togglePassword');
const submitBtn = document.getElementById('btn-submit');
const msgDisplay = document.getElementById('login-msg');

// 驗證碼定義
let currentCaptcha = "";
// 登入次數計算
let failCount = 0;
const MAX_FAILS = 5;
// 暫停登入時間計算 5min
const LOCK_TIME_MINS = 5;

// --- 初始化 ---
generateCaptcha();

// 密碼可見性切換
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.innerText = type === 'password' ? '👁️' : '🙈';
});

// 驗證碼刷新
btnRefreshCaptcha.addEventListener('click', generateCaptcha);

function generateCaptcha() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = code;
    captchaCodeDisplay.innerText = code;
    captchaInput.value = ""; // 清空輸入框
}

// 跳開頁面時清除表單 (使用 pageshow 事件)
window.addEventListener('pageshow', (event) => {
    // 如果是從快取載入（例如按了「上一頁」），清除表單
    if (event.persisted) {
        clearForm();
    }
});

function clearForm() {
    loginForm.reset(); // 清除帳號、密碼、驗證碼輸入
    generateCaptcha(); // 刷新驗證碼
    msgDisplay.innerText = ""; // 清除錯誤訊息
}

async function GetConfig() {
    try {
        const response = await fetch('data/config.json');
        const data = await response.json(); // 取得 JSON 內容
        
        // 關鍵：將內容存入 sessionStorage，後面的邏輯才拿得到
        sessionStorage.setItem('globalConfig', JSON.stringify(data));
        
        console.log("Config 載入並儲存成功");
    } catch (error) {
        console.error("無法讀取 config.json:", error);
    }
}

// --- 核心登入邏輯 ---
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // 檢查 sessionStorage
    let configData = sessionStorage.getItem('globalConfig');
    
    // 如果裡面沒資料，現場補抓
    if (!configData) {
        await GetConfig(); 
        configData = sessionStorage.getItem('globalConfig'); // 重新抓完後再讀取一次
    }
    
    // 最終檢查，如果還是沒資料（例如連線失敗），就中斷執行
    if (!configData) {
        showError("系統設定載入失敗，請檢查網路。");
        return;
    }
    
    const config = JSON.parse(configData);
    let admins = config.admins || []; 

    // 2. 驗證驗證碼
    if (captchaInput.value.toUpperCase() !== currentCaptcha) {
        showError("驗證碼錯誤！");
        generateCaptcha();
        return;
    }

    // 3. 比對帳密 (確保比對邏輯正確)
    const user = admins.find(u => u.username === usernameInput.value && u.password === String(passwordInput.value));

    if (user) {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminName', user.displayName);
        window.location.href = 'admin.html';
    } else {
        handleLoginFail();
    }
});


function handleLoginFail() {
    failCount++;
    clearForm(); // 清除之前打的

    if (failCount >= MAX_FAILS) {
        // 鎖定 5 分鐘
        const lockUntil = new Date().getTime() + LOCK_TIME_MINS * 60000;
        localStorage.setItem('loginLockUntil', lockUntil);
        failCount = 0; // 重置次數，等待下次解鎖
        showError(`密碼輸錯超過 ${MAX_FAILS} 次，帳號已暫停登入 5 分鐘。`);
    } else {
        showError(`帳號或密碼錯誤！(剩餘嘗試次數: ${MAX_FAILS - failCount})`);
    }
}

function showError(msg) {
    msgDisplay.innerText = msg;
    msgDisplay.classList.add('error');
}

// 登出功能
function logout() {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminName');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 安全檢查：若未登入則導回
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const user = sessionStorage.getItem('adminName') || '管理員';
    const welcomeMsg = document.getElementById('admin-welcome');
    if (welcomeMsg) welcomeMsg.innerText = `歡迎回來，${user}`;
            
    // 自動選取之前存過的地區
    const savedRegion = localStorage.getItem('user_region') || '臺北市';
    const selector = document.getElementById('region-selector');
    if (selector) selector.value = savedRegion;
});

//農場所在地設定
function saveRegionSettings() {
    const selector = document.getElementById('region-selector');
    if (selector) {
        const selectedRegion = selector.value;
        localStorage.setItem('user_region', selectedRegion);
        alert(`地區已成功設定為：${selectedRegion}`);
        location.reload(); 
    }
}