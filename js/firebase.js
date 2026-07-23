// ===========================================
// PROJECT AI
// Firebase 初期設定
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    increment,
    runTransaction,
    onSnapshot,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ===========================================
// Firebase設定
// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// Firebaseコンソールからコピーした内容に変更してください。
// ===========================================

const firebaseConfig = {

    apiKey: "AIzaSyDLMkpmzqZ5x3RWfAfKONtjHqWFY_iz4mk",

    authDomain: "project-ai-b00e3.firebaseapp.com",

    projectId: "project-ai-b00e3",

    storageBucket: "project-ai-b00e3.firebasestorage.app",

    messagingSenderId: "8669250721",
  
    appId: "1:8669250721:web:a8ef55889da433d4699ce0",

    measurementId: "G-GX1WBLHWBM"

};


// ===========================================
// 初期化
// ===========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


// ===========================================
// Firestore参照
// ===========================================

const countersRef = doc(db, "counters", "system");

const reservationsRef = collection(db, "reservations");


// ===========================================
// 外部へ公開
// ===========================================

export {

    db,

    auth,

    countersRef,

    reservationsRef,

    doc,

    getDoc,

    setDoc,

    updateDoc,

    addDoc,

    collection,

    increment,

    serverTimestamp,

    runTransaction,

    onSnapshot,

    query,

    where,

    orderBy,

    signInWithEmailAndPassword,

    signOut,

    onAuthStateChanged

};
