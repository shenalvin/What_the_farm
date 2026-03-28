const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));// 託管靜態網頁
app.use(express.json());

// 讀取本地 config.json
const getConfig = () => {
    const configPath = path.join(__dirname, 'data', 'config.json');
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
};

// --- 功能 A：登入驗證 API ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const config = getConfig();
    const user = config.admins.find(u => u.username === username && u.password === String(password));
    
    if (user) {
        res.json({ success: true, displayName: user.displayName });
    } else {
        res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
});

// --- 功能 B：氣象資料轉發 (保護 Key) ---
app.get('/api/weather/alert', async (req, res) => {
    const { region } = req.query;
    const config = getConfig().cwa_API_code[0];
    const apiKey = config.cwa_api_key;
    const apiId = config.alert.country; // W-C0033-001

    try {
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${apiId}?Authorization=${apiKey}`;
        const response = await axios.get(url);
        const records = response.data.records.record;
        
        // 過濾地區
        const filtered = records.filter(h => h.datasetDescription.includes(region || '臺北市'));
        res.json(filtered);
    } catch (error) {
        res.status(500).send("氣象局 API 請求失敗");
    }
});

// --- 功能 C：定時抓取影像 (隨時執行) ---
const downloadWeatherImage = async () => {
    const config = getConfig().cwa_API_code[0];
    // 假設你要抓取衛星雲圖，可在此替換對應的 API ID
    const imgUrl = `https://opendata.cwa.gov.tw/fileapi/v1/dataset/O-A0058-001?Authorization=${config.cwa_api_key}&format=JSON`;
    
    try {
        const res = await axios.get(imgUrl);
        // 這裡可以實作儲存影像至 public/images 的邏輯
        console.log("影像資料已定時更新");
    } catch (e) { console.error("影像抓取失敗"); }
};

// 每 30 分鐘執行一次
setInterval(downloadWeatherImage, 30 * 60 * 1000);

app.listen(PORT, () => console.log(`系統運行中：http://localhost:${PORT}`));