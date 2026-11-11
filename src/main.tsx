import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Bersihkan service worker sisa dev mode agar tidak memicu error WebSocket HMR
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
