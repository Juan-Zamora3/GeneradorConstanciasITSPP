
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc,
  serverTimestamp,
  where 
} from 'firebase/firestore';
import { db } from '../servicios/firebaseConfig';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const { usuario } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!usuario) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'Notificaciones'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.leida).length);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar notificaciones:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Crear una nueva notificación
  const createNotification = async (tipo, titulo, mensaje, datos = {}) => {
    if (!usuario) return;

    try {
      await addDoc(collection(db, 'Notificaciones'), {
        tipo,
        titulo,
        mensaje,
        datos,
        leida: false,
        createdAt: serverTimestamp(),
        usuarioId: usuario.email
      });
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'Notificaciones', notificationId);
      await updateDoc(notifRef, { leida: true });
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.leida);
      const promises = unreadNotifs.map(n => 
        updateDoc(doc(db, 'Notificaciones', n.id), { leida: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
