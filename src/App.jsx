import React, { useState, useEffect } from 'react';
import Game from './Game.jsx';
import GameConfig from './GameConfig.js';

const AgeVerification = ({ onVerify }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    padding: '20px', zIndex: 10000
  }}>
    <div style={{
      background: 'rgba(0,0,0,0.5)', padding: '40px', borderRadius: '12px',
      maxWidth: '500px', textAlign: 'center', border: '1px solid rgba(233, 69, 96, 0.3)'
    }}>
      <h1 style={{ color: '#e94560', marginBottom: '20px', fontSize: '28px' }}>
        ⚠️ Adult Content Warning
      </h1>
      <p style={{ color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
        This game contains adult content including explicit sexual themes, 
        violence, drug use, and other mature subjects. 
        <br /><br />
        By clicking "Enter", you confirm that you are at least 18 years old 
        and consent to viewing adult content.
      </p>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.href = 'https://google.com'}
          style={{
            padding: '12px 30px', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
            color: '#888', cursor: 'pointer', fontSize: '16px'
          }}>
          Exit
        </button>
        <button
          onClick={onVerify}
          style={{
            padding: '12px 30px', background: 'linear-gradient(135deg, #e94560, #c23a51)',
            border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer',
            fontSize: '16px', fontWeight: 'bold'
          }}>
          I am 18+ - Enter
        </button>
      </div>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Game Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#1a1a2e', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: '20px', color: '#e0e0e0'
        }}>
          <h1 style={{ color: '#e94560', marginBottom: '20px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '20px', color: '#888' }}>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: '12px 30px', background: '#e94560', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [ageVerified, setAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip age verification if debug setting is enabled
    if (GameConfig.debug.enabled && GameConfig.debug.skipAgeVerification) {
      setAgeVerified(true);
      setIsLoading(false);
      return;
    }
    const verified = localStorage.getItem('age_verified') === 'true';
    setAgeVerified(verified);
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  if (!ageVerified) {
    return <AgeVerification onVerify={() => {
      localStorage.setItem('age_verified', 'true');
      setAgeVerified(true);
    }} />;
  }

  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
};

export default App;
