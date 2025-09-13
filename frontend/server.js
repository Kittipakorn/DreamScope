const express = require('express');
const path = require('path');
const app = express();
const PORT = 5500;

// ให้เข้าถึงไฟล์ทุกไฟล์ในโฟลเดอร์ปัจจุบัน
app.use(express.static(__dirname));

// ถ้าเข้าที่ root ให้ส่ง index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// รัน server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
