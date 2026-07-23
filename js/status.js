// ===========================================
// PROJECT AI
// status.js
// 第1回
// ===========================================

import {
    db,
    countersRef,
    reservationsRef,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy
} from "./firebase.js";

const STORAGE_KEY = "projectAIReservation";

const ticketElement =
document.getElementById("ticket");

const statusElement =
document.getElementById("status");

const peopleElement =
document.getElementById("peopleDisplay");

const waitingCountElement =
document.getElementById("waitingCount");

const waitingTimeElement =
document.getElementById("waitingTime");

const queuePositionElement =
document.getElementById("queuePosition");

const currentNumberElement =
document.getElementById("currentNumber");


// ===========================================
// 初期処理
// ===========================================

window.addEventListener(

    "DOMContentLoaded",

    initialize

);

async function initialize(){

    const ticket =
    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        alert("予約がありません。");

        location.href="reserve.html";

        return;

    }

    ticketElement.textContent = ticket;

    await loadReservation(ticket);

    watchReservation(ticket);

    watchCurrentNumber();

    watchWaiting();

}


// ===========================================
// 自分の予約情報
// ===========================================

async function loadReservation(ticket){

    const reservationRef =

    doc(

        db,

        "reservations",

        ticket

    );

    const snap =

    await getDoc(

        reservationRef

    );

    if(!snap.exists()){

        alert("予約が見つかりません。");

        return;

    }

    const data =

    snap.data();

    peopleElement.textContent =

    data.people + "人";

    updateStatus(

        data.status

    );

}


// ===========================================
// リアルタイム監視
// ===========================================

function watchReservation(ticket){

    const reservationRef =

    doc(

        db,

        "reservations",

        ticket

    );

    onSnapshot(

        reservationRef,

        (snap)=>{

            if(!snap.exists()){

                return;

            }

            const data =

            snap.data();

            peopleElement.textContent =

            data.people + "人";

            updateStatus(

                data.status

            );

        }

    );

}


// ===========================================
// ステータス表示
// ===========================================

function updateStatus(status){

    statusElement.className="status";

    switch(status){

        case "waiting":

            statusElement.textContent="待機中";

            statusElement.classList.add("waiting");

            break;

        case "called":

            statusElement.textContent="呼び出し中";

            statusElement.classList.add("called");

            break;

        case "completed":

            statusElement.textContent="案内済み";

            statusElement.classList.add("completed");

            break;

        case "cancelled":

            statusElement.textContent="キャンセル";

            statusElement.classList.add("cancelled");

            break;

    }

}


// ===========================================
// 呼び出し番号
// ===========================================

function watchCurrentNumber(){

    onSnapshot(

        countersRef,

        (snap)=>{

            if(!snap.exists()){

                return;

            }

            const data =

            snap.data();

            currentNumberElement.textContent=

            "AI-"+

            String(

                data.currentNumber

            ).padStart(

                3,

                "0"

            );

        }

    );

}


// ===========================================
// 待機人数
// ===========================================

function watchWaiting(){

    const q =

    query(

        reservationsRef,

        where(

            "status",

            "==",

            "waiting"

        ),

        orderBy(

            "createdAt"

        )

    );

    onSnapshot(

        q,

        (snapshot)=>{

            waitingCountElement.textContent =

            snapshot.size + "組";

            updatePosition(

                snapshot

            );

        }

    );

}


// ===========================================
// 自分の順番
// ===========================================

function updatePosition(snapshot){

    const ticket =

    localStorage.getItem(STORAGE_KEY);

    let position=0;

    snapshot.forEach((docSnap)=>{

        position++;

        if(docSnap.id===ticket){

            queuePositionElement.textContent=

            position+"組待ち";

            waitingTimeElement.textContent=

            "約"+

            position*5+

            "分";

        }

    });

}

console.log("status.js Ready");
// ===========================================
// PROJECT AI
// status.js 第2回
// ===========================================

// ===========================================
// 呼び出し通知
// ===========================================

function showCallPopup(){

    const notice =
    document.getElementById("callNotice");

    if(!notice){

        return;

    }

    notice.innerHTML = `

        <div class="call-popup">

            🔔 あなたの順番です！<br>
            受付までお越しください。

        </div>

    `;

    playSound();

    browserNotification();

}


// ===========================================
// 効果音
// ===========================================

function playSound(){

    const audio =
    new Audio("assets/audio/call.mp3");

    audio.volume = 0.8;

    audio.play().catch(()=>{});

}


// ===========================================
// ブラウザ通知
// ===========================================

async function requestNotification(){

    if(!("Notification" in window)){

        return;

    }

    if(Notification.permission==="default"){

        await Notification.requestPermission();

    }

}

requestNotification();

function browserNotification(){

    if(Notification.permission==="granted"){

        new Notification(

            "PROJECT AI",

            {

                body:"あなたの順番です！",

                icon:"assets/images/icon.png"

            }

        );

    }

}


// ===========================================
// リアルタイム状態監視
// ===========================================

function watchStatus(){

    const ticket =

    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    const reservationRef =

    doc(

        db,

        "reservations",

        ticket

    );

    onSnapshot(

        reservationRef,

        (snap)=>{

            if(!snap.exists()){

                return;

            }

            const data =

            snap.data();

            switch(data.status){

                case "called":

                    showCallPopup();

                    break;

                case "completed":

                    showCompleted();

                    break;

                case "cancelled":

                    localStorage.removeItem(STORAGE_KEY);

                    alert("予約はキャンセルされました。");

                    location.href="reserve.html";

                    break;

            }

        }

    );

}

watchStatus();


// ===========================================
// 完了画面
// ===========================================

function showCompleted(){

    const complete =

    document.getElementById("completeNotice");

    if(!complete){

        return;

    }

    complete.style.display="flex";

    complete.innerHTML=`

        <div class="complete-popup">

            ご参加ありがとうございました！

        </div>

    `;

    localStorage.removeItem(

        STORAGE_KEY

    );

}


// ===========================================
// キャンセル
// ===========================================

const cancelButton =

document.getElementById("cancelButton");

if(cancelButton){

    cancelButton.addEventListener(

        "click",

        cancelReservation

    );

}

async function cancelReservation(){

    const ticket =

    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    const ok = confirm(

        "予約をキャンセルしますか？"

    );

    if(!ok){

        return;

    }

    try{

        await updateDoc(

            doc(

                db,

                "reservations",

                ticket

            ),

            {

                status:"cancelled"

            }

        );

        localStorage.removeItem(

            STORAGE_KEY

        );

        alert(

            "キャンセルしました。"

        );

        location.href="reserve.html";

    }

    catch(error){

        console.error(error);

        alert("キャンセルできませんでした。");

    }

}


// ===========================================
// 呼び出し履歴
// ===========================================

const historyElement =

document.getElementById("history");

if(historyElement){

    const historyQuery =

    query(

        reservationsRef,

        where(

            "status",

            "==",

            "completed"

        ),

        orderBy(

            "createdAt",

            "desc"

        )

    );

    onSnapshot(

        historyQuery,

        (snapshot)=>{

            historyElement.innerHTML="";

            snapshot.forEach((docSnap)=>{

                const data =

                docSnap.data();

                const li =

                document.createElement("li");

                li.textContent =

                data.ticket;

                historyElement.appendChild(li);

            });

        }

    );

}

console.log("status.js Part2 Ready");
// ===========================================
// PROJECT AI
// status.js
// 第3回
// ===========================================


// ===========================================
// 自分の順番を監視
// ===========================================

function watchQueuePosition(){

    const ticket =
    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    const waitingQuery =

    query(

        reservationsRef,

        where("status","==","waiting"),

        orderBy("createdAt")

    );

    onSnapshot(waitingQuery,(snapshot)=>{

        let position=0;

        let found=false;

        snapshot.forEach((docSnap)=>{

            position++;

            if(docSnap.id===ticket){

                found=true;

            }

        });

        if(!found){

            return;

        }

        const waitingAhead=position-1;

        queuePositionElement.textContent=

        "あと"+waitingAhead+"組";

        waitingTimeElement.textContent=

        "約"+(waitingAhead*5)+"分";

        if(waitingAhead<=3){

            startAttentionAnimation();

        }

    });

}

watchQueuePosition();


// ===========================================
// 画面を点滅
// ===========================================

function startAttentionAnimation(){

    const card=document.querySelector(".card");

    if(!card){

        return;

    }

    card.classList.add("flash");

}


// ===========================================
// 点滅停止
// ===========================================

function stopAttentionAnimation(){

    const card=document.querySelector(".card");

    if(!card){

        return;

    }

    card.classList.remove("flash");

}


// ===========================================
// 呼び出し番号監視
// ===========================================

function watchCurrentCalling(){

    onSnapshot(countersRef,(snap)=>{

        if(!snap.exists()){

            return;

        }

        const data=snap.data();

        const current=data.currentNumber;

        currentNumberElement.textContent=

        "AI-"+

        String(current).padStart(3,"0");

        const ticket=

        localStorage.getItem(STORAGE_KEY);

        if(!ticket){

            return;

        }

        const myNumber=

        Number(

            ticket.replace("AI-","")

        );

        if(current>=myNumber){

            showCallNotification();

            stopAttentionAnimation();

        }

    });

}

watchCurrentCalling();


// ===========================================
// 自動更新時刻
// ===========================================

const updateElement=

document.createElement("p");

updateElement.id="lastUpdate";

updateElement.style.marginTop="20px";

updateElement.style.textAlign="center";

updateElement.style.color="#9fc4ff";

const container=

document.querySelector(".card");

if(container){

    container.appendChild(updateElement);

}

setInterval(()=>{

    const now=new Date();

    updateElement.textContent=

    "最終更新 "

    +

    now.toLocaleTimeString("ja-JP");

},1000);


// ===========================================
// 受付番号コピー
// ===========================================

ticketElement.style.cursor="pointer";

ticketElement.title="クリックでコピー";

ticketElement.addEventListener(

    "click",

    async()=>{

        try{

            await navigator.clipboard.writeText(

                ticketElement.textContent

            );

            alert("受付番号をコピーしました。");

        }

        catch(error){

            console.error(error);

        }

    }

);


// ===========================================
// デバッグ
// ===========================================

console.log("PROJECT AI Status Ready");
