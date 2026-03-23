// script.js

// 1. 每秒更新網頁顯示時間
function updateClock() {
    const now = new Date();
    document.getElementById('now-time').innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}

// 2. 向 ESP32 請求最新數據
function fetchSensorData() {
    fetch('/data')
        .then(res => res.json())
        .then(data => {
            // 更新文字數值
            document.getElementById('val-soil').innerText = data.soil + '%';
            document.getElementById('val-temp').innerText = data.p4;
            document.getElementById('val-p0').innerText = data.p0;
            document.getElementById('val-p1').innerText = data.p1;
            document.getElementById('val-p2').innerText = data.p2;
            document.getElementById('val-p3').innerText = data.p3;

            // 動態更新土壤儀表板背景 (0-100%)
            document.getElementById('gauge-soil').style.background = 
                `conic-gradient(#38bdf8 ${data.soil}%, #334155 0)`;
            
            // 溫度的視覺反饋 (假設 50 度為 100%)
            let tempPercent = Math.min((data.p4 / 50) * 100, 100);
            document.getElementById('gauge-temp').style.background = 
                `conic-gradient(#fbbf24 ${tempPercent}%, #334155 0)`;
        })
        .catch(err => console.error("資料同步失敗:", err));
}

// 3. 強制控制函式 (對應按鈕的按下與放開)
function f(type, action) {
    // 立即改變視覺狀態（預先反應，提升用戶體驗）
    const ball = document.getElementById(type + '-ball');
    if (action === 'on') {
        ball.classList.add('active');
    } else {
        ball.classList.remove('active');
    }

    // 發送請求給 ESP32
    fetch(`/force?type=${type}&action=${action}`);
}

// 啟動定時任務
setInterval(updateClock, 1000);    // 每秒更新時鐘
setInterval(fetchSensorData, 2000); // 每兩秒更新感測器資料

// 頁面載入後立即執行一次
updateClock();
fetchSensorData();
