// =========================
// PROJECT AI - app.js
// =========================

import { db, auth } from "./firebase.js";

// ローディング画面
const loading = document.getElementById("loading-screen");

// 通知エリア
const notification = document.getElementById("notification");

// AIメッセージ一覧
const messages = [
  "PROJECT AIへようこそ",
  "AI CORE 接続完了",
  "実験システム正常稼働中",
  "まもなく受付を開始します",
  "幸運を祈ります。"
];

// ページ読み込み完了
window.addEventListener("load", () => {

  // ローディングを消す
  setTimeout(() => {
    if (loading) {
      loading.style.transition = "opacity 0.8s";
      loading.style.opacity = "0";

      setTimeout(() => {
        loading.remove();
      }, 800);
    }
  }, 1800);

  // 通知開始
  rotateMessages();

});

// =========================
// 通知メッセージ切り替え
// =========================

function rotateMessages() {

  if (!notification) return;

  let index = 0;

  notification.textContent = messages[index];

  setInterval(() => {

    index++;

    if (index >= messages.length) {
      index = 0;
    }

    notification.animate(
      [
        {
          transform: "translateX(120%)",
          opacity: 0
        },
        {
          transform: "translateX(0)",
          opacity: 1
        }
      ],
      {
        duration: 500,
        fill: "forwards"
      }
    );

    notification.textContent = messages[index];

  }, 5000);

}

// =========================
// BGM
// =========================

const musicButton = document.getElementById("musicButton");
const bgm = document.getElementById("bgm");

if (musicButton && bgm) {

  musicButton.addEventListener("click", () => {

    if (bgm.paused) {

      bgm.play().catch(() => {});

      musicButton.textContent = "🔊";

    } else {

      bgm.pause();

      musicButton.textContent = "🔇";

    }

  });

}

// =========================
// スクロールフェードイン
// =========================

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if (entry.isIntersecting) {

      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";

    }

  });

});

document.querySelectorAll("section").forEach((section) => {

  section.style.opacity = "0";
  section.style.transform = "translateY(30px)";
  section.style.transition = "0.6s";

  observer.observe(section);

});