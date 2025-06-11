import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

    apiKey: "AIzaSyCMSjSp9pFo4ZSMtFR995qoOffEmmF5T98",
  
    authDomain: "virtual-hub-pl5oy.firebaseapp.com",
  
    projectId: "virtual-hub-pl5oy",
  
    storageBucket: "virtual-hub-pl5oy.firebasestorage.app",
  
    messagingSenderId: "588953929471",
  
    appId: "1:588953929471:web:09bdf04253600ece9daeca"
  
  };
  

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app); 