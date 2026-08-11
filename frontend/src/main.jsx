import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext.jsx'
import { DialogProvider } from './context/DialogContext.jsx'
import AppRoutes from './Routes/AppRoutes.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import SeoMeta from './components/SeoMeta.jsx'
import MaintenanceGate from './components/MaintenanceGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* Por debajo de ThemeProvider porque los diálogos siguen el tema, y por
          encima de todo lo demás para que cualquier pantalla pueda pedir una
          confirmación o lanzar un aviso. */}
      <DialogProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <SeoMeta />
            {/* Va dentro del Router porque la pantalla de mantenimiento enlaza al
                login, y por debajo de AuthProvider porque necesita saber si quien
                mira es administrador. */}
            <MaintenanceGate>
              <AppRoutes />
            </MaintenanceGate>
          </Router>
        </AuthProvider>
      </DialogProvider>
    </ThemeProvider>
  </StrictMode>,
)
