import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultUsers from '../json/users.json';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface Session {
  user: User | null;
  isGuest: boolean;
}

const USERS_STORAGE_KEY = '@anemia_app:users';
const SESSION_STORAGE_KEY = '@anemia_app:session';

// Almacenamiento en memoria para cuando AsyncStorage falle
let memorySession: Session | null = null;
let memoryUsers: User[] = [];

export const authService = {
  async initializeUsers(): Promise<void> {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!storedUsers) {
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        memoryUsers = defaultUsers;
      } else {
        memoryUsers = JSON.parse(storedUsers);
      }
    } catch (error) {
      console.log('[AuthService] AsyncStorage no disponible, usando memoria.');
      memoryUsers = defaultUsers;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        memoryUsers = JSON.parse(storedUsers);
        return memoryUsers;
      }
      return memoryUsers.length > 0 ? memoryUsers : defaultUsers;
    } catch (error) {
      return memoryUsers.length > 0 ? memoryUsers : defaultUsers;
    }
  },

  async login(email: string, password: string): Promise<User> {
    const sanitizedEmail = email.trim().toLowerCase();
    const users = await this.getUsers();

    const user = users.find(
      (u) => u.email.trim().toLowerCase() === sanitizedEmail && u.password === password
    );

    if (!user) {
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }

    const session: Session = {
      user: { id: user.id, name: user.name, email: user.email },
      isGuest: false,
    };

    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.log('[AuthService] No se pudo guardar sesión en AsyncStorage.');
    }
    memorySession = session;

    return user;
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const sanitizedEmail = email.trim().toLowerCase();
    const users = await this.getUsers();

    const exists = users.some((u) => u.email.trim().toLowerCase() === sanitizedEmail);
    if (exists) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: sanitizedEmail,
      password: password,
    };

    users.push(newUser);
    memoryUsers = users;

    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.log('[AuthService] No se pudo guardar usuario en AsyncStorage.');
    }

    const session: Session = {
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      isGuest: false,
    };

    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.log('[AuthService] No se pudo guardar sesión en AsyncStorage.');
    }
    memorySession = session;

    return newUser;
  },

  // --- ESTE ES EL MÉTODO QUE ESTABA FALLANDO ---
  async guestLogin(): Promise<void> {
    const session: Session = {
      user: null,
      isGuest: true,
    };

    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.log('[AuthService] AsyncStorage no disponible, guardando en memoria.');
    }
    memorySession = session;
  },

  async getCurrentSession(): Promise<Session | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        memorySession = JSON.parse(sessionData);
        return memorySession;
      }
    } catch (error) {
      console.log('[AuthService] AsyncStorage no disponible, usando memoria.');
    }
    return memorySession;
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.log('[AuthService] No se pudo eliminar sesión de AsyncStorage.');
    }
    memorySession = null;
  },
};