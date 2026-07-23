// ===========================================
// PROJECT AI
// reserve.js
// 第1回
// ===========================================

import {
    db,
    countersRef,
    reservationsRef,
    runTransaction,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where,
    orderBy
} from "./firebase.js";

import {

    collection

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ===========================================
// 定数
// ===========================================

const STORAGE_KEY = "projectAIReservation";

const form = document.getElementById("reserveForm");


// ===========================================
// 初期処理
// ===========================================

window.addEventListener("DOMContentLoaded", () => {

    checkAlreadyReserved();

});


if(form){

    form.addEventListener("submit", reserve);

}


// ===========================================
// 既に予約済みか確認
// ===========================================

function checkAlreadyReserved(){

    const ticket = localStorage.getItem(STORAGE_KEY);

    if(ticket){

        alert(

            "既に予約済みです。\n\n受付番号：" +

            ticket +

            "\n\n予約状況画面へ移動します。"

        );

        location.href="status.html";

    }

}


// ===========================================
// 予約
// ===========================================

async function reserve(event){

    event.preventDefault();

    const people = Number(

        document.getElementById("people").value

    );


    if(

        people < 1 ||

        people > 10

    ){

        alert("人数は1～10人です。");

        return;

    }


    try{

        const ticket = await createReservation(people);

        localStorage.setItem(

            STORAGE_KEY,

            ticket

        );

        alert(

            "予約が完了しました！\n\n受付番号：" +

            ticket

        );

        location.href="status.html";

    }

    catch(error){

        console.error(error);

        alert("予約できませんでした。");

    }

}


// ===========================================
// AI-001生成
// ===========================================

async function createReservation(people){

    return await runTransaction(

        db,

        async(transaction)=>{

            const counterSnap = await transaction.get(

                countersRef

            );

            let nextNumber = 1;

            if(counterSnap.exists()){

                nextNumber =

                counterSnap.data().nextNumber;

            }

            const ticket =

                "AI-" +

                String(nextNumber).padStart(3,"0");

            const reservationRef =

                doc(

                    collection(

                        db,

                        "reservations"

                    ),

                    ticket

                );

            transaction.set(

                reservationRef,

                {

                    ticket:ticket,

                    people:people,

                    status:"waiting",

                    called:false,

                    arrived:false,

                    createdAt:serverTimestamp()

                }

            );

            if(counterSnap.exists()){

                transaction.update(

                    countersRef,

                    {

                        nextNumber:nextNumber+1

                    }

                );

            }

            else{

                transaction.set(

                    countersRef,

                    {

                        nextNumber:2,

                        currentNumber:1

                    }

                );

            }

            return ticket;

        }

    );

}
// ===========================================
// リアルタイム待機人数
// ===========================================

const waitingCountElement =
document.getElementById("waitingCount");

const waitingTimeElement =
document.getElementById("waitingTime");

const currentNumberElement =
document.getElementById("currentNumber");

const waitingQuery = query(

    reservationsRef,

    where("status","==","waiting"),

    orderBy("createdAt")

);

onSnapshot(waitingQuery,(snapshot)=>{

    const waiting = snapshot.size;

    if(waitingCountElement){

        waitingCountElement.textContent =
        waiting + "組";

    }

    if(waitingTimeElement){

        // 1組約5分
        const minutes = waiting * 5;

        waitingTimeElement.textContent =
        "約" + minutes + "分";

    }

});


// ===========================================
// 現在呼び出し中
// ===========================================

onSnapshot(countersRef,(docSnap)=>{

    if(!docSnap.exists()) return;

    const data = docSnap.data();

    if(currentNumberElement){

        currentNumberElement.textContent =

        "AI-" +

        String(data.currentNumber)

        .padStart(3,"0");

    }

});


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

        alert("予約がありません。");

        return;

    }

    const ok = confirm(

        "予約をキャンセルしますか？"

    );

    if(!ok){

        return;

    }

    try{

        const reservationRef =

        doc(

            db,

            "reservations",

            ticket

        );

        await updateDoc(

            reservationRef,

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

        location.reload();

    }

    catch(error){

        console.error(error);

        alert(

            "キャンセルできませんでした。"

        );

    }

}


// ===========================================
// 自分の予約情報取得
// ===========================================

async function loadMyReservation(){

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

    const snap =

    await getDoc(

        reservationRef

    );

    if(!snap.exists()){

        return;

    }

    const data =

    snap.data();

    const ticketElement =

    document.getElementById("ticket");

    const peopleElement =

    document.getElementById("peopleDisplay");

    const statusElement =

    document.getElementById("status");

    if(ticketElement){

        ticketElement.textContent =

        data.ticket;

    }

    if(peopleElement){

        peopleElement.textContent =

        data.people + "人";

    }

    if(statusElement){

        switch(data.status){

            case "waiting":

                statusElement.textContent =

                "待機中";

                break;

            case "called":

                statusElement.textContent =

                "呼び出し中";

                break;

            case "completed":

                statusElement.textContent =

                "案内済み";

                break;

            case "cancelled":

                statusElement.textContent =

                "キャンセル";

                break;

        }

    }

}

loadMyReservation();
// ===========================================
// 管理画面連携
// 第3回（前半）
// ===========================================

// 現在の予約をリアルタイム監視
function watchMyReservation(){

    const ticket = localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    const reservationRef = doc(
        db,
        "reservations",
        ticket
    );

    onSnapshot(reservationRef,(snapshot)=>{

        if(!snapshot.exists()){

            return;

        }

        const data = snapshot.data();

        updateStatusScreen(data);

    });

}

watchMyReservation();


// ===========================================
// 状態表示更新
// ===========================================

function updateStatusScreen(data){

    const statusElement =
        document.getElementById("status");

    if(statusElement){

        switch(data.status){

            case "waiting":

                statusElement.textContent="待機中";

                break;

            case "called":

                statusElement.textContent="呼び出し中";

                showCallNotification();

                break;

            case "completed":

                statusElement.textContent="案内済み";

                showCompletedMessage();

                break;

            case "cancelled":

                statusElement.textContent="キャンセル";

                break;

        }

    }

}


// ===========================================
// 呼び出し通知
// ===========================================

function showCallNotification(){

    let notice =
    document.getElementById("callNotice");

    if(!notice){

        notice=document.createElement("div");

        notice.id="callNotice";

        notice.innerHTML=`

            <div class="call-popup">

                🔔 あなたの順番です！<br>

                受付までお越しください。

            </div>

        `;

        document.body.appendChild(notice);

    }

    playCallSound();

}


// ===========================================
// 効果音
// ===========================================

function playCallSound(){

    const audio = new Audio(
        "assets/audio/call.mp3"
    );

    audio.volume=0.8;

    audio.play().catch(()=>{});

}


// ===========================================
// 案内完了
// ===========================================

function showCompletedMessage(){

    let notice=
    document.getElementById("completeNotice");

    if(notice){

        return;

    }

    notice=document.createElement("div");

    notice.id="completeNotice";

    notice.innerHTML=`

        <div class="complete-popup">

            ご参加ありがとうございました！

        </div>

    `;

    document.body.appendChild(notice);

}
// ===========================================
// 第3回（後半）
// PROJECT AI
// ===========================================


// ===========================================
// 自分の順番を計算
// ===========================================

async function updateQueuePosition(){

    const ticket =
    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    onSnapshot(waitingQuery,(snapshot)=>{

        let position=0;

        snapshot.forEach((docSnap)=>{

            position++;

            if(docSnap.id===ticket){

                const positionElement=
                document.getElementById("queuePosition");

                if(positionElement){

                    positionElement.textContent=
                    position+"組待ち";

                }

            }

        });

    });

}

updateQueuePosition();


// ===========================================
// 待ち時間更新
// ===========================================

async function updateWaitingTime(){

    const positionElement=
    document.getElementById("queuePosition");

    const waitingElement=
    document.getElementById("waitingTime");

    if(!positionElement||!waitingElement){

        return;

    }

    const observer=new MutationObserver(()=>{

        const text=
        positionElement.textContent;

        const number=
        parseInt(text);

        if(isNaN(number)){

            return;

        }

        const minutes=
        number*5;

        waitingElement.textContent=
        "約"+minutes+"分";

    });

    observer.observe(positionElement,{

        childList:true

    });

}

updateWaitingTime();


// ===========================================
// 呼び出し履歴
// ===========================================

const historyElement=
document.getElementById("history");

onSnapshot(

    query(

        reservationsRef,

        where("status","==","completed"),

        orderBy("createdAt","desc")

    ),

    (snapshot)=>{

        if(!historyElement){

            return;

        }

        historyElement.innerHTML="";

        snapshot.forEach((docSnap)=>{

            const data=
            docSnap.data();

            const li=
            document.createElement("li");

            li.textContent=
            data.ticket;

            historyElement.appendChild(li);

        });

    }

);


// ===========================================
// 自分が呼ばれたか判定
// ===========================================

function checkCurrentNumber(){

    onSnapshot(

        countersRef,

        (counter)=>{

            if(!counter.exists()){

                return;

            }

            const current=
            counter.data().currentNumber;

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

            }

        }

    );

}

checkCurrentNumber();


// ===========================================
// 通知API
// ===========================================

async function enableNotification(){

    if(!("Notification" in window)){

        return;

    }

    if(Notification.permission==="default"){

        await Notification.requestPermission();

    }

}

enableNotification();

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
// showCallNotificationを書き換え
// ===========================================

const oldCallFunction=
showCallNotification;

showCallNotification=function(){

    oldCallFunction();

    browserNotification();

};


// ===========================================
// 管理画面から完了になったら
// localStorage削除
// ===========================================

function clearReservation(){

    const ticket=
    localStorage.getItem(STORAGE_KEY);

    if(!ticket){

        return;

    }

    const ref=
    doc(

        db,

        "reservations",

        ticket

    );

    onSnapshot(ref,(snap)=>{

        if(!snap.exists()){

            return;

        }

        const data=
        snap.data();

        if(

            data.status==="completed"||

            data.status==="cancelled"

        ){

            localStorage.removeItem(

                STORAGE_KEY

            );

        }

    });

}

clearReservation();


// ===========================================
// デバッグ
// ===========================================

console.log(

"PROJECT AI Reserve Ready"

);
