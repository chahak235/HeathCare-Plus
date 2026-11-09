import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './styles/globals.css';
import './i18n/config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading translations...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);