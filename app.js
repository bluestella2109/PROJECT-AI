import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, 
  runTransaction, serverTimestamp, onSnapshot, collection, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyDLMkpmzqZ5x3RWfAfKONtjHqWFY_iz4mk",
  authDomain: "project-ai-b00e3.firebaseapp.com",
  projectId: "project-ai-b00e3",
  storageBucket: "project-ai-b00e3.firebasestorage.app",
  messagingSenderId: "8669250721",
  appId: "1:8669250721:web:a8ef55889da433d4699ce0",
  measurementId: "G-GX1WBLHWBM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const AVERAGE_WAIT_PER_GROUP = 5; 
let myTicketNumber = localStorage.getItem("my_ticket_id") || null;

// --- ⑥ 背景サイバー数字エフェクト (Canvas) ---
function initCyberBackground() {
  const canvas = document.getElementById("cyber-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const chars = "0123456789ABCDEF";
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(6, 9, 14, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#889aaa"; // うす灰色
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 50);
}

// --- ページ切り替え ---
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');
  checkReservationStatus();
};

// --- Firebase リアルタイム監視 ---
function initRealtimeListeners() {
  onSnapshot(doc(db, "counters", "queue"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const el = document.getElementById("current-calling-num");
      if (el) el.innerText = data.currentNumber || "---";
    }
  });

  const q = query(collection(db, "tickets"), where("status", "==", "待機中"));
  onSnapshot(q, (snapshot) => {
    const el = document.getElementById("total-waiting-count");
    if (el) el.innerText = snapshot.size;
    updateMyWaitInfo(snapshot);
  });
}

// --- 予約処理 ---
window.makeReservation = async function() {
  if (myTicketNumber) return alert("既に予約が存在します。");

  const peopleSelect = document.getElementById("people-count");
  const peopleCount = peopleSelect ? parseInt(peopleSelect.value) : 1;
  const btn = document.getElementById("btn-submit-reserve");
  if (btn) btn.disabled = true;

  try {
    const newTicketId = await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "counters", "queue");
      const counterDoc = await transaction.get(counterRef);

      let nextNum = 1;
      if (counterDoc.exists()) {
        nextNum = (counterDoc.data().nextNumber || 0) + 1;
      }

      const formattedId = "AI-" + String(nextNum).padStart(3, '0');

      transaction.set(counterRef, { nextNumber: nextNum }, { merge: true });

      const ticketRef = doc(db, "tickets", formattedId);
      transaction.set(ticketRef, {
        ticket: formattedId,
        people: peopleCount,
        status: "待機中",
        createdAt: serverTimestamp()
      });

      return formattedId;
    });

    localStorage.setItem("my_ticket_id", newTicketId);
    myTicketNumber = newTicketId;

    if ("Notification" in window) Notification.requestPermission();

    alert(`予約が完了しました！ あなたの番号: ${newTicketId}`);
    window.showPage("status");
  } catch (e) {
    console.error(e);
    alert("予約処理に失敗しました。");
  } finally {
    if (btn) btn.disabled = false;
  }
};

// --- 自分の予約状況＆待ち時間計算 ---
function updateMyWaitInfo(waitingSnapshot) {
  if (!myTicketNumber) return;

  onSnapshot(doc(db, "tickets", myTicketNumber), (docSnap) => {
    if (!docSnap.exists()) {
      clearMyTicket();
      return;
    }

    const data = docSnap.data();
    const idEl = document.getElementById("my-ticket-id");
    const badgeEl = document.getElementById("my-status-badge");

    if (idEl) idEl.innerText = data.ticket;
    if (badgeEl) badgeEl.innerText = data.status;

    if (data.status === "呼び出し中") {
      triggerCallNotification();
    } else if (data.status === "案内済み") {
      alert("ご案内が完了しました。ご利用ありがとうございました！");
      clearMyTicket();
      window.showPage("hero");
      return;
    }

    let aheadCount = 0;
    waitingSnapshot.docs.forEach(doc => {
      if (doc.id < myTicketNumber) aheadCount++;
    });

    const posEl = document.getElementById("my-position");
    const waitEl = document.getElementById("my-wait-time");
    if (posEl) posEl.innerText = aheadCount;
    if (waitEl) waitEl.innerText = aheadCount * AVERAGE_WAIT_PER_GROUP;
  });
}

function checkReservationStatus() {
  const reserveForm = document.getElementById("reserve-form-container");
  const alreadyReserved = document.getElementById("already-reserved-msg");
  const myTicketArea = document.getElementById("my-ticket-area");
  const noTicketArea = document.getElementById("no-ticket-area");

  if (myTicketNumber) {
    if (reserveForm) reserveForm.classList.add("hidden");
    if (alreadyReserved) alreadyReserved.classList.remove("hidden");
    if (myTicketArea) myTicketArea.classList.remove("hidden");
    if (noTicketArea) noTicketArea.classList.add("hidden");
  } else {
    if (reserveForm) reserveForm.classList.remove("hidden");
    if (alreadyReserved) alreadyReserved.classList.add("hidden");
    if (myTicketArea) myTicketArea.classList.add("hidden");
    if (noTicketArea) noTicketArea.classList.remove("hidden");
  }
}

// キャンセル機能
window.cancelReservation = async function() {
  if (!confirm("本当にキャンセルしますか？")) return;
  try {
    await updateDoc(doc(db, "tickets", myTicketNumber), { status: "キャンセル" });
    clearMyTicket();
    alert("キャンセルしました。");
    window.showPage("hero");
  } catch (e) {
    alert("キャンセル処理に失敗しました。");
  }
};

function clearMyTicket() {
  localStorage.removeItem("my_ticket_id");
  myTicketNumber = null;
  checkReservationStatus();
}

// ③ 呼び出し通知（音・バイブレーション・Web Notification）
function triggerCallNotification() {
  const modal = document.getElementById("notification-modal");
  if (modal) modal.classList.remove("hidden");

  // バイブレーション（スマホ対応）
  if ("vibrate" in navigator) {
    navigator.vibrate([500, 200, 500, 200, 1000]);
  }

  playBeepSound();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("【AI迷宮】お呼び出し", {
      body: "あなたの順番が来ました！受付までお越しください。",
    });
  }
}

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log("Audio play error", e);
  }
}

window.closeModal = function() {
  const modal = document.getElementById("notification-modal");
  if (modal) modal.classList.add("hidden");
};

window.copyTicketId = function() {
  if (myTicketNumber) {
    navigator.clipboard.writeText(myTicketNumber);
    alert("受付番号をコピーしました");
  }
};

// --- 管理者機能 ---
window.adminLogin = async function() {
  const email = document.getElementById("admin-email").value;
  const pass = document.getElementById("admin-pass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert("ログイン失敗: " + e.message);
  }
};

window.adminLogout = function() {
  signOut(auth);
};

onAuthStateChanged(auth, (user) => {
  const loginArea = document.getElementById("admin-login-area");
  const panelArea = document.getElementById("admin-panel-area");

  if (user) {
    if (loginArea) loginArea.classList.add("hidden");
    if (panelArea) panelArea.classList.remove("hidden");
    loadAdminQueue();
    loadAdminHistoryAndStats(); // ④, ⑤ 履歴＆統計読み込み
  } else {
    if (loginArea) loginArea.classList.remove("hidden");
    if (panelArea) panelArea.classList.add("hidden");
  }
});

// ② 待機・呼び出し一覧のロード (人数の列を表示)
function loadAdminQueue() {
  const q = query(
    collection(db, "tickets"), 
    where("status", "in", ["待機中", "呼び出し中", "保留"]), 
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("admin-waiting-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><strong>${data.ticket}</strong></td>
        <td>${data.people}名</td>
        <td><span class="badge">${data.status}</span></td>
        <td>
          <button class="small-btn blue-btn" onclick="updateTicketStatus('${data.ticket}', '案内済み')">完了</button>
          <button class="small-btn warning-btn" onclick="updateTicketStatus('${data.ticket}', '保留')">保留</button>
          <button class="small-btn danger-btn" onclick="updateTicketStatus('${data.ticket}', '不在キャンセル')">不在</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ④, ⑤ 履歴・統計データのロード
function loadAdminHistoryAndStats() {
  const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    let totalGroups = 0;
    let totalPeople = 0;
    let guidedPeople = 0;

    const historyTbody = document.getElementById("admin-history-tbody");
    if (historyTbody) historyTbody.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      totalGroups++;
      const p = data.people || 0;
      totalPeople += p;

      if (data.status === "案内済み") {
        guidedPeople += p;
      }

      // 履歴テーブルの作成（案内済み／キャンセル／不在）
      if (["案内済み", "キャンセル", "不在キャンセル"].includes(data.status)) {
        if (historyTbody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${data.ticket}</td>
            <td>${data.people}名</td>
            <td>${data.status}</td>
          `;
          historyTbody.appendChild(tr);
        }
      }
    });

    // ⑤ 累計人数の表示更新
    document.getElementById("stat-total-groups").innerText = totalGroups;
    document.getElementById("stat-total-people").innerText = totalPeople;
    document.getElementById("stat-guided-people").innerText = guidedPeople;
  });
}

// ① 操作用アクション関数
window.callNext = async function() {
  try {
    const q = query(
      collection(db, "tickets"), 
      where("status", "==", "待機中"), 
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const nextId = snapshot.docs[0].id;
      await updateDoc(doc(db, "tickets", nextId), { status: "呼び出し中" });
      await setDoc(doc(db, "counters", "queue"), { currentNumber: nextId }, { merge: true });
    } else {
      alert("待機中のグループはありません。");
    }
  } catch (e) {
    console.error("呼び出しエラー:", e);
  }
};

// ① 呼び出し中を一つ戻す（前の組へ）
window.callPrev = async function() {
  try {
    const q = query(
      collection(db, "tickets"), 
      where("status", "==", "呼び出し中"), 
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const currentId = snapshot.docs[0].id;
      // ステータスを待機中に戻す
      await updateDoc(doc(db, "tickets", currentId), { status: "待機中" });

      // 直前に案内した番号、または空に戻す処理
      const prevQ = query(
        collection(db, "tickets"), 
        where("status", "==", "呼び出し中"), 
        orderBy("createdAt", "desc")
      );
      const prevSnap = await getDocs(prevQ);
      const newCalling = prevSnap.empty ? "---" : prevSnap.docs[0].id;

      await setDoc(doc(db, "counters", "queue"), { currentNumber: newCalling }, { merge: true });
    } else {
      alert("呼び出し中のグループはありません。");
    }
  } catch (e) {
    console.error("戻しエラー:", e);
  }
};

// ① スキップ（保留にする）
window.skipCurrent = async function() {
  try {
    const q = query(
      collection(db, "tickets"), 
      where("status", "==", "呼び出し中"), 
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const currentId = snapshot.docs[0].id;
      await updateDoc(doc(db, "tickets", currentId), { status: "保留" });
      alert(`${currentId} を保留にしました。次の組を呼び出します。`);
      window.callNext();
    } else {
      alert("現在呼び出し中のグループはありません。");
    }
  } catch (e) {
    console.error("スキップエラー:", e);
  }
};

// 個別ステータス更新
window.updateTicketStatus = async function(ticketId, newStatus) {
  try {
    await updateDoc(doc(db, "tickets", ticketId), { status: newStatus });
  } catch (e) {
    console.error("ステータス更新エラー:", e);
  }
};

// 初期化
initRealtimeListeners();
initCyberBackground();
