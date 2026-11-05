import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import IntroOverlay from '@/components/IntroOverlay';
import './index.css';
import './responsive.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntroOverlay>
      <App />
    </IntroOverlay>
  </StrictMode>
);
