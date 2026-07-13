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

export const authService = {
  /**
   * Inicializa la base de datos de usuarios en AsyncStorage usando el users.json por defecto
   * en caso de que no exista ninguna base de datos guardada todavía.
   */
  async initializeUsers(): Promise<void> {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!storedUsers) {
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
        console.log('[AuthService] Base de datos local inicializada con usuarios por defecto.');
      }
    } catch (error) {
      console.error('[AuthService] Error al inicializar usuarios:', error);
    }
  },

  /**
   * Retorna la lista de usuarios registrados en el dispositivo.
   */
  async getUsers(): Promise<User[]> {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        return JSON.parse(storedUsers);
      }
      return defaultUsers;
    } catch (error) {
      console.error('[AuthService] Error al obtener usuarios:', error);
      return defaultUsers;
    }
  },

  /**
   * Autentica a un usuario con correo y contraseña.
   * Si es exitoso, guarda la sesión de forma persistente.
   */
  async login(email: string, password: string): Promise<User> {
    const sanitizedEmail = email.trim().toLowerCase();
    const users = await this.getUsers();

    const user = users.find(
      (u) => u.email.trim().toLowerCase() === sanitizedEmail && u.password === password,
    );

    if (!user) {
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }

    const session: Session = {
      user: { id: user.id, name: user.name, email: user.email },
      isGuest: false,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    return user;
  },

  /**
   * Registra un nuevo usuario de manera local y guarda su sesión iniciada.
   */
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
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const session: Session = {
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      isGuest: false,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    return newUser;
  },

  /**
   * Registra una sesión activa como invitado.
   */
  async guestLogin(): Promise<void> {
    const session: Session = {
      user: null,
      isGuest: true,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  },

  /**
   * Recupera la sesión actual si existe.
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error al obtener sesión actual:', error);
      return null;
    }
  },

  /**
   * Cierra la sesión activa borrándola del almacenamiento local.
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('[AuthService] Error al cerrar sesión:', error);
    }
  },
};
