import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      <CheckCircle size={18} />
      <span>{message}</span>
    </div>
  );
}
