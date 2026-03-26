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

// 1. 先讀取你的 JSON 設定檔 (假設路徑正確)
let admins = [];
async function getCWAData() {
    try {
        const response = await fetch('你的API_URL'); // 發送請求
        const data = await response.json();        // 將回傳內容轉成 JS 物件
        
        // 接下來就可以用「點」符號來抓資料了
        console.log(data.records.record[0].datasetDescription); 
    } catch (error) {
        console.error("抓取失敗：", error);
    }
}

// --- CWA 資料設定 ---
const CWA_API_KEY = config.cwa_api_key; 
const alert_key = 'W-C0033-001';
const earthquake_key = 'E-A0015-001';

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
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${alert_key}?Authorization=${CWA_API_KEY}`;
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

// --- 核心登入邏輯 ---

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    admins = config.admins;
    

    // 2. 驗證驗證碼 (保留你原本的邏輯)
    if (captchaInput.value.toUpperCase() !== currentCaptcha) {
        showError("驗證碼錯誤！");
        generateCaptcha();
        return;
    }

    // 3. 比對帳密與獲取顯示名稱
    const user = admins.find(u => u.username === usernameInput.value && u.password === passwordInput.value);

    if (user) {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminName', user.displayName); // 儲存名稱供管理介面使用
        window.location.href = 'admin.html';
    } else {
        handleLoginFail();
    }
});