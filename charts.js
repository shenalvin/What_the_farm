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
createWeatherChart('hight_temp-north', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('low_temp-north', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#3cdce7', 'line', false); // 無填充
createWeatherChart('rain-north', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#15b0f2', 'bar');

// 渲染中部數據 (示範)
createWeatherChart('temp-central', '最高溫', [28, 29, 31, 33, 30, 29, 28], '#e74c3c', 'line', false);   
createWeatherChart('rain-central', '降雨機率', [0, 0, 5, 10, 0, 0, 0], '#3498db', 'bar');

createWeatherChart('temp-south', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('rain-south', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');

createWeatherChart('temp-east', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line', false); // 無填充
createWeatherChart('rain-east', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');

async function fetchWeeklyWeather() {
    try {
        // 這裡以臺北市 (LocationsName) 為範例，你可以根據需求改為北中南東分區
        const url = ("https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=CWA-5246C051-E367-4276-A316-6B73776DA2FD");
        const resp = await fetch(url);
        const data = await resp.json();
        
        // 解析邏輯 (範例：抓取平均溫度與降雨機率)
        const location = data.records.Locations[0].Location.find(l => l.LocationName === "臺北市");
        const tempElements = location.WeatherElement.find(e => e.ElementName === "平均溫度").Time;
        const rainElements = location.WeatherElement.find(e => e.ElementName === "PoP12h").Time;

        // 整理成 Chart.js 需要的陣列格式
        const temps = tempElements.map(t => t.ElementValue[0].Value);
        const rains = rainElements.map(r => r.ElementValue[0].Value);
        const dates = tempElements.map(t => t.StartTime.split(' ')[0].substring(5)); // 格式: 03-24

        // 呼叫原本的 createWeatherChart 渲染
        renderCharts(dates, temps, rains);
    } catch (e) { console.error("一週預報抓取失敗", e); }
}

function renderCharts(labels, tempSource, rainSource) {
    createWeatherChart('temp-north', '一週溫度', tempSource, '#e74c3c', 'line', false);
    createWeatherChart('rain-north', '降雨機率', rainSource, '#3498db', 'bar');
}