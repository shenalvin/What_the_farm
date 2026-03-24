// 預設帳密 (正式專案請在後端驗證)
const VALID_USER = "admin";
const VALID_PASS = "123456";

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


// --- 核心登入邏輯 ---

loginForm.addEventListener('submit', function() {
    // a. 檢查是否鎖定中
    const lockTime = localStorage.getItem('loginLockUntil');
    if (lockTime && new Date().getTime() < lockTime) {
        const remaining = Math.ceil((lockTime - new Date().getTime()) / 60000);
        showError(`嘗試次數過多，帳號已鎖定。請在 ${remaining} 分鐘後再試。`);
        return;
    }

    // b. 驗證驗證碼
    if (captchaInput.value.toUpperCase() !== currentCaptcha) {
        showError("驗證碼錯誤！");
        generateCaptcha(); // 強制刷新
        return;
    }

    // c. 驗證帳密
    if (usernameInput.value === VALID_USER && passwordInput.value === VALID_PASS) {
        // 登入成功
        sessionStorage.setItem('isAdmin', 'true'); // 設置 Session
        localStorage.removeItem('loginFailCount'); // 重設失敗次數
        localStorage.removeItem('loginLockUntil');
        window.location.href = 'admin.html'; // 跳轉
    } else {
        // 登入失敗
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
