import { render, screen } from '@testing-library/react';
import App from './App';
import styles from './App.module.css';  // Note the .module.css extension

// In your JSX:
<div className={styles.chatContainer}></div>
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
