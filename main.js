// 即時時間更新
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').innerText = now.toLocaleString();
}
setInterval(updateClock, 1000);

// 漢堡選單切換
function toggleMenu() {
    const links = document.getElementById('nav-links');
    links.classList.toggle('show');
}

// 分頁切換
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    if (window.innerWidth <= 768) toggleMenu(); // 手機版跳轉後關閉選單
}

// 登入邏輯 (示範用)
function checkLogin() {
    const pass = document.getElementById('pass').value;
    if (pass === "1234") {
        alert("登入成功");
        showPage('admin');
    } else {
        alert("密碼錯誤！");
    }
}

// 緊急告警彈窗控制
window.onload = function() {
    updateClock();
    const isMuted = localStorage.getItem('muteAlertDate');
    const today = new Date().toDateString();

    // 如果今天還沒點擊過「今日不再顯示」
    if (isMuted !== today) {
        document.getElementById('alert-modal').style.display = 'block';
    }
};

function closeModal() {
    document.getElementById('alert-modal').style.display = 'none';
}

function muteAlertToday() {
    const today = new Date().toDateString();
    localStorage.setItem('muteAlertDate', today);
    closeModal();
}
