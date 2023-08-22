// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDZByKGG7Q0c1cTw2dME7aco0wFeU4mwwE",
    authDomain: "kasi-system.firebaseapp.com",
    databaseURL: "https://kasi-system-default-rtdb.firebaseio.com",
    projectId: "kasi-system",
    storageBucket: "kasi-system.appspot.com",
    messagingSenderId: "566001440944",
    appId: "1:566001440944:web:7c35c20c74583b6ffe4375",
    measurementId: "G-101CERRQHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);