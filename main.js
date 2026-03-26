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

async function loadGlobalConfig() {
    try {
        const response = await fetch('data/config.json');
        const config = await response.json();
        // 存入 sessionStorage 讓所有頁面 JS 都能直接讀取，不用重複 fetch
        sessionStorage.setItem('globalConfig', JSON.stringify(config));
    } catch (err) {
        console.error("全域設定載入失敗:", err);
    }
}

function updateActiveState() {
    const path = window.location.pathname.split("/").pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    if (path.includes('index')) document.getElementById('nav-home')?.classList.add('active');
    else if (path.includes('charts')) document.getElementById('nav-charts')?.classList.add('active');
    else if (path.includes('login')) document.getElementById('nav-login')?.classList.add('active');
}


// --- 2. 漢堡選單邏輯 (手機版) ---
const menuToggle = document.getElementById('mobile-menu-icon');
const navMenu = document.getElementById('nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
        this.classList.toggle('open'); // 關閉按鍵 X
        navMenu.classList.toggle('show'); // 選單滑出
    });

    // 點擊選單連結後自動收起
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            navMenu.classList.remove('show');
        });
    });
}

const CWA_API_KEY = "data/config.js";
const alert_key = 'W-C0033-001';
const earthquake_key = 'E-A0015-001';

// --- 緊急告警預告 ---
document.addEventListener('DOMContentLoaded', () => {
    // 檢查是否在首頁 (判斷是否有 alert-container)
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    if (window.location.pathname.includes('index') || window.location.pathname === '/') {
        fetchCWAAlerts();
        fetchEarthquake();
    }

    // 模擬的緊急資料 (真實情況應從 API 取得)
    /*const currentAlerts = {
        highTemp: { id: 'temp_01', type: 'warning', title: '🔥 高溫警報', msg: '今日北部預估突破 38°C，請注意撒水降溫。', dailyMute: true },
        earthquake: { id: 'eq_20240520_01', type: 'danger', title: '⚠️ 地震告警', msg: '偵測到顯著地震(規模5.2)，請檢查設施設備！', dailyMute: false }
    };*/

    const today = new Date().toDateString();

    // 處理高溫警報 (每日只需顯示一次)
    if (currentAlerts.highTemp) {
        const muteDate = localStorage.getItem(`mute_${currentAlerts.highTemp.id}`);
        if (muteDate !== today) {
            showAlertModal(currentAlerts.highTemp);
        }
    }

    // 處理地震告警 (每次進入都要顯示，除非手動關閉X)
    if (currentAlerts.earthquake) {
        // 地震通常不設置「今日不再顯示」，因為隨時可能發生新的。
        // 這裡直接顯示。
        showAlertModal(currentAlerts.earthquake);
    }
});

// 創建並顯示告警對話框
function showAlertModal(alertData) {
    const container = document.getElementById('alert-container');
    
    // 創建 Modal HTML
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

// 關閉單個告警 (暫時關閉X)
function closeSpecificAlert(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'slideOutUp 0.5s ease forwards';
        setTimeout(() => modal.remove(), 500);
    }
}

// 今日不再顯示邏輯
function muteAlertToday(alertId, modalId) {
    const today = new Date().toDateString();
    localStorage.setItem(`mute_${alertId}`, today);
    closeSpecificAlert(modalId);
}

async function fetchCWAAlerts() {
    try {
        // 讀取管理員設定的地區，預設為臺北市
        const targetRegion = localStorage.getItem('user_region') || '臺北市';

        // 警報及特報_天氣特報資訊_[各別縣市地區目前所遭受之天氣警特報情形
        //警報及特報包含颱風警報、豪(大)雨特報、陸上強風特報、濃霧特報等 4 項警特報資訊。
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${alert_key}?Authorization=${CWA_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        const hazards = data.records.record; // 取得所有警報訊息

        // 關鍵：只顯示與設定地區相關的警報
        const filteredHazards = hazards.filter(h => h.datasetDescription.includes(targetRegion));

        if (hazards.length > 0) {
            hazards.forEach(h => {
                showAlertModal({
                    id: h.datasetNo,
                    type: 'warning',
                    title: `📢 ${h.contents.content.headline}`,
                    msg: h.contents.content.description,
                    dailyMute: true
                });
            });
        }
    } catch (e) { console.error("警報抓取失敗", e); }
}

// 抓取最新地震資訊
async function fetchEarthquake() {
    try {
        // 讀取管理員設定的地區，預設為臺北市
        const targetRegion = localStorage.getItem('user_region') || '臺北市';
        
        //顯著有感地震報告資料-顯著有感地震報告
        //地震編號、日期、時間、位置、深度、規模、各地區震度
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${earthquake_key}?Authorization=${CWA_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        const eq = data.records.Earthquake[0]; // 取得最新一筆地震
        
        const eqTime = new Date(eq.EarthquakeInfo.OriginTime);
        const now = new Date();

        // 關鍵：只顯示與設定地區相關的警報
        const filteredHazards = hazards.filter(h => h.datasetDescription.includes(targetRegion));
        
        // 如果地震發生在 30 分鐘內，強制顯示
        if ((now - eqTime) / 1000 / 60 < 30) {
            showAlertModal({
                id: eq.CTNo,
                type: 'danger',
                title: '⚠️ 強烈地震告警',
                msg: `震央：${eq.EarthquakeInfo.Epicenter.Location}，規模：${eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}`,
                dailyMute: false // 地震不提供今日不再顯示，確保每次進入都看到
            });
        }
    } catch (e) { console.error("地震資料抓取失敗", e); }
}