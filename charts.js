// --- 1. 即時時間更新 (全站) ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}
// 初始呼叫與每秒更新
updateClock();
setInterval(updateClock, 1000);

const weekLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

// 圖表生成函數：保持代碼簡潔
function createWeatherChart(id, label, data, color, type, fill = false) {
    const ctx = document.getElementById(id).getContext('2d');
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
createWeatherChart('rain-north', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');

// 渲染中部數據 (示範)
createWeatherChart('temp-central', '最高溫', [28, 29, 31, 33, 30, 29, 28], '#e74c3c', 'line', false);
createWeatherChart('rain-central', '降雨機率', [0, 0, 5, 10, 0, 0, 0], '#3498db', 'bar');
