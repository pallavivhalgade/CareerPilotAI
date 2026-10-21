import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import App from './App';
import './style.css';
import './responsive.css';

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('CareerPilot could not render:', error); }
  render() {
    if (this.state.failed) return <main className="fatal-error"><span className="eyebrow">A SMALL DETOUR.</span><h1>Let’s find our<br /><em>way back.</em></h1><p>The workspace ran into an unexpected problem. Reload to start fresh.</p><button className="button button-dark" onClick={() => window.location.reload()}>Reload workspace ↗</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
