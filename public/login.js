const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 驗證碼檢查 (前端檢查即可)
    const captchaInput = document.getElementById('captcha-input').value.toUpperCase();
    if (captchaInput !== currentCaptcha) {
        alert("驗證碼錯誤！");
        generateCaptcha();
        return;
    }

    // 發送到後端驗證
    const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        })
    });

    const result = await resp.json();
    if (result.success) {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminName', result.displayName);
        window.location.href = 'admin.html';
    } else {
        alert(result.message || "登入失敗");
    }
});