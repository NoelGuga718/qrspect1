import type { User } from '@/types';

const LOCAL_USERS_KEY = 'qrspect_users';
const CURRENT_USER_KEY = 'qrspect_current_user';

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  password: string;
  createdAt: number;
}

export class LocalAuthService {
  private listeners: Set<(user: User | null) => void> = new Set();

  private getUsers(): LocalUser[] {
    const users = localStorage.getItem(LOCAL_USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  private saveUsers(users: LocalUser[]): void {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  private notifyListeners(): void {
    const currentUser = this.getCurrentUser();
    this.listeners.forEach(callback => callback(currentUser));
  }

  signUp(email: string, password: string, displayName: string): User | null {
    const users = this.getUsers();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists with this email');
    }

    const newUser: LocalUser = {
      uid: 'local_' + Date.now().toString(),
      email,
      displayName,
      password, // In production, this should be hashed
      createdAt: Date.now(),
    };

    users.push(newUser);
    this.saveUsers(users);

    const user: User = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: null,
      isAnonymous: false,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  signIn(email: string, password: string): User | null {
    const users = this.getUsers();
    const localUser = users.find(u => u.email === email && u.password === password);

    if (!localUser) {
      throw new Error('Invalid email or password');
    }

    const user: User = {
      uid: localUser.uid,
      email: localUser.email,
      displayName: localUser.displayName,
      photoURL: null,
      isAnonymous: false,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  signInAnonymously(): User {
    const user: User = {
      uid: 'anon_' + Date.now().toString(),
      email: null,
      displayName: 'Guest User',
      photoURL: null,
      isAnonymous: true,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  signOut(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Initial call
    callback(this.getCurrentUser());

    // Add to listeners for same-tab updates
    this.listeners.add(callback);

    // Listen for storage changes (cross-tab updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CURRENT_USER_KEY) {
        callback(this.getCurrentUser());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      this.listeners.delete(callback);
    };
  }
}

export const localAuthService = new LocalAuthService();
