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

// AppRouter expects a default export for proper routing
export default App;
