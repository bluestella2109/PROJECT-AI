// =========================
// PROJECT AI - reserve.js
// =========================

// フォーム
const form = document.getElementById("reserveForm");

// 受付番号表示
const preview = document.getElementById("ticketPreview");

// 仮の連番（Firebase導入後はデータベースから取得）
let nextNumber = Number(localStorage.getItem("nextNumber") || "1");

// 3桁表示（001, 002...）
function formatNumber(num) {
  return String(num).padStart(3, "0");
}

// プレビュー表示
preview.textContent = formatNumber(nextNumber);

// =========================
// 予約
// =========================

form?.addEventListener("submit", (e) => {

  e.preventDefault();

  // 一人一回まで
  if (localStorage.getItem("reserved") === "true") {
    alert("この端末では既に予約済みです。");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const people = document.getElementById("people").value;

  if (name === "") {
    alert("お名前を入力してください。");
    return;
  }

  const ticket = "AI-" + formatNumber(nextNumber);

  const reservation = {
    ticket: ticket,
    name: name,
    people: people,
    time: new Date().toLocaleString("ja-JP")
  };

  // 保存
  localStorage.setItem("reservation", JSON.stringify(reservation));
  localStorage.setItem("reserved", "true");

  // 次の番号へ
  nextNumber++;
  localStorage.setItem("nextNumber", nextNumber);

  // 完了メッセージ
  alert(
`予約が完了しました！

受付番号：${ticket}
人数：${people}人

予約状況ページで確認できます。`
  );

  // ステータス画面へ
  location.href = "status.html";

});

// =========================
// 今後Firebaseへ置き換える部分
// =========================
//
// 現在は localStorage を使用しています。
// Firebase導入後は以下を実装します。
//
// ・AI-001 の連番をFirestoreで管理
// ・全員共通の受付番号
// ・予約一覧をリアルタイム更新
// ・一人一回予約（Firebase Authentication対応）
// ・管理画面との同期
// ・キャンセル機能
//