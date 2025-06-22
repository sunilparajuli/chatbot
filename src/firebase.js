import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCgxQ4fPBQGjXKewyzCl6ci3PK6mAknlQY",
  authDomain: "customer-service-ab6ef.firebaseapp.com",
  projectId: "customer-service-ab6ef",
  storageBucket: "customer-service-ab6ef.appspot.com",
  messagingSenderId: "183685574427",
  appId: "1:183685574427:web:70f77c9c8a9aa0c02eadbe",
  measurementId: "G-4WDMEBW5VP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
