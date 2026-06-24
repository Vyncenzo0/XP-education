import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

window.addEventListener('error', (event) => {
  console.log('Global error caught:', event.message, event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled promise rejection caught:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
          <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
