// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));


// ✅ สร้าง schema + model
const dreamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  interpretation: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Dream = mongoose.model("Dream", dreamSchema);

// --- CRUD --- //

// CREATE
app.post("/api/dreams", async (req, res) => {
  const { title, text, interpretation } = req.body;
  const dream = new Dream({ title,text, interpretation });
  await dream.save();
  res.json(dream);
});

// READ (all)
app.get("/api/dreams", async (req, res) => {
  const dreams = await Dream.find({}).sort({ date: -1 });
  res.json(dreams);
});

// UPDATE
app.put("/api/dreams/:id", async (req, res) => {
  const { id } = req.params;
  const { title , text , interpretation } = req.body;
  const dream = await Dream.findByIdAndUpdate(
    id,
    { title, text , interpretation },
    { new: true }
  );
  res.json(dream);
});

// DELETE
app.delete("/api/dreams/:id", async (req, res) => {
  const { id } = req.params;
  await Dream.findByIdAndDelete(id);
  res.json({ success: true });
});

const API_KEYS = process.env.GEMINI_KEYS.split(",");
let currentKeyIndex = 0;

function getClient() {
  return new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
}

// GEMINI
app.post("/api/chat", async (req, res) => {
  try {
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านจิตวิทยาและการวิเคราะห์ความฝัน 
      หน้าที่ของคุณคือช่วยตีความความฝันของฉัน โดยมีขั้นตอนดังนี้:

      1. สรุปสัญลักษณ์หลัก (เช่น คน สัตว์ วัตถุ สถานที่ เหตุการณ์) ที่ปรากฏในฝัน
      2. วิเคราะห์ความหมายเชิงจิตวิทยาและเชื่อมโยงกับจิตใต้สำนึก
      3. อธิบายว่าฝันนี้สะท้อนอารมณ์ ความกลัว ความหวัง หรือแรงกดดันใดในชีวิตจริง
      4. สรุปเป็น insight สั้น ๆ ที่ใช้เตือนใจได้

      โดยอาจไม่ระบุฝันแบบไม่ละเอียดก็ได้ ตีความเท่าข้อมูลที่มีก็เพียงพอ

      ตอบกลับมาในรูปแบบ JSON:
      {
        "title": "ชื่อฝัน คุณตั้งเองได้ตามข้อมูลความฝันที่ให้",
        "interpretation": "คำตีความ ไม่ต้องย้อนคำถาม ไม่ตอบนอกเหนือจากคำทำนาย (ตอบรูปแบบ text เท่านั้น)"
      }

      ฝันคือ: ${req.body.dream}

      ⚠️ ห้ามทำนายอนาคต ห้ามใช้ดวงชะตา แต่ให้อิงหลักจิตวิทยาและการสะท้อนตนเอง
    `;
    let model = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    res.json({ reply: await result.response.text() });
  } catch (err) {
    console.error(err);
    if (err.status === 429 || err.code === 429) {
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      console.log(`⚠️ Rate limit hit. Switching to key #${currentKeyIndex + 1}`);
      try {
        let model = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
        let result = await model.generateContent(prompt);

        return res.json({ reply: await result.response.text(), usedKey: currentKeyIndex + 1 });
      } catch (retryErr) {
        console.error("❌ Retry failed:", retryErr);
        return res.status(429).json({ error: "Rate limit exceeded on all keys" });
      }
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () =>
  console.log("🚀 Server running at http://localhost:3000")
);
