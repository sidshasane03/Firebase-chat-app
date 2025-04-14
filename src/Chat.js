import { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const { uid, displayName, email } = auth.currentUser;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      timestamp: serverTimestamp(),
      uid,
      displayName: displayName || email.split('@')[0],
    });

    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="profile-photo"
          />
        ) : (
          <div className="profile-photo-fallback">
            {user.email[0].toUpperCase()}
          </div>
        )}
        <div className="profile-info">
          <span className="profile-name">{user.displayName || user.email.split('@')[0]}</span>
        </div>
      </div>
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.uid === auth.currentUser?.uid ? 'sent' : 'received'}`}
          >
            <span className={`sender ${message.uid === auth.currentUser?.uid ? 'sent' : ''}`}>
              {message.displayName}
            </span>
            <p>{message.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;