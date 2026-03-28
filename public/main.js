// 時間更新
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    timeDisplay.innerText = new Date().toLocaleString('zh-TW', options);
}
setInterval(updateClock, 1000);

// 初始化告警系統
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index') || window.location.pathname.endsWith('/')) {
        fetchCWAAlerts();
        fetchEarthquake();
    }
});

async function fetchCWAAlerts() {
    try {
        const region = localStorage.getItem('user_region') || '臺北市';
        const resp = await fetch(`/api/weather/alert?region=${region}`);
        const data = await resp.json();

        data.forEach(h => {
            if (localStorage.getItem(`mute_${h.datasetNo}`) !== new Date().toDateString()) {
                showAlertModal({
                    id: h.datasetNo, type: 'warning',
                    title: `📢 ${h.contents.content.headline}`,
                    msg: h.contents.content.description, dailyMute: true
                });
            }
        });
    } catch (e) { console.error("警報連線失敗"); }
}

async function fetchEarthquake() {
    try {
        const resp = await fetch('/api/weather/earthquake');
        const eq = await resp.json();
        const eqTime = new Date(eq.EarthquakeInfo.OriginTime);
        if ((new Date() - eqTime) / 60000 < 30) {
            showAlertModal({
                id: eq.CTNo, type: 'danger', title: '⚠️ 最新地震告警',
                msg: `震央：${eq.EarthquakeInfo.Epicenter.Location}，規模：${eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}`,
                dailyMute: false
            });
        }
    } catch (e) { console.error("地震資料連線失敗"); }
}

function showAlertModal(alertData) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const modalHTML = `
        <div class="modal-alert ${alertData.type}" id="modal-${alertData.id}">
            <button class="alert-close-x" onclick="this.parentElement.remove()">&times;</button>
            <div class="alert-content"><h2>${alertData.title}</h2><p>${alertData.msg}</p></div>
            ${alertData.dailyMute ? `<div class="alert-action-row"><button class="btn-mute-today" onclick="muteAlertToday('${alertData.id}', 'modal-${alertData.id}')">今日不再顯示</button></div>` : ''}
        </div>`;
    container.insertAdjacentHTML('beforeend', modalHTML);
}

function muteAlertToday(alertId, modalId) {
    localStorage.setItem(`mute_${alertId}`, new Date().toDateString());
    document.getElementById(modalId).remove();
}