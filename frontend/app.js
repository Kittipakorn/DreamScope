const interpretBtn = document.getElementById("interpretBtn");
const dreamInput = document.getElementById("dreamInput");
const resultBox = document.getElementById("resultBox");
const historyList = document.getElementById("historyList");
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const bg = document.querySelector(".bg-move");
const newDream = document.getElementById("newDream");

let currentId = null;

async function fetchDreams() {
  const res = await fetch("http://localhost:3000/api/dreams");
  const dreams = await res.json();
  historyList.innerHTML = "";
  dreams.forEach(addDreamToHistory);
}
fetchDreams();

async function sendPrompt(dreamText) {
  const prompt = dreamText;

  let dotCount = 0;
  resultBox.innerHTML = "⏳ กำลังโหลด";

  const loadingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4; // 0,1,2,3
    let dots = ".".repeat(dotCount);
    resultBox.innerHTML = `⏳ กำลังโหลด${dots}`;
  }, 500); // ทุก 500ms

  try {
    const res = await fetch("http://localhost:3000/api/chat", { // ✅ เรียก backend โดยตรง
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dream: prompt }),
    });
    clearInterval(loadingInterval);
    const data = await res.json();
    return data.reply;
  } catch (err) {
    clearInterval(loadingInterval);
    return "❌ เกิดข้อผิดพลาด: " + err.message;
  }
}

// ฟังก์ชันเพิ่มประวัติ
function addDreamToHistory(dream) {
    const { _id, title ,text, interpretation, date } = dream;

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0
    const formattedDate = `${day}/${month}`;

    const li = document.createElement("li");
    li.dataset.id = _id;

    li.innerHTML = `
      <div class="dreamsList">
        <div>${formattedDate}</div>
        <div class="dreamText">${title}</div>
        <div class="deleteButton" title="ลบความฝัน">
            <svg fill="#db4347" height="22px" width="22px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 458.5 458.5" xml:space="preserve" stroke="#db4343"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path d="M382.078,57.069h-89.78C289.128,25.075,262.064,0,229.249,0S169.37,25.075,166.2,57.069H76.421 c-26.938,0-48.854,21.916-48.854,48.854c0,26.125,20.613,47.524,46.429,48.793V399.5c0,32.533,26.467,59,59,59h192.508 c32.533,0,59-26.467,59-59V154.717c25.816-1.269,46.429-22.668,46.429-48.793C430.933,78.985,409.017,57.069,382.078,57.069z M229.249,30c16.244,0,29.807,11.673,32.76,27.069h-65.52C199.442,41.673,213.005,30,229.249,30z M354.503,399.501 c0,15.991-13.009,29-29,29H132.995c-15.991,0-29-13.009-29-29V154.778c12.244,0,240.932,0,250.508,0V399.501z M382.078,124.778 c-3.127,0-302.998,0-305.657,0c-10.396,0-18.854-8.458-18.854-18.854S66.025,87.07,76.421,87.07h305.657 c10.396,0,18.854,8.458,18.854,18.854S392.475,124.778,382.078,124.778z"></path> <path d="M229.249,392.323c8.284,0,15-6.716,15-15V203.618c0-8.284-6.715-15-15-15c-8.284,0-15,6.716-15,15v173.705 C214.249,385.607,220.965,392.323,229.249,392.323z"></path> <path d="M306.671,392.323c8.284,0,15-6.716,15-15V203.618c0-8.284-6.716-15-15-15s-15,6.716-15,15v173.705 C291.671,385.607,298.387,392.323,306.671,392.323z"></path> <path d="M151.828,392.323c8.284,0,15-6.716,15-15V203.618c0-8.284-6.716-15-15-15c-8.284,0-15,6.716-15,15v173.705 C136.828,385.607,143.544,392.323,151.828,392.323z"></path> </g> </g> </g> </g></svg>
        </div>
      </div>
    `;

    // คลิกเพื่อลบ
    li.querySelector(".deleteButton").addEventListener("click", async (e) => {
        e.stopPropagation();
        await fetch(`http://localhost:3000/api/dreams/${_id}`, { method: "DELETE" });
        if (currentId === _id) currentId = null;
        fetchDreams();
    });

    // คลิกเพื่อโหลดผลลัพธ์กลับมา
    li.querySelector(".dreamsList").addEventListener("click", () => {
        dreamInput.value = text;
        resultBox.innerHTML = `${interpretation}`;
        currentId = _id;
    });

    historyList.append(li);
}

// เมื่อกดปุ่มตีความ
interpretBtn.addEventListener("click", async () => {
  const dreamText = dreamInput.value.trim();
  if (!dreamText) {
    resultBox.innerHTML = "⚠️ กรุณาพิมพ์ความฝันของคุณก่อน!";
    return;
  }

  let responseText = await sendPrompt(dreamText);

  console.log(responseText);

  responseText = responseText.replace(/```json|```/g, "").trim();
  
  console.log(responseText);
  responseText = JSON.parse(responseText);

  console.log(responseText);
  
  // resultBox.innerHTML = `${responseText.interpretation}`;

  resultBox.innerHTML = ""; // เคลียร์ก่อน
    let i = 0;
    const interval = setInterval(() => {
        resultBox.innerHTML += responseText.interpretation[i];
        i++;
        if (i >= responseText.interpretation.length) clearInterval(interval);
  }, 50);


  if (currentId) {
    // --- UPDATE ---
    try {
      const res = await fetch(`http://localhost:3000/api/dreams/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: responseText.title,text: dreamText,interpretation: responseText.interpretation })
      });

      const updatedDream = await res.json();
      console.log("Updated:", updatedDream);
      // อัปเดต text ใน UI ด้วย
      const li = historyList.querySelector(`li[data-id="${currentId}"]`);
      if (li) {
        li.querySelector(".dreamText").textContent = updatedDream.text;
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  } else {
    // --- CREATE ---
    const res = await fetch("http://localhost:3000/api/dreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: responseText.title, text: dreamText,interpretation: responseText.interpretation })
    });

    const data = await res.json();
    currentId = data._id; // ใช้ _id จาก MongoDB
  }
  fetchDreams();
});

newDream.addEventListener("click", () => {
    resultBox.innerHTML = `ผลลัพธ์จะปรากฏที่นี่...`;
    dreamInput.value = "";
    currentId = null;
});

// toggle sidebar
toggleSidebar.addEventListener("click", () => {
    sidebar.classList.add("show");
    toggleSidebar.classList.add("hidden");
});

closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("show");
    toggleSidebar.classList.remove("hidden");
});

// effect พื้นหลังเคลื่อนไหวตามเมาส์
document.addEventListener("mousemove", (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 2;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;
    const maxShift = 15;

    bg.style.transform = `translate(${xRatio * maxShift}px, ${yRatio * maxShift}px)`;
});
