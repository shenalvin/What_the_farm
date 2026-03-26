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
    document.getElementById('captcha-code').innerText = code;
    captchaCreatedAt = new Date(); // 紀錄產生時間
    msgDisplay.innerText = ""; // 清除提示
}

function isCaptchaExpired() {
    if (!captchaCreatedAt) return true;
    const now = new Date();
    const diff = (now - captchaCreatedAt) / 1000 / 60; // 分鐘
    return diff >= 30;
}

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. 檢查驗證碼時效
    if (isCaptchaExpired()) {
        showError("⚠️ 驗證碼已超過 30 分鐘，請點擊刷新按鈕更換後再登入。");
        return;
    }

    // 2. 驗證碼內容檢查
    if (captchaInput.value.toUpperCase() !== currentCaptcha) {
        showError("驗證碼錯誤！");
        generateCaptcha();
        return;
    }

    // 3. 從 sessionStorage 讀取 main.js 抓好的帳密資料
    const configData = JSON.parse(sessionStorage.getItem('globalConfig'));
    if (!configData || !configData.admins) {
        showError("系統資料載入中，請稍後再試。");
        return;
    }

    const user = configData.admins.find(u => 
        u.username === usernameInput.value && u.password === passwordInput.value
    );

    if (user) {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminName', user.displayName);
        window.location.href = 'admin.html';
    } else {
        handleLoginFail();
    }
});

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


// --- 核心登入邏輯 ---

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // 1. 先讀取你的 JSON 設定檔 (假設路徑正確)
    let admins = [];
    try {
        const response = await fetch('data/config.json'); // 確保路徑與你的 JSON 檔案一致
        const config = await response.json();
        admins = config.admins;
    } catch (err) {
        console.error("無法讀取帳號設定檔", err);
        showError("系統錯誤：無法載入認證資料");
        return;
    }

    // 2. 驗證驗證碼 (保留你原本的邏輯)
    if (captchaInput.value.toUpperCase() !== currentCaptcha) {
        showError("驗證碼錯誤！");
        generateCaptcha();
        return;
    }

    // 3. 比對帳密與獲取顯示名稱
    const user = admins.find(u => u.username === usernameInput.value && u.password === passwordInput.value);

    if (user) {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminName', user.displayName); // 儲存名稱供管理介面使用
        window.location.href = 'admin.html';
    } else {
        handleLoginFail();
    }
});

async function checkLogin(inputUser, inputPass) {
    const response = await fetch('data/config.json');
    const config = await response.json();
    
    const user = config.admins.find(u => u.username === inputUser && u.password === inputPass);
    
    if (user) {
        console.log("歡迎回來，" + user.displayName);
        // 執行登入成功邏輯 
    } else {
        alert("帳號或密碼錯誤");
    }
}

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