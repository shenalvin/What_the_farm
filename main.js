// --- 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}
updateClock();
setInterval(updateClock, 1000);


let globalConfig = null;

/*async function loadConfig() {
    try {
        const response = await fetch('data/config.json');
        globalConfig = await response.json();
        // 將設定存入 session，讓其他 JS (如 login.js) 也能用到
        sessionStorage.setItem('globalConfig', JSON.stringify(globalConfig));
        console.log("Config 載入成功");
    } catch (error) {
        console.error("無法讀取 config.json:", error);
    }
}*/

async function loadConfig() {
    try {
        const response = await fetch('data/config.json');
        globalConfig = await response.json();
        sessionStorage.setItem('globalConfig', JSON.stringify(globalConfig));

        if (!response.ok) {
            throw new Error('網路回應錯誤: ' + response.statusText);
        }

    } catch (error) {
        console.error('讀取失敗：', error);
    }
}

const cwa_setting = globalConfig.cwa_API_code[0];

// --- CWA 資料設定 ---
let CWA_API_KEY = cwa_setting.cwa_api_key; 
let Hight_temp_key = cwa_setting.alert.Hight_temp;
let earthquake_key = cwa_setting.alert.earthquake;

// --- 告警系統 ---
document.addEventListener('DOMContentLoaded', () => {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    // 判斷是否為首頁
    if (window.location.pathname.includes('index') || window.location.pathname.endsWith('/')) {
        fetchCWAAlerts();
        fetchEarthquake();
    }
});

// 統一顯示告警函式
function showAlertModal(alertData) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    
    const modalHTML = `
        <div class="modal-alert ${alertData.type}" id="modal-${alertData.id}">
            <button class="alert-close-x" onclick="closeSpecificAlert('modal-${alertData.id}')">&times;</button>
            <div class="alert-content">
                <h2>${alertData.title}</h2>
                <p>${alertData.msg}</p>
            </div>
            ${alertData.dailyMute ? `
                <div class="alert-action-row">
                    <button class="btn-mute-today" onclick="muteAlertToday('${alertData.id}', 'modal-${alertData.id}')">今日不再顯示</button>
                </div>
            ` : ''}
        </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSpecificAlert(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove(); // 簡化關閉邏輯
    }
}

function muteAlertToday(alertId, modalId) {
    localStorage.setItem(`mute_${alertId}`, new Date().toDateString());
    closeSpecificAlert(modalId);
}

// 修正：確保變數範圍正確，並加入地區過濾
async function fetchCWAAlerts() {
    try {
        const targetRegion = localStorage.getItem('user_region') || '臺北市';
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${Hight_temp_key}?Authorization=${CWA_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        const records = data.records.record; 

        // 過濾出與設定地區相關的警報
        const filtered = records.filter(h => h.datasetDescription.includes(targetRegion));

        filtered.forEach(h => {
            const today = new Date().toDateString();
            if (localStorage.getItem(`mute_${h.datasetNo}`) !== today) {
                showAlertModal({
                    id: h.datasetNo,
                    type: 'warning',
                    title: `📢 ${h.contents.content.headline}`,
                    msg: h.contents.content.description,
                    dailyMute: true
                });
            }
        });
    } catch (e) { console.error("警報抓取失敗", e); }
}

async function fetchEarthquake() {
    try {
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${earthquake_key}?Authorization=${CWA_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        const eq = data.records.Earthquake[0]; 
        
        const eqTime = new Date(eq.EarthquakeInfo.OriginTime);
        const now = new Date();

        // 30分鐘內的地震強制顯示
        if ((now - eqTime) / 1000 / 60 < 30) {
            showAlertModal({
                id: eq.CTNo,
                type: 'danger',
                title: '⚠️ 最新地震告警',
                msg: `震央：${eq.EarthquakeInfo.Epicenter.Location}，規模：${eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}`,
                dailyMute: false
            });
        }
    } catch (e) { console.error("地震資料抓取失敗", e); }
}

