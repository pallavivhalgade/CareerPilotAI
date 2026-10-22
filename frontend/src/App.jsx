import React, { useCallback, useEffect, useRef, useState } from 'react';
import Landing from './components/Landing';
import Workspace, { NAVIGATION } from './components/Workspace';
import Icon from './components/Icons';
import { Modal, Spinner } from './components/Common';
import { cancelRequests, request, storageGet, storageSet } from './lib/api';
import { DEMO_DASHBOARD, DEMO_QUESTIONS, SAMPLE_JOB, SAMPLE_RESUME, previewAnalysis, previewAnswer } from './lib/demo';

const readRoute = () => window.location.hash.match(/^#\/workspace\/(overview|analysis|interview|assistant)$/)?.[1];

export default function App() {
  const [token, setToken] = useState(() => storageGet('cp_token'));
  const [email, setEmail] = useState(() => storageGet('cp_email'));
  const [workspaceVisible, setWorkspaceVisible] = useState(() => Boolean(storageGet('cp_token') || readRoute()));
  const [active, setActive] = useState(() => readRoute() || 'overview');
  const [online, setOnline] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [resume, setResume] = useState(() => readRoute() && !storageGet('cp_token') ? SAMPLE_RESUME : '');
  const [job, setJob] = useState(() => readRoute() && !storageGet('cp_token') ? SAMPLE_JOB : '');
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState({});
  const busy = useRef(new Set());
  const generation = useRef(0);
  const [notice, setNotice] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const demo = !token;
  const notify = useCallback((message, type = 'info') => setNotice({ message, type }), []);
  const handleError = useCallback(error => {
    if (error.status === 401) {
      storageSet('cp_token', ''); setToken(''); setDashboard(null);
      setAuthError(''); setAuthMode('login');
    }
    notify(error.message || 'Something went wrong. Please try again.', 'error');
  }, [notify]);
  const perform = async (key, fn, onError = handleError) => {
    if (busy.current.has(key)) return;
    const currentGeneration = generation.current;
    busy.current.add(key); setPending(previous => ({ ...previous, [key]: true }));
    try { await fn(); } catch (error) { if (currentGeneration === generation.current) onError(error); }
    finally { busy.current.delete(key); setPending(previous => ({ ...previous, [key]: false })); }
  };
  const navigate = useCallback(page => {
    setActive(page); setWorkspaceVisible(true);
    const hash = '#/workspace/' + page;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const explore = page => {
    if (!resume && !job) { setResume(SAMPLE_RESUME); setJob(SAMPLE_JOB); }
    navigate(page);
  };
  const home = () => {
    setWorkspaceVisible(false);
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const openAuth = mode => {
    setCommandOpen(false);
    if (token) { navigate('overview'); return; }
    setAuthError(''); setPassword(''); setShowPassword(false); setAuthMode(mode);
  };
  const checkConnection = useCallback(async () => {
    try { const data = await request('/health', { timeout: 5000 }); setOnline(data.status === 'ok'); }
    catch { setOnline(false); }
  }, []);
  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => { if (!document.hidden) checkConnection(); }, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    request('/dashboard', { token, timeout: 15000 }).then(data => { if (alive) setDashboard(data); }).catch(error => { if (alive) handleError(error); });
    return () => { alive = false; };
  }, [token, result, feedback, handleError]);
  useEffect(() => {
    if (!notice || notice.type === 'error') return;
    const timer = setTimeout(() => setNotice(null), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const listener = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!authMode) { setCommandQuery(''); setCommandOpen(previous => !previous); }
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [authMode]);
  useEffect(() => {
    const syncRoute = () => { const route = readRoute(); setWorkspaceVisible(Boolean(route)); if (route) setActive(route); };
    window.addEventListener('popstate', syncRoute); window.addEventListener('hashchange', syncRoute);
    return () => { window.removeEventListener('popstate', syncRoute); window.removeEventListener('hashchange', syncRoute); };
  }, []);
  useEffect(() => {
    document.title = workspaceVisible ? (NAVIGATION.find(item => item.id === active)?.label || 'Workspace') + ' — CareerPilot' : 'CareerPilot — Your next move, clearer';
  }, [workspaceVisible, active]);
  const resetPrivateState = () => {
    setResume(''); setJob(''); setResult(null); setSession(null); setQuestion(''); setAnswer('');
    setFeedback(null); setMessages([]); setQuery(''); setDashboard(null);
  };
  const logout = () => {
    generation.current++; cancelRequests();
    storageSet('cp_token', ''); storageSet('cp_email', '');
    setToken(''); setEmail(''); resetPrivateState(); setActive('overview'); home();
    notify('Signed out. Your workspace is ready when you are.');
  };
  const authenticate = event => {
    event.preventDefault(); setAuthError('');
    perform('auth', async () => {
      const normalizedEmail = authEmail.trim().toLowerCase();
      const data = await request('/auth/' + authMode, { method: 'POST', body: { email: normalizedEmail, password }, timeout: 20000 });
      if (!data.token) throw new Error('The server did not return a session. Please try again.');
      generation.current++;
      storageSet('cp_token', data.token); storageSet('cp_email', normalizedEmail);
      setToken(data.token); setEmail(normalizedEmail); setAuthMode(null); setPassword('');
      setResult(null); setSession(null); setFeedback(null); setMessages([]); navigate('overview');
      notify(authMode === 'register' ? 'Your next chapter starts here. Welcome to your workspace.' : 'Welcome back. Let’s pick up where you left off.');
    }, error => setAuthError(error.message));
  };
  const loadExample = () => {
    setResume(SAMPLE_RESUME); setJob(SAMPLE_JOB); setResult(null);
    notify('Example experience and job description loaded. Make them your own.');
  };
  const upload = file => {
    if (demo) return notify('Sign in to extract a resume. You can edit the example text in this preview.');
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) return notify('Choose a PDF, DOCX, or TXT file.', 'error');
    if (file.size > 5 * 1024 * 1024) return notify('This file is a little large. Please choose one under 5 MB.', 'error');
    perform('upload', async () => {
      const body = new FormData(); body.append('file', file);
      const data = await request('/resume/extract', { method: 'POST', token, body, timeout: 60000 });
      if (!data.text?.trim()) throw new Error('We could not find readable text in this document. Try pasting the text instead.');
      setResume(data.text.slice(0, 50000)); setResult(null); notify('Your resume is ready. Take a moment to review the extracted text.');
    });
  };
  const analyze = () => {
    if (resume.trim().length < 30 || job.trim().length < 30) return notify('Add a little more detail to your experience and job description.', 'error');
    perform('analysis', async () => {
      const data = demo ? previewAnalysis(resume, job) : await request('/analysis', { method: 'POST', token, body: { resume_text: resume, job_text: job } });
      setResult(data);
      requestAnimationFrame(() => document.getElementById('analysis-result')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    });
  };
  const startInterview = () => perform('interview', async () => {
    const data = demo ? { session_id: 'preview', question: DEMO_QUESTIONS[0] } : await request('/interview/start', { method: 'POST', token, body: { resume_text: resume, job_text: job, difficulty } });
    setSession(data.session_id); setQuestion(data.question); setQuestionNumber(1); setAnswer(''); setFeedback(null);
  });
  const answerInterview = () => {
    if (!answer.trim()) return;
    perform('interview', async () => {
      const previousQuestion = question;
      const data = demo ? {
        evaluation: { score: 82, correctness: 85, relevance: 88, completeness: 74, communication: 81, feedback: 'Example feedback: a clear answer explains the problem, the approach, and the trade-offs. Make it more concrete by describing one specific decision, how you tested it, and what changed as a result. This illustrative feedback does not grade your answer.', follow_up: 'What would you measure to know your approach is working?' },
        next_question: DEMO_QUESTIONS[questionNumber % DEMO_QUESTIONS.length],
      } : await request('/interview/answer', { method: 'POST', token, body: { session_id: session, question, answer, job_text: job } });
      setFeedback({ question: previousQuestion, evaluation: data.evaluation });
      setQuestion(data.next_question); setQuestionNumber(previous => previous + 1); setAnswer('');
      notify(demo ? 'Example feedback is ready. Sign in for feedback on your own answer.' : 'Feedback is ready. There’s a new question when you are.');
    });
  };
  const ask = text => {
    const value = text.trim();
    if (value.length < 2 || busy.current.has('chat')) return;
    setQuery(''); setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', content: value }]);
    perform('chat', async () => {
      try {
        const data = demo ? { answer: previewAnswer(value), sources: [], preview: true } : await request('/chat', { method: 'POST', token, body: { query: value, resume_text: resume.slice(0, 12000), job_text: job.slice(0, 12000) } });
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources: data.sources, grounding: data.grounding, preview: demo }]);
      } catch (error) { setQuery(value); throw error; }
    });
  };
  const model = { active, demo, email, online, dashboard: demo ? DEMO_DASHBOARD : dashboard, resume, job, result, difficulty, session, question, questionNumber, answer, feedback, messages, query, pending };
  const actions = { navigate, home, openAuth, logout, setResume, setJob, loadExample, upload, analyze, setDifficulty, startInterview, answerInterview, setAnswer, endInterview: () => { setSession(null); setAnswer(''); notify('Session ended. Every bit of practice counts.'); }, ask, setQuery, clearChat: () => { setMessages([]); setQuery(''); }, openCommand: () => { setCommandQuery(''); setCommandOpen(true); }, checkConnection };
  const commandItems = NAVIGATION.filter(item => (item.label + ' ' + item.id).toLowerCase().includes(commandQuery.toLowerCase()));
  return <>
    {workspaceVisible ? <Workspace model={model} actions={actions} /> : <Landing onAuth={openAuth} onExplore={explore} online={online} />}
    <Modal open={Boolean(authMode)} onClose={() => { if (!pending.auth) { setAuthMode(null); setPassword(''); } }} className="auth-dialog" labelledBy="auth-title">
      <div className="auth-form-side"><button className="icon-button modal-close" aria-label="Close sign-in dialog" disabled={pending.auth} onClick={() => { setAuthMode(null); setPassword(''); }}><Icon name="close" size={20} /></button><span className="eyebrow">{authMode === 'register' ? 'LET’S MAKE IT YOURS.' : 'GOOD TO HAVE YOU BACK.'}</span><h2 id="auth-title">{authMode === 'register' ? 'Make your next move.' : 'Welcome back.'}</h2><p>{authMode === 'register' ? 'A personal workspace for the career you’re building.' : 'Sign in to your personal career workspace.'}</p><form onSubmit={authenticate}><label className="field-label" htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="username" value={authEmail} onChange={event => setAuthEmail(event.target.value)} placeholder="you@example.com" required maxLength={254} disabled={pending.auth} /><label className="field-label" htmlFor="auth-password">Password</label><div className="password-input"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={authMode === 'register' ? 'At least 6 characters' : 'Your password'} required minLength={6} disabled={pending.auth} /><button type="button" className="icon-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(previous => !previous)}><Icon name="eye" size={18} /></button></div>{authError && <p className="form-error" role="alert"><Icon name="info" size={15} />{authError}</p>}<button className="button button-dark auth-submit" disabled={pending.auth} type="submit">{pending.auth ? <Spinner label="Signing you in" /> : null}{pending.auth ? 'Opening your workspace…' : authMode === 'register' ? 'Create your workspace' : 'Sign in to your workspace'}<Icon name="arrow" size={17} /></button></form><p className="auth-switch">{authMode === 'register' ? 'Already have a workspace?' : 'New around here?'} <button disabled={pending.auth} onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthError(''); }}>{authMode === 'register' ? 'Sign in' : 'Make it yours'}</button></p></div>
    </Modal>
    <Modal open={commandOpen} onClose={() => setCommandOpen(false)} className="command-dialog" labelledBy="command-title"><h2 id="command-title" className="visually-hidden">Jump to a workspace tool</h2><div className="command-search"><Icon name="search" size={20} /><input aria-label="Find a workspace tool" autoComplete="off" value={commandQuery} onChange={event => setCommandQuery(event.target.value)} placeholder="Where would you like to go?" /><button className="icon-button" aria-label="Close search" onClick={() => setCommandOpen(false)}><kbd>ESC</kbd></button></div><div className="command-results"><span className="eyebrow">YOUR TOOLKIT</span>{commandItems.length ? commandItems.map(item => <button key={item.id} onClick={() => { setCommandOpen(false); explore(item.id); }}><Icon name={item.icon} size={19} /><span>{item.label}</span><Icon name="arrow" size={16} /></button>) : <p>No tool found. Try “interview” or “role fit”.</p>}</div><div className="command-footer"><Icon name="code" size={14} /><span>A LITTLE LESS SEARCHING. A LITTLE MORE DOING.</span></div></Modal>
    {notice && <div className={'toast toast-' + notice.type} role={notice.type === 'error' ? 'alert' : 'status'}><span className="toast-icon"><Icon name={notice.type === 'error' ? 'info' : 'check'} size={18} /></span><p>{notice.message}</p><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><Icon name="close" size={16} /></button></div>}
  </>;
}
