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

function saveRegionSettings() {
    const selector = document.getElementById('region-selector');
    if (selector) {
        const selectedRegion = selector.value;
        localStorage.setItem('user_region', selectedRegion);
        alert(`地區已成功設定為：${selectedRegion}`);
        location.reload(); 
    }
}