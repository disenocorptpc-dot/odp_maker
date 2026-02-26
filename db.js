import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBq4Y-zfQvksbFe36vb0pjagNu8poHvjyg",
    authDomain: "speed-dashboard-8a1a9.firebaseapp.com",
    projectId: "speed-dashboard-8a1a9",
    storageBucket: "speed-dashboard-8a1a9.firebasestorage.app",
    messagingSenderId: "650632424816",
    appId: "1:650632424816:web:bd37e796996ad3db9273b5",
    measurementId: "G-WDR0Z2EDHC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.odpDB = {
    init: async function () {
        try {
            await signInAnonymously(auth);
            console.log("🔥 Firebase Auth Success");
        } catch (e) {
            console.error("Firebase Auth Error", e);
        }
    },
    getDynamicMaterials: async function () {
        try {
            const ref = doc(db, "projects", "odp_maker_materials");
            const snap = await getDoc(ref);
            if (snap.exists() && snap.data().list) {
                return snap.data().list;
            }
        } catch (e) {
            console.error("DB Get Error", e);
        }
        return [];
    },
    saveNewMaterial: async function (materialValue) {
        if (!materialValue || materialValue.trim().length === 0) return;
        try {
            const ref = doc(db, "projects", "odp_maker_materials");
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                await setDoc(ref, { list: [materialValue] });
                console.log("Created materials list with:", materialValue);
            } else {
                await updateDoc(ref, { list: arrayUnion(materialValue) });
                console.log("Added material:", materialValue);
            }
        } catch (e) {
            console.error("DB Save Error", e);
        }
    }
};

window.dispatchEvent(new Event('dbLoaded'));
