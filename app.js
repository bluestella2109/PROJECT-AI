import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
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
let activeTimers = {}; // タイマー管理用

// --- 背景サイバー数字エフェクト (Canvas) ---
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

    ctx.fillStyle = "#889aaa";
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

      const msgEl = document.getElementById("congestion-text");
      if (msgEl) {
        msgEl.innerText = data.congestionMessage || "ただいま順調にご案内中です";
      }
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

// --- 自分の予約状況＆通知処理（保留・不在キャンセル対応） ---
let lastStatus = "";

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

    // ステータス変更時の処理・通知
    if (data.status !== lastStatus) {
      if (data.status === "呼び出し中") {
        triggerCallNotification("【お呼び出し】", "あなたの順番が来ました！受付までお越しください。");
      } else if (data.status === "保留") {
        triggerCallNotification("【保留通知】", "教室にいらっしゃらないため、保留されました。この番号は10分間ほど保管されます。お早めにいらっしゃるようお願いいたします。");
        alert("教室にいらっしゃらないため、保留されました。この番号は10分間ほど保管されます。お早めにいらっしゃるようお願いいたします。");
      } else if (data.status === "不在キャンセル") {
        alert("保留されていた番号が一定時間が経過したためキャンセルされました。またのご予約をお待ちしております");
        clearMyTicket();
        window.showPage("hero");
        return;
      } else if (data.status === "案内済み") {
        alert("ご案内が完了しました。ご利用ありがとうございました！");
        clearMyTicket();
        window.showPage("hero");
        return;
      }
      lastStatus = data.status;
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
  lastStatus = "";
  checkReservationStatus();
}

// 呼び出し＆保留通知
function triggerCallNotification(title, msg) {
  const modal = document.getElementById("notification-modal");
  const msgEl = document.getElementById("modal-msg");
  if (msgEl) msgEl.innerText = msg;
  if (modal) modal.classList.remove("hidden");

  if ("vibrate" in navigator) {
    navigator.vibrate([500, 200, 500, 200, 1000]);
  }

  playBeepSound();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: msg });
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
    loadAdminHistoryAndStats();
  } else {
    if (loginArea) loginArea.classList.remove("hidden");
    if (panelArea) panelArea.classList.add("hidden");
  }
});

// 管理者一覧（10分タイマー ＆ 経過後赤色点滅対応）
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
      tr.id = `row-${data.ticket}`;

      let timerHtml = "---";
      if (data.status === "保留" && data.onHoldAt) {
        timerHtml = `<span id="timer-${data.ticket}" class="timer-text">計算中...</span>`;
      }

      tr.innerHTML = `
        <td><strong>${data.ticket}</strong></td>
        <td>${data.people}名</td>
        <td><span class="badge">${data.status}</span></td>
        <td>${timerHtml}</td>
        <td>
          <button class="small-btn blue-btn" onclick="updateTicketStatus('${data.ticket}', '案内済み')">完了</button>
          <button class="small-btn warning-btn" onclick="holdTicket('${data.ticket}')">保留</button>
          <button class="small-btn danger-btn" onclick="updateTicketStatus('${data.ticket}', '不在キャンセル')">不在</button>
        </td>
      `;
      tbody.appendChild(tr);

      // 保留中の場合タイマー開始
      if (data.status === "保留" && data.onHoldAt) {
        start10MinTimer(data.ticket, data.onHoldAt.toDate ? data.onHoldAt.toDate() : new Date(data.onHoldAt));
      }
    });
  });
}

// 保留ボタンクリック時（タイムスタンプ保存）
window.holdTicket = async function(ticketId) {
  try {
    await updateDoc(doc(db, "tickets", ticketId), { 
      status: "保留",
      onHoldAt: new Date()
    });
  } catch (e) {
    console.error("保留エラー:", e);
  }
};

// 10分カウントダウンタイマーの計算と赤点滅処理
function start10MinTimer(ticketId, holdTime) {
  if (activeTimers[ticketId]) clearInterval(activeTimers[ticketId]);

  activeTimers[ticketId] = setInterval(() => {
    const timerEl = document.getElementById(`timer-${ticketId}`);
    const rowEl = document.getElementById(`row-${ticketId}`);
    if (!timerEl) {
      clearInterval(activeTimers[ticketId]);
      return;
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now - holdTime) / 1000);
    const remainingSeconds = 600 - elapsedSeconds; // 10分 = 600秒

    if (remainingSeconds <= 0) {
      timerEl.innerText = "10分経過！";
      timerEl.classList.add("expired-timer");
      if (rowEl) rowEl.classList.add("expired-row"); // ★ 赤色で点滅
    } else {
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      timerEl.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);
}

// 履歴・統計データのロード
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

    const groupEl = document.getElementById("stat-total-groups");
    const peopleEl = document.getElementById("stat-total-people");
    const guidedEl = document.getElementById("stat-guided-people");

    if (groupEl) groupEl.innerText = totalGroups;
    if (peopleEl) peopleEl.innerText = totalPeople;
    if (guidedEl) guidedEl.innerText = guidedPeople;
  });
}

// 次の組を呼び出す
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

// 前の組へ戻す
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
      await updateDoc(doc(db, "tickets", currentId), { status: "待機中" });

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

// スキップ（保留にする）
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
      await window.holdTicket(currentId);
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

// 混雑メッセージ更新
window.updateCongestionMessage = async function() {
  const inputEl = document.getElementById("input-congestion-msg");
  if (!inputEl || !inputEl.value.trim()) return alert("メッセージを入力してください。");

  try {
    await setDoc(doc(db, "counters", "queue"), {
      congestionMessage: inputEl.value.trim()
    }, { merge: true });
    alert("混雑状況メッセージを更新しました！");
    inputEl.value = "";
  } catch (e) {
    console.error("更新エラー:", e);
    alert("更新に失敗しました。");
  }
};

// テストデータ全リセット処理
window.resetAllTestData = async function() {
  const confirmFirst = confirm("【警告】すべての予約データおよびカウンターを初期化します。よろしいですか？");
  if (!confirmFirst) return;

  const confirmSecond = confirm("本当に実行しますか？取り消すことはできません。");
  if (!confirmSecond) return;

  try {
    const ticketsSnap = await getDocs(collection(db, "tickets"));
    const deletePromises = ticketsSnap.docs.map(d => deleteDoc(doc(db, "tickets", d.id)));
    await Promise.all(deletePromises);

    await setDoc(doc(db, "counters", "queue"), {
      currentNumber: "---",
      nextNumber: 0,
      congestionMessage: "ただいま順調にご案内中です"
    });

    localStorage.removeItem("my_ticket_id");
    myTicketNumber = null;

    alert("すべてのテストデータが正常に初期化されました。");
    location.reload();
  } catch (e) {
    console.error("リセットエラー:", e);
    alert("データの初期化に失敗しました。");
  }
};

// 初期化実行
initRealtimeListeners();
initCyberBackground();
