// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLMkpmzqZ5x3RWfAfKONTjHqWFY_iz4mk",
  authDomain: "project-ai-b00e3.firebaseapp.com",
  projectId: "project-ai-b00e3",
  storageBucket: "project-ai-b00e3.firebasestorage.app",
  messagingSenderId: "8669250721",
  appId: "1:8669250721:web:a8ef55889da433d4699ce0",
  measurementId: "G-GX1WBLHWBM"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore
const db = getFirestore(app);

// Authentication
const auth = getAuth(app);

// 他のJavaScriptから使えるようにする
export { db, auth };