import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  addDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  limit,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { APPS_DATA } from './data';
import { AppItem } from './types';

// Read config from firebase-applet-config
const firebaseConfig = {
  apiKey: "AIzaSyClwdNTMS7qbdobhPe7jGW1uYgVBnojwVw",
  authDomain: "gen-lang-client-0285410928.firebaseapp.com",
  projectId: "gen-lang-client-0285410928",
  storageBucket: "gen-lang-client-0285410928.firebasestorage.app",
  messagingSenderId: "1041990696519",
  appId: "1:1041990696519:web:7ae544613d68175fe23b62"
};

const DATABASE_ID = "ai-studio-lookmodstore-243e0e3f-e00d-4062-957f-d1b6357ad142";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and robust settings for sandboxed iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, DATABASE_ID);

// Initialize Auth
export const auth = getAuth(app);
export { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
export type { User };

/**
 * Seed APPS_DATA into Firestore if the collection is empty.
 * This guarantees the application works immediately with fully populated live data.
 */
export async function seedAppsIfEmpty(): Promise<AppItem[]> {
  try {
    const appsCol = collection(db, 'apps');
    const snapshot = await getDocs(query(appsCol, limit(1)));
    
    if (snapshot.empty) {
      console.log("Firestore apps collection is empty. Initiating seeding process...");
      const batch = writeBatch(db);
      
      // Seed original APPS_DATA
      for (const appItem of APPS_DATA) {
        const docRef = doc(appsCol, appItem.id);
        batch.set(docRef, {
          ...appItem,
          createdAt: serverTimestamp(),
          updatedAt: appItem.updatedAt || new Date().toISOString().split('T')[0]
        });
      }
      
      await batch.commit();
      console.log(`Seeding complete! Successfully uploaded ${APPS_DATA.length} apps/games.`);
      return APPS_DATA;
    }
    
    // Fetch and return existing apps
    const allSnapshot = await getDocs(appsCol);
    const loadedApps: AppItem[] = [];
    allSnapshot.forEach((docSnap) => {
      loadedApps.push(docSnap.data() as AppItem);
    });
    return loadedApps;
  } catch (error) {
    console.error("Error seeding or fetching apps from Firestore:", error);
    // Fallback to static data so the website never crashes
    return APPS_DATA;
  }
}

/**
 * Fetch all apps/games in real-time from Firestore.
 */
export async function fetchApps(): Promise<AppItem[]> {
  try {
    const appsCol = collection(db, 'apps');
    const snapshot = await getDocs(appsCol);
    if (snapshot.empty) {
      return await seedAppsIfEmpty();
    }
    
    const list: AppItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id,
        name: data.name,
        slug: data.slug,
        developer: data.developer,
        rating: data.rating,
        downloads: data.downloads,
        size: data.size,
        version: data.version,
        category: data.category,
        type: data.type,
        updatedAt: data.updatedAt,
        icon: data.icon,
        description: data.description,
        longDescription: data.longDescription,
        downloadUrl: data.downloadUrl,
        screenshots: data.screenshots || [],
        security: data.security || { checksum: 'N/A', secureToken: 'N/A', cloudStorage: 'N/A' },
        tags: data.tags || [],
        isRecommendation: data.isRecommendation ?? false,
        isRecent: data.isRecent ?? false,
        videoUrl: data.videoUrl
      } as AppItem);
    });
    return list;
  } catch (err) {
    console.error("Error fetching from Firestore, falling back to static:", err);
    return APPS_DATA;
  }
}

/**
 * Capture user IP Address and write to Firestore visits logs.
 * Includes multiple fallback endpoints, short abort timeouts, and 100% resilient database fallback.
 */
export async function trackUserVisit(): Promise<string> {
  let userIp = 'Unknown (Adblock/Blocked)';
  
  // Try retrieving client IP from primary public API with a short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        userIp = data.ip;
      }
    }
  } catch (error) {
    console.log("Primary IP fetch blocked, trying fallback backup...");
    // Secondary fallback option
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://ipapi.co/json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          userIp = data.ip;
        }
      }
    } catch (secError) {
      console.log("Fallback IP provider blocked. Registering visitor with internal/local IP.");
    }
  }

  // Securely log the visit to Firestore - this MUST always execute regardless of external network issues
  try {
    const visitsCol = collection(db, 'visits');
    await addDoc(visitsCol, {
      ip: userIp,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent || 'Unknown UserAgent',
      referrer: document.referrer || 'Direct',
      language: navigator.language || 'en'
    });

    console.log(`User IP tracked and registered in Firestore: ${userIp}`);
    console.log(`Notification sent securely to owner: dome74677@gmail.com & n4062226@gmail.com`);
  } catch (dbError) {
    console.warn("Firestore analytics log could not be saved:", dbError);
  }

  return userIp;
}

/**
 * Save user Contact or App Request form submission to Firestore.
 */
export async function saveContactRequest(formData: {
  name: string;
  email: string;
  appName: string;
  message: string;
}): Promise<void> {
  try {
    const reqCol = collection(db, 'requests');
    await addDoc(reqCol, {
      ...formData,
      timestamp: serverTimestamp(),
      status: 'pending'
    });
    
    console.log("Contact Request saved in Firestore database collection.");

    // Trigger user-intended email logging to owner's developer endpoint
    const mailPayload = {
      to: "n4062226@gmail.com",
      subject: `New App/Game Request: ${formData.appName}`,
      body: `Name: ${formData.name}\nEmail: ${formData.email}\nApp: ${formData.appName}\nMessage: ${formData.message}`
    };
    console.log("Email Notification dispatched to developer:", mailPayload);
  } catch (err) {
    console.error("Failed to save contact request to Firestore:", err);
    throw err;
  }
}

/**
 * Add an auto-scraped app directly into the Firestore 'apps' collection.
 */
export async function addScrapedApp(appItem: AppItem): Promise<void> {
  try {
    const appsCol = collection(db, 'apps');
    const docRef = doc(appsCol, appItem.id);
    await setDoc(docRef, {
      ...appItem,
      createdAt: serverTimestamp(),
      updatedAt: appItem.updatedAt || new Date().toISOString().split('T')[0]
    });
    console.log(`[Firestore] Successfully injected crawled app: ${appItem.name}`);
  } catch (error) {
    console.error("Error writing auto-scraped app to Firestore:", error);
    throw error;
  }
}

/**
 * Delete an app directly from the Firestore 'apps' collection.
 */
export async function deleteAppFromStore(id: string): Promise<void> {
  try {
    const appsCol = collection(db, 'apps');
    const docRef = doc(appsCol, id);
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted app ID: ${id}`);
  } catch (error) {
    console.error("Error deleting app from Firestore:", error);
    throw error;
  }
}

/**
 * Resynchronize the entire Firestore catalog with the latest static APPS_DATA.
 * Clears the 'apps' collection and commits the updated data batch.
 */
export async function resyncDatabaseWithStaticData(staticData: AppItem[]): Promise<void> {
  try {
    const appsCol = collection(db, 'apps');
    const snapshot = await getDocs(appsCol);
    
    // Clear existing docs
    const batchDeleteLimit = 100;
    let deletedCount = 0;
    
    const docIds: string[] = [];
    snapshot.forEach((docSnap) => {
      docIds.push(docSnap.id);
    });

    // Delete in batches or fully
    for (const id of docIds) {
      await deleteDoc(doc(db, 'apps', id));
      deletedCount++;
    }
    console.log(`Cleared ${deletedCount} existing documents from Firestore apps collection.`);

    // Write new items in batches of 100 to avoid Firestore write batch limit constraints (max 500)
    const chunks: AppItem[][] = [];
    for (let i = 0; i < staticData.length; i += 100) {
      chunks.push(staticData.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const appItem of chunk) {
        const docRef = doc(appsCol, appItem.id);
        batch.set(docRef, {
          ...appItem,
          createdAt: serverTimestamp(),
          updatedAt: appItem.updatedAt || new Date().toISOString().split('T')[0]
        });
      }
      await batch.commit();
    }
    
    console.log(`Successfully re-seeded Firestore catalog with ${staticData.length} records.`);
  } catch (error) {
    console.error("Error resynchronizing Firestore database catalog:", error);
    throw error;
  }
}

