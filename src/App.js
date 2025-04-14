import { useAuthState } from 'react-firebase-hooks/auth';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import Auth from './Auth';
import Chat from './Chat';
import './index.css';
import './App.css';
import './TestStyles.css';

function App() {
  const [user] = useAuthState(auth);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <header>
        <h1>Real-Time Chat</h1>
        <div>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark Mode
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
                Light Mode
              </>
            )}
          </button>
          {user && <button onClick={() => auth.signOut()} className="sign-out-btn">Sign Out</button>}
        </div>
      </header>
      <main>
        {user ? <Chat /> : <Auth />}
      </main>
    </div>
  );
}

export default App;