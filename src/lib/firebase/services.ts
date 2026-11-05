import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth, googleProvider } from './config';
import type { ScanResult, User, Stats } from '@/types';

export class FirebaseService {
  async saveScan(scan: Omit<ScanResult, 'id'>): Promise<string | null> {
    try {
      const scanData = {
        ...scan,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'scans'), scanData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving scan:', error);
      return null;
    }
  }

  async saveDangerousLink(
    url: string,
    reason: string,
    aiScore: number,
    flags: string[]
  ): Promise<void> {
    try {
      const dangerLinkData = {
        url,
        reason,
        aiScore,
        flags,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'danger_links'), dangerLinkData);
    } catch (error) {
      console.error('Error saving dangerous link:', error);
    }
  }

  async getUserScans(userId: string, limit_count: number = 50): Promise<ScanResult[]> {
    try {
      const q = query(
        collection(db, 'scans'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          type: data.type,
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          result: data.result,
          timestamp: data.timestamp?.toDate() || new Date(),
          details: data.details,
        } as ScanResult;
      });
    } catch (error) {
      console.error('Error getting user scans:', error);
      return [];
    }
  }

  async getAllScans(limit_count: number = 100): Promise<ScanResult[]> {
    try {
      const q = query(
        collection(db, 'scans'),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          type: data.type,
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          result: data.result,
          timestamp: data.timestamp?.toDate() || new Date(),
          details: data.details,
        } as ScanResult;
      });
    } catch (error) {
      console.error('Error getting all scans:', error);
      return [];
    }
  }

  async getStats(): Promise<Stats> {
    try {
      const scansSnapshot = await getDocs(collection(db, 'scans'));
      let qrScans = 0;
      let linkScans = 0;
      let dangerousBlocked = 0;
      let cautionBlocked = 0;

      scansSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'qr') qrScans++;
        if (data.type === 'link') linkScans++;
        if (data.riskLevel === 'danger') dangerousBlocked++;
        if (data.riskLevel === 'caution') cautionBlocked++;
      });

      return { qrScans, linkScans, dangerousBlocked, cautionBlocked };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { qrScans: 0, linkScans: 0, dangerousBlocked: 0, cautionBlocked: 0 };
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAnonymous: false,
      };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  }

  async signInAnonymously(): Promise<User | null> {
    try {
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;

      return {
        uid: firebaseUser.uid,
        email: null,
        displayName: 'Anonymous User',
        photoURL: null,
        isAnonymous: true,
      };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        callback(null);
      }
    });
  }

  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous,
      };
    }
    return null;
  }
}

export const firebaseService = new FirebaseService();
