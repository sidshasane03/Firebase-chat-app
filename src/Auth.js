import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.photoURL) {
        await updateProfile(auth.currentUser, {
          photoURL: result.user.photoURL
        });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" className="auth-button">{isLogin ? 'Login' : 'Sign Up'}</button>
      </form>
      <div className="auth-divider">
        <span>OR</span>
      </div>
      <button onClick={signInWithGoogle} className="google-auth-button">
        Sign in with Google
      </button>
      <button onClick={() => setIsLogin(!isLogin)} className="auth-switch">
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </button>
    </div>
  );
}

export default Auth;