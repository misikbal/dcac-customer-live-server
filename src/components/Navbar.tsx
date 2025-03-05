import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';

interface NavbarProps {
  currentPage: string;
}

export function Navbar({ currentPage: _ }: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="navbar">
      <div className="navbar-brand">DCAC</div>
      <div className="navbar-links">
        <Link 
          href="/power-quality" 
          className={`nav-link ${router.pathname === '/power-quality' ? 'active' : ''}`}
        >
          Power Quality
        </Link>
        <Link 
          href="/events" 
          className={`nav-link ${router.pathname === '/events' ? 'active' : ''}`}
        >
          Events
        </Link>
        <Link 
          href="/harmonics" 
          className={`nav-link ${router.pathname === '/harmonics' ? 'active' : ''}`}
        >
          Harmonics
        </Link>
        <Link 
          href="/graphs" 
          className={`nav-link ${router.pathname === '/graphs' ? 'active' : ''}`}
        >
          Graphs
        </Link>
      </div>
    </nav>
  );
} 