import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAzdlb6LA3GvS1_bJ8sUBeuEM3KJGBzBSs",
  authDomain: "nova-c4819.firebaseapp.com",
  projectId: "nova-c4819",
  storageBucket: "nova-c4819.firebasestorage.app",
  messagingSenderId: "208491483739",
  appId: "1:208491483739:web:32d697c50f5e9d6f75257e",
  measurementId: "G-VYXD6Q910E",
};

export const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();