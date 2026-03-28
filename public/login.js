// 測試帳密
// const VALID_USER = "admin";
// const VALID_PASS = "123456";

// 取得 UI 元件
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const captchaInput = document.getElementById('captcha-input');
const captchaCodeDisplay = document.getElementById('captcha-code');
const btnRefreshCaptcha = document.getElementById('btn-refresh-captcha');
const togglePassword = document.getElementById('togglePassword');
const submitBtn = document.getElementById('btn-submit');
const msgDisplay = document.getElementById('login-msg');

let currentCaptcha = "";
let failCount = 0;
const MAX_FAILS = 5;
const LOCK_TIME_MINS = 5;

// --- 初始化 ---
generateCaptcha();

// --- 介面交互邏輯 ---

// 1. 密碼可見性切換
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.innerText = type === 'password' ? '👁️' : '🙈';
});

// 2. 驗證碼刷新
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

// 3. 跳開頁面時清除表單 (使用 pageshow 事件)
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