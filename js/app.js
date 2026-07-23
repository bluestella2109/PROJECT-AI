// ===============================
// PROJECT AI
// app.js
// ===============================

// ローディング画面
window.addEventListener("load", () => {

    const loading = document.getElementById("loading-screen");

    setTimeout(() => {

        loading.style.opacity = "0";

        setTimeout(() => {

            loading.style.display = "none";

        }, 600);

    }, 1800);

});

// ======================================
// パララックス背景
// ======================================

document.addEventListener("mousemove", (e) => {

    const grid = document.querySelector(".grid-background");

    if (!grid) return;

    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    grid.style.transform =
        `translate(${x}px, ${y}px)`;

});

// ======================================
// ボタン演出
// ======================================

document.querySelectorAll(".btn-main, .btn-sub").forEach(button => {

    button.addEventListener("mouseenter", () => {

        button.style.transform = "translateY(-4px) scale(1.03)";

    });

    button.addEventListener("mouseleave", () => {

        button.style.transform = "";

    });

});

// ======================================
// スクロール表示アニメーション
// ======================================

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {
    threshold: 0.2
});

document.querySelectorAll(".glass-card").forEach(card => {

    card.classList.add("hidden");

    observer.observe(card);

});

// ======================================
// AI文字演出
// ======================================

const systemText = document.querySelector(".system-text");

if (systemText) {

    const texts = [

        "AI CORE ONLINE",
        "CONNECTING...",
        "SYSTEM READY",
        "MISSION ACCEPTED"

    ];

    let index = 0;

    setInterval(() => {

        index++;

        if (index >= texts.length) {

            index = 0;

        }

        systemText.style.opacity = 0;

        setTimeout(() => {

            systemText.textContent = texts[index];

            systemText.style.opacity = 1;

        }, 300);

    }, 2500);

}

// ======================================
// デモ用（Firebase導入後に削除）
// ======================================

const currentNumber = document.getElementById("currentNumber");
const waitingCount = document.getElementById("waitingCount");
const waitingTime = document.getElementById("waitingTime");

if (currentNumber) {

    currentNumber.textContent = "AI-015";

}

if (waitingCount) {

    waitingCount.textContent = "23人";

}

if (waitingTime) {

    waitingTime.textContent = "約18分";

}

// ======================================
// コンソール
// ======================================

console.log("%cPROJECT AI", "color:#00d9ff;font-size:24px;font-weight:bold;");
console.log("%cSYSTEM READY", "color:#00ff88;");
