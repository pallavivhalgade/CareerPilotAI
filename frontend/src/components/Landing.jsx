import React from 'react';
import Icon, { Brand } from './Icons';

const tools = [
  { id: 'analysis', icon: 'target', name: 'Know where you stand.', label: 'Resume & role fit', copy: 'Compare your experience with a role. Find your strengths, skill gaps, and a practical plan.', action: 'Explore role fit', tone: 'peach' },
  { id: 'interview', icon: 'mic', name: 'Walk in a little readier.', label: 'Interview practice', copy: 'Practice questions shaped by your experience. Get feedback that helps your next answer.', action: 'Try a practice session', tone: 'sage' },
  { id: 'assistant', icon: 'chat', name: 'Find a way forward.', label: 'Your career coach', copy: 'Work through a question, sharpen your story, or figure out what to focus on next.', action: 'Ask your career coach', tone: 'lavender' },
];

function ProductPreview({ onExplore }) {
  return <div className="product-preview">
    <div className="preview-backdrop" aria-hidden="true"><span /><span /><span /></div>
    <div className="preview-window">
      <div className="preview-toolbar"><span className="preview-mini-brand"><Icon name="target" size={16} /> Your career workspace</span><span className="preview-label">Sample analysis</span></div>
      <div className="preview-window-body">
        <div className="preview-role"><div><span className="eyebrow">THE ROLE YOU HAVE IN MIND</span><h2>AI Engineer</h2><p>Engineering · Your next chapter</p></div><span className="preview-role-icon"><Icon name="arrowUp" size={23} /></span></div>
        <div className="preview-score-row"><div className="preview-score" role="img" aria-label="Sample role fit: 82 out of 100"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="51" /><circle className="preview-score-arc" cx="60" cy="60" r="51" /></svg><span><strong>82<span>%</span></strong><small>ROLE FIT</small></span></div><div className="preview-score-copy"><span className="positive-label"><Icon name="check" size={13} /> A strong starting point</span><h3>You bring more<br />than you think.</h3><p>Connect your skills to the opportunity.</p></div></div>
        <div className="preview-skills"><span className="preview-section-label">Your strengths</span><div><span><Icon name="check" size={13} /> Python</span><span><Icon name="check" size={13} /> FastAPI</span><span><Icon name="check" size={13} /> RAG</span></div></div>
        <div className="preview-focus"><span className="preview-focus-icon"><Icon name="branch" size={19} /></span><div><strong>A little focus goes a long way.</strong><p>Turn your skill gaps into a 7-day plan.</p></div><Icon name="arrow" size={17} /></div>
        <button className="preview-open" onClick={() => onExplore('analysis')}>Explore an example analysis <Icon name="arrowUp" size={15} /></button>
      </div>
    </div>
    <div className="preview-caption"><span className="tiny-dot" /> A clearer picture. A more confident next step.</div>
  </div>;
}

export default function Landing({ onAuth, onExplore }) {
  return <div className="landing">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="container header-inner"><a className="brand-link" href="#" aria-label="CareerPilot home"><Brand /></a><nav className="site-nav" aria-label="Main navigation"><a href="#toolkit">What you can do</a><a href="#process">How it works</a></nav><button className="header-sign-in" onClick={() => onAuth('login')}>Sign in <Icon name="arrowUp" size={16} /></button></div></header>
    <main id="main-content">
      <section className="hero container">
        <div className="hero-copy"><span className="hero-eyebrow"><span className="tiny-dot" /> A LITTLE DIRECTION CHANGES EVERYTHING</span><h1>Your next move.<br />A little <em>clearer.</em></h1><p className="hero-description">You’ve done the work. Now make it count.<br className="desktop-break" /> Find your fit, practice your story, and take the next step with confidence.</p><div className="hero-actions"><button className="button button-dark" onClick={() => onAuth('register')}>Find my next move <Icon name="arrow" size={18} /></button><button className="text-button" onClick={() => onExplore('overview')}>Take a look inside <Icon name="arrowUp" size={16} /></button></div><p className="hero-note"><Icon name="check" size={14} /> Explore the preview. No account needed.</p><div className="hero-footnote"><span>Less guesswork.</span><span>More forward.</span><svg width="48" height="28" viewBox="0 0 48 28" fill="none" aria-hidden="true"><path d="M2 21C17 29 27 21 26 8C25-1 16 1 20 9C24 17 34 11 44 4M34 3L45 3L42 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div></div>
        <ProductPreview onExplore={onExplore} />
      </section>
      <section className="toolkit-section container" id="toolkit"><div className="section-heading"><div><span className="eyebrow">A FOCUSED TOOLKIT</span><h2>Everything you need.<br /><em>Nothing in your way.</em></h2></div><p>Three useful tools.<br />One place to make your next move.</p></div><div className="tool-grid">{tools.map((tool, index) => <article className="tool-card" key={tool.id}><div className="tool-card-top"><span className={'tool-icon ' + tool.tone}><Icon name={tool.icon} size={23} /></span><span className="tool-number">0{index + 1}</span></div><span className="tool-category">{tool.label}</span><h3>{tool.name}</h3><p>{tool.copy}</p><button className="tool-link" onClick={() => onExplore(tool.id)}>{tool.action}<Icon name="arrowUp" size={17} /></button></article>)}</div></section>
      <section className="process-section container" id="process"><div className="process-heading"><span className="eyebrow">FROM HERE TO WHAT’S NEXT</span><h2>Start with what<br /><em>you already have.</em></h2><button className="text-button" onClick={() => onExplore('analysis')}>Try it with an example <Icon name="arrow" size={17} /></button></div><ol className="process-list"><li><span>01</span><div><h3>Bring your experience.</h3><p>Add your resume and a role that interests you.</p></div></li><li><span>02</span><div><h3>Find your focus.</h3><p>See what fits, what’s missing, and where to start.</p></div></li><li><span>03</span><div><h3>Make your next move.</h3><p>Practice, ask questions, and build on what you know.</p></div></li></ol></section>
    </main>
    <footer className="site-footer container"><Brand /><span>A little clarity for what comes next.</span><span>© {new Date().getFullYear()} CareerPilot</span><button onClick={() => onExplore('overview')}>Open workspace <Icon name="arrowUp" size={15} /></button></footer>
  </div>;
}

