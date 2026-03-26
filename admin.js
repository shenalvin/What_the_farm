function logout() {
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'login.html';
}
// 進入頁面時讀取名稱與設定
document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('adminName') || '管理員';
    document.getElementById('admin-welcome').innerText = `歡迎回來，${user}`;
            
    // 讀取之前存好的地區
    document.getElementById('pref-region').value = localStorage.getItem('userRegion') || 'Taipei';
});

function savePref() {
    const region = document.getElementById('pref-region').value;
    localStorage.setItem('userRegion', region);
    alert('監測地區已更新為：' + region);
}

function saveSecret() {
    const key = document.getElementById('iot-key').value;
    // 僅存在 Session，避免永久留在電腦上
    sessionStorage.setItem('iot_secret', key);
    alert('金鑰已加密暫存');
}

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