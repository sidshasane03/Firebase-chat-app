import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Auth from './Auth';
import Chat from './Chat';
import './index.css';
import './App.css';
import './TestStyles.css';

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>Real-Time Chat</h1>
        {user && <button onClick={() => auth.signOut()} className="sign-out-btn">Sign Out</button>}
      </header>
      <main>
        {user ? <Chat /> : <Auth />}
      </main>
    </div>
  );
}

export default App;