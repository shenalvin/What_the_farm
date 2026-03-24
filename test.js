let CONFIG = {
};

// 1. 每秒更新時間
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
    // 如果 HTML 有對應 ID 則更新
    if(document.getElementById('now-time')) {
        document.getElementById('now-time').innerText = timeStr;
    }
}

// 2. 抓取氣象署資料並計算「分區平均降雨機率」
async function fetchWeather() {
    if (!CONFIG.cwa_api_key || CONFIG.cwa_api_key === "YOUR_API_KEY_HERE") {
        console.warn("未設定 API Key");
        return;
    }
    
    // 使用 F-D0047-091 (全台現行天氣預報)
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${CONFIG.cwa_api_key}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        // 氣象局資料路徑：records -> locations[0] -> location (陣列)
        const locations = data.records.locations[0].location;

        const regions = {
            "north": ["臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
            "center": ["苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣"],
            "south": ["嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "澎湖縣"],
            "east": ["花蓮縣", "臺東縣"]
        };

        // 迭代四個分區
        Object.keys(regions).forEach(key => {
            let totalPop = 0;
            let count = 0;

            locations.forEach(loc => {
                if (regions[key].includes(loc.locationName)) {
                    // 尋找降雨機率 PoP12h (12小時降雨機率)
                    const popElement = loc.weatherElement.find(el => el.elementName === 'PoP12h');
                    if (popElement && popElement.time[0]) {
                        const popValue = popElement.time[0].elementValue[0].value;
                        if (popValue !== " ") { // 排除空值
                            totalPop += parseInt(popValue);
                            count++;
                        }
                    }
                }
            });

            const avgPop = count > 0 ? Math.round(totalPop / count) : 0;
            
            // 更新 UI (對應 val-north, val-center 等)
            const el = document.getElementById(`val-${key}`);
            if (el) {
                el.innerText = avgPop + '%';
                // 擴充功能：如果降雨機率 > 60%，可以給個顏色警示
                el.style.color = avgPop > 60 ? "#60a5fa" : "#ffffff";
            }
        });

        console.log("氣象資料已更新於:", new Date().toLocaleTimeString());

    } catch (err) {
        console.error("氣象更新失敗:", err);
    }
}

// 3. ESP32 感測器數據
async function fetchSensorData() {
    if (!CONFIG.esp32_ip) return;
    
    try {
        const res = await fetch(`${CONFIG.esp32_ip}/data`);
        const data = await res.json();
        
        // 土壤濕度更新
        const soilEl = document.getElementById('val-soil');
        const soilGauge = document.getElementById('gauge-soil');
        if (soilEl) soilEl.innerText = data.soil + '%';
        if (soilGauge) {
            soilGauge.style.background = `conic-gradient(#38bdf8 ${data.soil}%, #1e293b 0)`;
        }
        
        // 氣溫更新
        const tempEl = document.getElementById('val-temp');
        const tempGauge = document.getElementById('gauge-temp');
        if (tempEl) tempEl.innerText = data.temp + '°C';
        if (tempGauge) {
            let tempPercent = Math.min((data.temp / 50) * 100, 100);
            tempGauge.style.background = `conic-gradient(#fbbf24 ${tempPercent}%, #1e293b 0)`;
        }
    } catch (err) {
        console.warn("無法連線至 ESP32 感測器");
    }
}

// 4. 控制與排程 (保持原樣)
function saveSchedule() {
    const time = document.getElementById('schedule-time').value;
    const duration = document.getElementById('schedule-duration').value;
    if (!CONFIG.esp32_ip) return;

    fetch(`${CONFIG.esp32_ip}/setSchedule?time=${time}&duration=${duration}`)
        .then(() => alert("設定已儲存！"))
        .catch(() => alert("儲存失敗"));
}

function f(type, action) {
    if (!CONFIG.esp32_ip) return;
    const ball = document.getElementById(type + '-ball');
    if (action === 'on') ball?.classList.add('active');
    else ball?.classList.remove('active');

    fetch(`${CONFIG.esp32_ip}/force?type=${type}&action=${action}`);
}

// --- 初始化 ---
async function init() {
    try {
        // 優先讀取設定檔
        const res = await fetch('./data/config.json');
        const remoteConfig = await res.json();
        CONFIG = { ...CONFIG, ...remoteConfig };
    } catch (err) {
        console.log("使用預設或內建 CONFIG 設定");
    }

    updateClock();
    fetchWeather();
    fetchSensorData();

    setInterval(updateClock, 1000);
    setInterval(fetchSensorData, 5000); // 改為 5 秒更新一次感測器
    setInterval(fetchWeather, 3600000); // 一小時更新一次氣象
}

init();
