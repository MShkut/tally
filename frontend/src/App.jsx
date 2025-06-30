// frontend/src/App.jsx
import React from 'react';

import { ThemeProvider } from 'contexts/ThemeContext';
import { AppRouter } from 'components/routing/AppRouter';

export function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

