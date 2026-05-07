import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/app/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { MockDataProvider } from '@/contexts/MockDataContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MockDataProvider>
            <AppRouter />
          </MockDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
