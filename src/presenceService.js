import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Set user as online in Firestore
 * @param {string} uid - User's UID
 * @param {Object} userData - User data (displayName, email, photoURL)
 */
export async function setUserOnline(uid, userData) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      displayName: userData.displayName || userData.email.split('@')[0],
      email: userData.email,
      photoURL: userData.photoURL || null,
      status: 'online',
      lastSeen: serverTimestamp(),
      isTyping: false,
      typingUpdatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user online:', error);
  }
}

/**
 * Set user as offline in Firestore
 * @param {string} uid - User's UID
 */
export async function setUserOffline(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: 'offline',
      lastSeen: serverTimestamp(),
      isTyping: false,
    });
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
}

/**
 * Update user's typing status
 * @param {string} uid - User's UID
 * @param {boolean} isTyping - Is user currently typing
 */
export async function setUserTyping(uid, isTyping) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isTyping,
      typingUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}

/**
 * Get all users except the current user
 * @param {string} currentUid - Current user's UID
 * @returns {Promise<Array>} Array of user objects
 */
export async function getAllOtherUsers(currentUid) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting other users:', error);
    return [];
  }
}

/**
 * Subscribe to real-time updates of other users' status
 * @param {string} currentUid - Current user's UID
 * @param {Function} callback - Callback function to receive updated users
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOtherUsersStatus(currentUid, callback) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      callback(users);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to users:', error);
  }
}

/**
 * Subscribe to current user's status updates
 * @param {string} uid - User's UID
 * @param {Function} callback - Callback function to receive user data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserStatus(uid, callback) {
  try {
    const userRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to user status:', error);
  }
}

/**
 * Format last seen time
 * @param {Timestamp} timestamp - Firebase timestamp
 * @returns {string} Formatted time string
 */
export function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never';

  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
