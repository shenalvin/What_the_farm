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
    if (!CONFIG.cwa_api_key || CONFIG.cwa_api_key.includes("XXXX")) {
        console.error("API Key 格式不正確，目前為:", CONFIG.cwa_api_key);
        return;
    }
    
    // 增加 &format=JSON
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${CONFIG.cwa_api_key}&format=JSON`;

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors' // 強制開啟跨域模式
        });
        
        const data = await res.json();
        
        if (data.success === "false") {
            console.error("氣象局回傳錯誤：", data.result.message);
            return;
        }

        const locations = data.records.locations[0].location;
        const regions = {
            "north": ["臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
            "center": ["苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣"],
            "south": ["嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "澎湖縣"],
            "east": ["花蓮縣", "臺東縣"]
        };

        Object.keys(regions).forEach(key => {
            let totalPop = 0, count = 0;
            locations.forEach(loc => {
                if (regions[key].includes(loc.locationName)) {
                    const popElement = loc.weatherElement.find(el => el.elementName === 'PoP12h');
                    if (popElement && popElement.time[0]) {
                        const val = popElement.time[0].elementValue[0].value;
                        if (val !== " " && val !== null) {
                            totalPop += parseInt(val);
                            count++;
                        }
                    }
                }
            });
            const avgPop = count > 0 ? Math.round(totalPop / count) : 0;
            const el = document.getElementById(`val-${key}`);
            if (el) el.innerText = avgPop + '%';
        });
        console.log("氣象資料更新成功！");
    } catch (err) {
        console.error("Fetch 失敗，可能是網路或 CORS 問題:", err);
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
