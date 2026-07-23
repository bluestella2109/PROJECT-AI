// ===========================================
// PROJECT AI
// admin.js
// 第1回
// ===========================================

import {

    db,
    auth,
    countersRef,
    reservationsRef,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged

} from "./firebase.js";

const loginCard =
document.getElementById("loginCard");

const adminPanel =
document.getElementById("adminPanel");

const loginButton =
document.getElementById("loginButton");

const logoutButton =
document.getElementById("logoutButton");

const emailInput =
document.getElementById("email");

const passwordInput =
document.getElementById("password");

const currentNumberElement =
document.getElementById("currentNumber");

const waitingCountElement =
document.getElementById("waitingCount");

const waitingTable =
document.querySelector("#waitingTable tbody");


// ===========================================
// ログイン
// ===========================================

if(loginButton){

    loginButton.addEventListener(

        "click",

        login

    );

}

async function login(){

    const email =
    emailInput.value.trim();

    const password =
    passwordInput.value;

    try{

        await signInWithEmailAndPassword(

            auth,

            email,

            password

        );

    }

    catch(error){

        console.error(error);

        alert("ログインに失敗しました。");

    }

}


// ===========================================
// ログアウト
// ===========================================

if(logoutButton){

    logoutButton.addEventListener(

        "click",

        async()=>{

            await signOut(auth);

        }

    );

}


// ===========================================
// ログイン状態
// ===========================================

onAuthStateChanged(auth,(user)=>{

    if(user){

        loginCard.style.display="none";

        adminPanel.style.display="block";

        watchCounter();

        watchWaitingList();

    }

    else{

        loginCard.style.display="block";

        adminPanel.style.display="none";

    }

});


// ===========================================
// 現在番号
// ===========================================

function watchCounter(){

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

            ).padStart(3,"0");

        }

    );

}


// ===========================================
// 待機一覧
// ===========================================

function watchWaitingList(){

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

            waitingCountElement.textContent=

            snapshot.size+"組";

            waitingTable.innerHTML="";

            snapshot.forEach((docSnap)=>{

                const data =
                docSnap.data();

                const tr =
                document.createElement("tr");

                tr.innerHTML=`

                    <td>${data.ticket}</td>
                    <td>${data.people}人</td>
                    <td>待機中</td>

                `;

                waitingTable.appendChild(tr);

            });

        }

    );

}

console.log("admin.js Part1 Ready");
