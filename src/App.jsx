// src/App.jsx
import React from 'react'
import RutasApp from './rutas/RutasApp'
import { AuthProvider } from './contexto/AuthContext';
import { NotificationProvider } from './contexto/NotificationContext';

export default function App() {
  return (
    <AuthProvider>
        <NotificationProvider>
          <RutasApp />
        </NotificationProvider>
      </AuthProvider>
  )
}