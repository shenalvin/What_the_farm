let CONFIG = {};

// 1. 每秒更新時間 (對應左上角：現在時間)
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
    document.getElementById('now-time').innerText = timeStr;
}

// 2. 抓取氣象局資料並計算「分區平均雨量」
async function fetchWeather() {
    if (!CONFIG.cwa_api_key) return;
    
    // 使用 F-D0047-091 (全台現行天氣預報) 來取得更精確的雨量資訊
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${CONFIG.cwa_api_key}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const locations = data.records.locations[0].location;

        // 定義分區
        const regions = {
            "北": ["臺北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
            "中": ["苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣"],
            "南": ["嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "澎湖縣"],
            "東": ["花蓮縣", "臺東縣"]
        };

        const result = { "北": 0, "中": 0, "南": 0, "東": 0 };

        // 簡單邏輯：計算各區降雨機率或雨量的平均值 (示範用)
        Object.keys(regions).forEach(key => {
            let totalPop = 0;
            let count = 0;
            locations.forEach(loc => {
                if (regions[key].includes(loc.locationName)) {
                    // 抓取降雨機率 PoP12h
                    const pop = loc.weatherElement.find(el => el.elementName === 'PoP12h').time[0].elementValue[0].value;
                    totalPop += parseInt(pop) || 0;
                    count++;
                }
            });
            result[key] = count > 0 ? Math.round(totalPop / count) : 0;
            
            // 更新 UI (對應介面上的 北中南東)
            // 假設你的 ID 分別是 val-north, val-center, val-south, val-east
            const el = document.getElementById(`val-${key}`);
            if (el) el.innerText = result[key] + '%'; 
        });

    } catch (err) {
        console.error("氣象更新失敗:", err);
    }
}

// 3. ESP32 感測器數據 (對應圓圈：土壤濕度、環境氣溫)
function fetchSensorData() {
    const target = CONFIG.esp32_ip || "";
    fetch(`${target}/data`)
        .then(res => res.json())
        .then(data => {
            // 土壤濕度
            document.getElementById('val-soil').innerText = data.soil + '%';
            document.getElementById('gauge-soil').style.background = 
                `conic-gradient(#38bdf8 ${data.soil}%, #1e293b 0)`;
            
            // 環境氣溫
            document.getElementById('val-temp').innerText = data.temp + '°C';
            let tempPercent = Math.min((data.temp / 50) * 100, 100);
            document.getElementById('gauge-temp').style.background = 
                `conic-gradient(#fbbf24 ${tempPercent}%, #1e293b 0)`;
        })
        .catch(err => console.error("感測器同步失敗"));
}

// 4. 儲存排程設定 (對應右側：自動灌溉排程)
function saveSchedule() {
    const time = document.getElementById('schedule-time').value;
    const duration = document.getElementById('schedule-duration').value;
    
    console.log(`儲存設定：時間 ${time}, 持續 ${duration} 分鐘`);

    // 發送給 ESP32
    const target = CONFIG.esp32_ip || "";
    fetch(`${target}/setSchedule?time=${time}&duration=${duration}`)
        .then(() => alert("設定已儲存！"))
        .catch(() => alert("儲存失敗，請檢查連線"));
}

// 5. 按鈕控制 (照明、灌溉)
function f(type, action) {
    const target = CONFIG.esp32_ip || "";
    const ball = document.getElementById(type + '-ball');
    
    // 視覺切換
    if (action === 'on') ball.classList.add('active');
    else ball.classList.remove('active');

    fetch(`${target}/force?type=${type}&action=${action}`);
}

// --- 初始化 ---
async function init() {
    try {
        const res = await fetch('./data/config.json');
        CONFIG = await res.json();
        
        updateClock();
        fetchWeather();
        fetchSensorData();

        setInterval(updateClock, 1000);
        setInterval(fetchSensorData, 3000);
        setInterval(fetchWeather, 3600000); // 一小時更新一次氣象即可
    } catch (err) {
        console.log("尚未偵測到 config.json");
    }
}

init();
