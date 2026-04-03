import { doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Mark a message as delivered
 */
export const markMessageAsDelivered = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      status: 'delivered',
      deliveredAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking message as delivered:', error);
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      status: 'read',
      readAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Mark multiple messages as read
 */
export const markMessagesAsRead = async (messageIds) => {
  const updates = messageIds.map((id) =>
    updateDoc(doc(db, 'messages', id), {
      status: 'read',
      readAt: new Date(),
    })
  );

  try {
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};
