// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6N6ul0SfdL1Swz3SCUR7OmfUZ0SPcHD4",
  authDomain: "fuentinterview.firebaseapp.com",
  projectId: "fuentinterview",
  storageBucket: "fuentinterview.appspot.com",
  messagingSenderId: "440256569375",
  appId: "1:440256569375:web:e85f05650fcdc703d0f52a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db =  getFirestore(app)
