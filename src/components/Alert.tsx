import { useEffect, useState } from 'react';
import styles from '../styles/Alert.module.css';

interface AlertProps {
  event: {
    type: string;
    phase: string;
    value: number;
    severity: string;
    description?: string;
  };
  onClose: () => void;
}

export function Alert({ event, onClose }: AlertProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Mobil cihazda 2 saniye, desktop'ta 5 saniye sonra kaldır
    const timeout = isMobile ? 2000 : 5000;
    const timer = setTimeout(onClose, timeout);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, [isMobile, onClose]);

  return (
    <div className={`${styles.alert} ${styles[`alert${event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}`]}`}>
      <button className={styles.alertClose} onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>
      <div className={styles.alertContent}>
        <div className={styles.alertIcon}>
          <i className={`fas ${event.severity === 'high' ? 'fa-radiation-alt' : 'fa-exclamation-triangle'}`}></i>
        </div>
        <div className={styles.alertMessage}>
          <strong>{event.type.toUpperCase()}</strong><br />
          {event.description || 'Event detected'}<br />
          Value: {event.value.toFixed(2)} | Phase: {event.phase}
        </div>
      </div>
    </div>
  );
} 