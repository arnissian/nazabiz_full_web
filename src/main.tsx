import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './portals/shared/styles/index.css'
import App from './portals/shared/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Supprimer le preloader après le chargement complet de la page
window.addEventListener('load', () => {
  const preloader = document.getElementById('global-preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    setTimeout(() => preloader.remove(), 500);
  }
});