# 📋 CAJERO AUTOMÁTICO DE CONSTANCIAS - GUÍA DE DESARROLLO

## 🎯 PROPÓSITO DEL PROYECTO
Sistema de cajero automático para generar constancias digitales del Instituto Tecnológico Superior de Puerto Peñasco (ITSPP). Diseñado específicamente para pantallas táctiles de 15 pulgadas en modo kiosko.

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### **📁 Estructura de Archivos Obligatoria**
```
/
├── App.jsx                    (PRINCIPAL - Estado global y routing)
├── styles/
│   └── globals.css           (CSS con variables de TecNM)
├── components/
│   ├── HomePage.jsx          (Página de inicio con carrusel y footer)
│   ├── ContestSelection.jsx  (Selección de concursos)
│   ├── TeamSelection.jsx     (Búsqueda y selección de equipos)
│   ├── MemberSelection.jsx   (Selección de participantes)
│   ├── CertificateEdit.jsx   (Edición de constancias con sidebar)
│   ├── PaymentConfirmation.jsx (Confirmación y simulación de pago)
│   ├── PrintingScreen.jsx    (Pantalla de impresión con animaciones)
│   └── ui/                   (Componentes shadcn/ui - NO MODIFICAR)
```

---

## 🎨 DISEÑO Y COLORES INSTITUCIONALES

### **🎨 Paleta de Colores TecNM (OBLIGATORIA)**
```css
/* Colores principales institucionales */
--tech-blue: #2563eb    /* Azul TecNM */
--tech-green: #059669   /* Verde TecNM */ 
--tech-red: #dc2626     /* Rojo TecNM */
--tech-orange: #ea580c  /* Naranja secundario */
--tech-purple: #7c3aed  /* Púrpura secundario */
--tech-cyan: #0891b2    /* Cyan secundario */
```

### **📱 Diseño Responsivo para Cajero**
- **OBLIGATORIO**: `h-screen` en contenedores principales
- **OBLIGATORIO**: Grid layout 4 columnas (3 contenido + 1 sidebar)
- **PROHIBIDO**: Scrolling horizontal o desbordamiento de pantalla
- **OBLIGATORIO**: Sidebar derecho para acciones principales

---

## 🚀 FLUJO DE NAVEGACIÓN

### **📋 Secuencia Obligatoria**
1. **HomePage** → Información institucional + carrusel + footer
2. **ContestSelection** → Cards de concursos disponibles
3. **TeamSelection** → Búsqueda y selección de equipos
4. **MemberSelection** → Checkbox para seleccionar participantes
5. **CertificateEdit** → Sidebar + vista previa + edición de nombres
6. **PaymentConfirmation** → Resumen de pedido + simulación de pago
7. **PrintingScreen** → Animación de impresión + regreso al inicio

---

## 🛠️ COMPONENTES ESPECÍFICOS

### **🏠 HomePage.jsx**
```jsx
- OBLIGATORIO: Carrusel automático de 4 slides (5 segundos)
- OBLIGATORIO: Espacio para imagen de curso (base de datos)
- OBLIGATORIO: Botón "Comenzar" grande con ícono Star animado
- OBLIGATORIO: Footer institucional con 3 columnas
- PROHIBIDO: Botones de navegación manual del carrusel
```

### **📊 ContestSelection.jsx**
```jsx
- OBLIGATORIO: Cards con gradientes dinámicos por categoría
- OBLIGATORIO: Solo ícono de flecha para regresar (sin texto)
- PROHIBIDO: Estado activo/finalizado de concursos
- OBLIGATORIO: Información: nombre, categoría, fecha, equipos
```

### **👥 TeamSelection.jsx**
```jsx
- OBLIGATORIO: Barra de búsqueda con filtrado en tiempo real
- OBLIGATORIO: Ícono Star en lugar de Users/Groups
- OBLIGATORIO: Solo 3 datos: nombre equipo, líder, categoría
- OBLIGATORIO: Cards con efectos hover y animaciones
```

### **👤 MemberSelection.jsx**
```jsx
- OBLIGATORIO: Checkboxes para selección múltiple
- OBLIGATORIO: Botón "Seleccionar Todos/Deseleccionar Todos"
- OBLIGATORIO: Contador visual de seleccionados
- OBLIGATORIO: Roles con íconos (Crown para líder, Star para otros)
```

### **📝 CertificateEdit.jsx**
```jsx
- OBLIGATORIO: Sidebar izquierdo con lista de participantes
- OBLIGATORIO: Vista previa de constancia (solo nombres editables)
- OBLIGATORIO: Botones Editar/Guardar por participante
- PROHIBIDO: Información adicional del integrante
```

### **💳 PaymentConfirmation.jsx**
```jsx
- OBLIGATORIO: Resumen detallado del pedido
- OBLIGATORIO: Precio por constancia ($25 pesos)
- OBLIGATORIO: Modal de pago con simulación
- OBLIGATORIO: Información de métodos de pago aceptados
```

### **🖨️ PrintingScreen.jsx**
```jsx
- OBLIGATORIO: Animación de impresión progresiva
- OBLIGATORIO: Progress bar con efectos visuales
- OBLIGATORIO: Lista de constancias con estados
- OBLIGATORIO: Animación de confeti al completar
```

---

## ⚙️ CONFIGURACIÓN TÉCNICA

### **📦 Dependencias Obligatorias**
```json
{
  "motion/react": "^latest",
  "lucide-react": "^latest", 
  "shadcn/ui": "componentes incluidos"
}
```

### **🎭 Animaciones Requeridas**
```jsx
// OBLIGATORIO: Usar Motion para:
- Entrada de componentes (initial, animate, transition)
- Hover effects en cards (whileHover, whileTap)
- Elementos flotantes de fondo (rotate, scale infinitos)
- Animaciones de loading y progreso
- Transiciones entre pantallas
```

### **📐 Layout Responsive**
```jsx
// ESTRUCTURA OBLIGATORIA:
<div className="h-screen bg-gradient-to-br flex flex-col">
  <header className="flex-shrink-0" />
  <main className="flex-1 overflow-hidden">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 overflow-y-auto">
        {/* Contenido principal */}
      </div>
      <div className="lg:col-span-1">
        {/* Sidebar de acciones */}
      </div>
    </div>
  </main>
</div>
```

---

## 🎯 REGLAS DE DESARROLLO

### **✅ OBLIGATORIO**
- Usar JavaScript (.jsx) en lugar de TypeScript
- Implementar todos los componentes con animaciones Motion
- Mantener diseño responsivo sin scroll horizontal
- Usar colores institucionales TecNM
- Incluir efectos hover y microinteracciones
- Footer institucional en HomePage
- Sidebar derecho en todas las pantallas principales
- Gradientes dinámicos y sombras

### **❌ PROHIBIDO**
- Modificar componentes de /components/ui/
- Usar clases de Tailwind para font-size, font-weight, line-height
- Crear scroll horizontal
- Omitir animaciones en componentes principales
- Cambiar la estructura de grid establecida
- Modificar flujo de navegación obligatorio

### **⚠️ ESPECIFICACIONES DE CAJERO**
- Pantalla: 15 pulgadas táctil
- Sin teclado físico (solo virtual cuando sea necesario)
- Sin mouse (solo touch)
- Tiempo de sesión limitado
- Interface optimizada para usuarios de pie

---

## 📊 DATOS MOCK

### **🏆 Concursos de Ejemplo**
```javascript
const contests = [
  { id: '1', name: 'Hackathon TecNM 2024', category: 'Desarrollo de Software' },
  { id: '2', name: 'Robótica Avanzada', category: 'Ingeniería Mecatrónica' },
  { id: '3', name: 'Innovación Empresarial', category: 'Administración' }
];
```

### **👥 Equipos de Ejemplo**
```javascript
const teams = [
  { id: '1', name: 'Tech Innovators', leader: 'Ana García López', category: 'Desarrollo Web' },
  { id: '2', name: 'Code Warriors', leader: 'Carlos Mendoza Rivera', category: 'Apps Móviles' }
];
```

---

## 🔧 TROUBLESHOOTING

### **🐛 Errores Comunes**
- **Ref forwarding**: Usar React.forwardRef en componentes UI
- **Missing DialogDescription**: Siempre incluir en modales
- **Overflow**: Verificar h-screen y overflow-hidden
- **Animaciones**: Verificar imports de motion/react

### **🎨 Problemas de Diseño**
- Usar backdrop-blur-xl para efectos cristal
- Gradientes desde colores institucionales
- Sombras consistentes con shadow-xl
- Animaciones suaves con ease-in-out

---

## 📝 NOTAS IMPORTANTES

### **🎨 Filosofía de Diseño**
- **Moderno y dinámico**: Gradientes, animaciones, efectos
- **Profesional**: Colores institucionales TecNM
- **Accesible**: Contrastes adecuados, íconos claros
- **Optimizado para touch**: Botones grandes, espaciado amplio

### **🔄 Mantenimiento**
- Mantener consistencia en animaciones
- Verificar responsive en diferentes resoluciones
- Probar flujo completo sin interrupciones
- Validar tiempos de carga y transiciones

---

## 🚀 DEPLOYMENT

Al implementar este proyecto:

1. **Verificar** que todas las pantallas caben en 15 pulgadas
2. **Probar** el flujo completo sin teclado/mouse
3. **Validar** que las animaciones son fluidas
4. **Confirmar** que los colores institucionales están correctos
5. **Testear** la simulación de pago y impresión

---

**🏛️ Instituto Tecnológico Superior de Puerto Peñasco**  
**🇲🇽 Tecnológico Nacional de México**  
**📅 Sistema de Constancias Automático v2024.1**