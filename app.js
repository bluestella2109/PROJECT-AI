import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, 
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

// 定数・ステート
const AVERAGE_WAIT_PER_GROUP = 5; // 1組あたり5分計算
let myTicketNumber = localStorage.getItem("my_ticket_id") || null;

// --- ページ切り替え ---
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  checkReservationStatus();
};

// --- Firebase リアルタイム監視 ---
function initRealtimeListeners() {
  // カウンターのリアルタイム監視（呼び出し中番号）
  onSnapshot(doc(db, "counters", "queue"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("current-calling-num").innerText = data.currentNumber || "---";
    }
  });

  // 全体待機リストの監視
  const q = query(collection(db, "tickets"), where("status", "==", "待機中"));
  onSnapshot(q, (snapshot) => {
    document.getElementById("total-waiting-count").innerText = snapshot.size;
    updateMyWaitInfo(snapshot);
  });
}

// --- 予約処理（Transactionによる自動採番） ---
window.makeReservation = async function() {
  if (myTicketNumber) return alert("既に予約が存在します。");

  const peopleCount = parseInt(document.getElementById("people-count").value);
  const btn = document.getElementById("btn-submit-reserve");
  btn.disabled = true;

  try {
    const newTicketId = await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "counters", "queue");
      const counterDoc = await transaction.get(counterRef);

      let nextNum = 1;
      if (counterDoc.exists()) {
        nextNum = counterDoc.data().nextNumber + 1;
      }

      // 番号を AI-001 形式にフォーマット
      const formattedId = "AI-" + String(nextNum).padStart(3, '0');

      // カウンター更新
      transaction.set(counterRef, { nextNumber: nextNum }, { merge: true });

      // チケットデータ作成
      const ticketRef = doc(db, "tickets", formattedId);
      transaction.set(ticketRef, {
        ticket: formattedId,
        people: peopleCount,
        status: "待機中",
        createdAt: serverTimestamp()
      });

      return formattedId;
    });

    // ローカルストレージ保存（1端末1回）
    localStorage.setItem("my_ticket_id", newTicketId);
    myTicketNumber = newTicketId;
    
    // 通知の許可リクエスト
    if ("Notification" in window) Notification.requestPermission();

    alert(`予約が完了しました！ あなたの番号: ${newTicketId}`);
    showPage("status");
  } catch (e) {
    console.error(e);
    alert("予約処理に失敗しました。");
  } finally {
    btn.disabled = false;
  }
};

// --- 自分の予約状況＆待ち時間計算 ---
function updateMyWaitInfo(waitingSnapshot) {
  if (!myTicketNumber) return;

  // 自分のチケットのリアルタイム監視
  onSnapshot(doc(db, "tickets", myTicketNumber), (docSnap) => {
    if (!docSnap.exists()) {
      // 削除された場合等
      clearMyTicket();
      return;
    }

    const data = docSnap.data();
    document.getElementById("my-ticket-id").innerText = data.ticket;
    document.getElementById("my-status-badge").innerText = data.status;

    if (data.status === "呼び出し中") {
      triggerCallNotification();
    } else if (data.status === "案内済み") {
      alert("ご案内が完了しました。ご利用ありがとうございました！");
      clearMyTicket();
      showPage("hero");
      return;
    }

    // 自分の順番計算
    let aheadCount = 0;
    waitingSnapshot.docs.forEach(doc => {
      if (doc.id < myTicketNumber) aheadCount++;
    });

    document.getElementById("my-position").innerText = aheadCount;
    document.getElementById("my-wait-time").innerText = aheadCount * AVERAGE_WAIT_PER_GROUP;
  });
}

function checkReservationStatus() {
  if (myTicketNumber) {
    document.getElementById("reserve-form-container").classList.add("hidden");
    document.getElementById("already-reserved-msg").classList.remove("hidden");
    document.getElementById("my-ticket-area").classList.remove("hidden");
    document.getElementById("no-ticket-area").classList.add("hidden");
  } else {
    document.getElementById("reserve-form-container").classList.remove("hidden");
    document.getElementById("already-reserved-msg").classList.add("hidden");
    document.getElementById("my-ticket-area").classList.add("hidden");
    document.getElementById("no-ticket-area").classList.remove("hidden");
  }
}

// キャンセル機能
window.cancelReservation = async function() {
  if (!confirm("本当にキャンセルしますか？")) return;
  try {
    await updateDoc(doc(db, "tickets", myTicketNumber), { status: "キャンセル" });
    clearMyTicket();
    alert("キャンセルしました。");
    showPage("hero");
  } catch (e) {
    alert("キャンセル処理に失敗しました。");
  }
};

function clearMyTicket() {
  localStorage.removeItem("my_ticket_id");
  myTicketNumber = null;
  checkReservationStatus();
}

// 呼び出し通知（音・ポップアップ・ブラウザ通知）
function triggerCallNotification() {
  document.getElementById("notification-modal").classList.remove("hidden");
  
  // 効果音再生 (Web Audio APIで生成)
  playBeepSound();

  // ブラウザ通知
  if (Notification.permission === "granted") {
    new Notification("【AI迷宮】お呼び出し", {
      body: "あなたの順番が来ました！受付までお越しください。",
    });
  }
}

function playBeepSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5ノート
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

window.closeModal = function() {
  document.getElementById("notification-modal").classList.add("hidden");
};

window.copyTicketId = function() {
  navigator.clipboard.writeText(myTicketNumber);
  alert("受付番号をコピーしました");
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

// 管理者の認証ステート監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("admin-login-area").classList.add("hidden");
    document.getElementById("admin-panel-area").classList.remove("hidden");
    loadAdminQueue();
  } else {
    document.getElementById("admin-login-area").classList.remove("hidden");
    document.getElementById("admin-panel-area").classList.add("hidden");
  }
});

function loadAdminQueue() {
  const q = query(collection(db, "tickets"), where("status", "in", ["待機中", "呼び出し中"]), orderBy("createdAt", "asc"));
  onSnapshot(q, (snapshot) => {
    const listEl = document.getElementById("admin-waiting-list");
    listEl.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.className = "queue-item";
      li.innerHTML = `
        <span>${data.ticket} (${data.people}名) - <strong>${data.status}</strong></span>
        <button class="small-btn" onclick="completeTicket('${data.ticket}')">案内完了</button>
      `;
      listEl.appendChild(li);
    });
  });
}

// 次の組を呼び出す
window.callNext = async function() {
  const q = query(collection(db, "tickets"), where("status", "==", "待機中"), orderBy("createdAt", "asc"));
  const snapshot = await getDoc(q); // トランザクションまたは最新取得
  
  // 最初のエントリを取得して「呼び出し中」に更新
  onSnapshot(q, async (snap) => {
    if (!snap.empty) {
      const nextDoc = snap.docs[0];
      const nextId = nextDoc.id;

      await updateDoc(doc(db, "tickets", nextId), { status: "呼び出し中" });
      await setDoc(doc(db, "counters", "queue"), { currentNumber: nextId }, { merge: true });
    } else {
      alert("待機中のグループはありません。");
    }
  }, { onlyOnce: true });
};

window.completeTicket = async function(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), { status: "案内済み" });
};

// 初期化
initRealtimeListeners();
