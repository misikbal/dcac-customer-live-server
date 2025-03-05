import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Navbar } from '../components/Navbar';
import { Alert } from '../components/Alert';

interface PowerData {
  volt: number[];
  current: number[];
  power: [
    number[], // Reactive Power A, B, C
    number[], // Reactive Power A, B, C
    number[], // Reactive Power A, B, C
    number[], // Active Power A, B, C, N
    number[]  // Apparent Power A, B, C, N
  ];
  events?: Array<{
    type: string;
    phase: string;
    value: number;
    severity: string;
    description?: string;
  }>;
}

export default function Home() {
  const [data, setData] = useState<PowerData | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    event: {
      type: string;
      phase: string;
      value: number;
      severity: string;
      description?: string;
    };
  }>>([]);
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);

  // Alert kapatma fonksiyonu
  const closeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Alert gösterme fonksiyonu
  const showAlert = useCallback((event: any) => {
    const eventKey = `${event.type}-${event.phase}-${event.value}-${event.severity}`;
    
    // Aynı event'i tekrar gösterme
    if (alerts.some(alert => alert.id === eventKey)) {
      return;
    }

    // Yeni alert'i ekle ve maksimum 3 alert'i koru
    setAlerts(prev => {
      const newAlerts = [...prev, { id: eventKey, event }];
      // Son 3 alert'i al
      return newAlerts.slice(-3);
    });

    // Alert sesini çal
    if (alertSoundRef.current) {
      alertSoundRef.current.currentTime = 0;
      alertSoundRef.current.play().catch(console.error);
    }

    // Bildirim göster
    if (Notification.permission === 'granted') {
      new Notification('Power Quality Event', {
        body: `${event.type}: ${event.description || 'Event detected'}\nValue: ${event.value.toFixed(2)} | Phase: ${event.phase}`,
        icon: '/favicon.ico',
        tag: 'power-quality-event',
        requireInteraction: false
      });
    }
  }, [alerts]);

  // Veri çekme fonksiyonu
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/power-quality');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}${errorData.details ? `, ${errorData.details}` : ''}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        setData(data);
        // Event varsa alert göster
        if (data.events) {
          data.events.forEach((event: any) => showAlert(event));
        }
      } else if (data.length > 0) {
        setData(data[data.length - 1]);
        // Event varsa alert göster
        if (data[data.length - 1].events) {
          data[data.length - 1].events.forEach((event: any) => showAlert(event));
        }
      }
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Veri alınamadı');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  // WebSocket bağlantısı
  const connectWebSocket = useCallback(() => {
    if (typeof window !== 'undefined' && !ws) {
      // Vercel'de çalışırken environment variable'ı kullan
      const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://oriontecno.com/ws';
      const websocket = new WebSocket(websocketUrl);
      
      websocket.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setData(newData);
          
          // Event varsa alert göster
          if (newData.events) {
            newData.events.forEach((event: any) => showAlert(event));
          }
          setError(null);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket bağlantısı kapandı. Yeniden bağlanılıyor...');
        setTimeout(() => {
          connectWebSocket();
        }, 1000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket bağlantı hatası');
      };

      setWs(websocket);
    }
  }, [ws, showAlert]);

  // Sayfa yüklendiğinde ve belirli aralıklarla veri çek
  useEffect(() => {
    // İlk veri yüklemesi
    fetchData();

    // WebSocket bağlantısı
    connectWebSocket();

    // Her 500ms'de bir veri güncelle
    const intervalId = setInterval(() => {
      fetchData();
    }, 500);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      if (ws) {
        ws.close();
      }
    };
  }, [fetchData, connectWebSocket]);

  const renderMetrics = () => {
    if (!data) return null;

    return (
      <div className={styles.metricsGrid}>
        {/* Voltage metrics */}
        {data.volt.map((value, i) => (
          <div key={`voltage-${i}`} className={`${styles.metricCard} ${styles.voltageCard} ${styles[`voltagePhase${['a', 'b', 'c', 'n'][i]}`]}`}>
            <div className={styles.metricHeader}>
              <div className={styles.voltageIcon} style={{ background: 'rgba(255, 107, 107, 0.2)' }}>
                <i className="fas fa-bolt" style={{ color: '#FF6B6B' }}></i>
              </div>
              <div className={styles.metricTitle}>Voltage {['A', 'B', 'C', 'N'][i]}</div>
            </div>
            <div className={styles.metricValue} style={{ color: 'white', position: 'relative', zIndex: 1 }}>
              <span className={styles.valueNumber}>{value.toFixed(2)}</span>
              <span className={styles.metricUnit}>V</span>
            </div>
          </div>
        ))}

        {/* Current metrics */}
        {data.current.map((value, i) => (
          <div key={`current-${i}`} className={`${styles.metricCard} ${styles.currentCard}`}>
            <div className={styles.metricHeader}>
              <div className={styles.voltageIcon} style={{ background: 'rgba(66, 153, 225, 0.2)' }}>
                <i className="fas fa-plug" style={{ color: '#4299E1' }}></i>
              </div>
              <div className={styles.metricTitle}>Current {['A', 'B', 'C', 'N'][i]}</div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.valueNumber}>{value.toFixed(2)}</span>
              <span className={styles.metricUnit}>A</span>
            </div>
          </div>
        ))}

        {/* Active Power metrics */}
        {data.power[3]?.map((value, i) => (
          <div key={`active-power-${i}`} className={`${styles.metricCard} ${styles.powerCard}`}>
            <div className={styles.metricHeader}>
              <div className={styles.voltageIcon} style={{ background: 'rgba(72, 187, 120, 0.2)' }}>
                <i className="fas fa-charging-station" style={{ color: '#48BB78' }}></i>
              </div>
              <div className={styles.metricTitle}>Active Power {['A', 'B', 'C', 'N'][i]}</div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.valueNumber}>{value.toFixed(2)}</span>
              <span className={styles.metricUnit}>kW</span>
            </div>
          </div>
        ))}

        {/* Reactive Power metrics */}
        {data.power.slice(0, 3).map((value, i) => (
          <div key={`reactive-power-${i}`} className={`${styles.metricCard} ${styles.powerCard}`}>
            <div className={styles.metricHeader}>
              <div className={styles.voltageIcon} style={{ background: 'rgba(72, 187, 120, 0.2)' }}>
                <i className="fas fa-charging-station" style={{ color: '#48BB78' }}></i>
              </div>
              <div className={styles.metricTitle}>Reactive Power {['A', 'B', 'C'][i]}</div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.valueNumber}>{value.toFixed(2)}</span>
              <span className={styles.metricUnit}>kVar</span>
            </div>
          </div>
        ))}

        {/* Apparent Power metrics */}
        {data.power[4]?.map((value, i) => (
          <div key={`apparent-power-${i}`} className={`${styles.metricCard} ${styles.powerCard}`}>
            <div className={styles.metricHeader}>
              <div className={styles.voltageIcon} style={{ background: 'rgba(72, 187, 120, 0.2)' }}>
                <i className="fas fa-charging-station" style={{ color: '#48BB78' }}></i>
              </div>
              <div className={styles.metricTitle}>Apparent Power {['A', 'B', 'C', 'N'][i]}</div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.valueNumber}>{value.toFixed(2)}</span>
              <span className={styles.metricUnit}>kVA</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Loading durumunu göster
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Hata durumunu göster
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Head>
        <title>DCAC Power Quality Analyzer | Real-time Power Monitoring</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Professional power quality analyzer for real-time monitoring of voltage, current, harmonics and power quality metrics." />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/js/all.min.js"></script>
      </Head>

      <Navbar currentPage="/" />

      <div className="container">
                    {/* Alert container */}
                    <div className={styles.alertContainer}>
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            event={alert.event}
            onClose={() => closeAlert(alert.id)}
          />
        ))}
      </div>
        <h1>DCAC Power Quality Analyzer</h1>
        {renderMetrics()}
      </div>



      {/* Alert sound */}
      <audio
        ref={alertSoundRef}
        src="/alert-sound.mp3"
        preload="auto"
      />
    </>
  );
}
