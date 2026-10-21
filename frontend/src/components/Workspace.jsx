import React, { useEffect, useRef, useState } from 'react';
import Icon, { Brand } from './Icons';
import { EmptyState, PageHeading, RichText, ScoreRing, Spinner } from './Common';

export const NAVIGATION = [
  { id: 'overview', icon: 'grid', label: 'Overview', shortcut: '01' },
  { id: 'analysis', icon: 'target', label: 'Role fit', shortcut: '02' },
  { id: 'interview', icon: 'mic', label: 'Interview studio', shortcut: '03' },
  { id: 'assistant', icon: 'chat', label: 'Career coach', shortcut: '04' },
];

function ActivityChart({ events, demo }) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setDate(now.getDate() - 6 + i);
    return { date, count: demo ? [1, 3, 2, 4, 2, 5, 3][i] : events.filter(event => new Date(event.created_at).toDateString() === date.toDateString()).length };
  });
  const max = Math.max(5, ...days.map(day => day.count));
  return <div className="activity-chart" role="img" aria-label={'Activity in the past seven days: ' + days.map(day => day.date.toLocaleDateString('en', { weekday: 'short' }) + ' ' + day.count).join(', ')}>
    <div className="chart-y-labels"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div>
    <div className="chart-plot"><div className="chart-guides"><i /><i /><i /></div><div className="chart-columns">{days.map((day, i) => <div className={'chart-column ' + (i === 6 ? 'today' : '')} key={i}><div className="chart-bar-track"><div className="chart-bar" style={{ '--height': Math.max(3, day.count / max * 100) + '%', '--delay': i * 65 + 'ms' }}><span>{day.count}</span></div></div><span>{day.date.toLocaleDateString('en', { weekday: 'short' })}</span></div>)}</div></div>
  </div>;
}

function Overview({ model, actions }) {
  const dash = model.dashboard;
  const hasActivity = model.demo || (dash?.recent_events?.length > 0);
  const stats = [
    { label: 'Average role fit', value: dash ? Math.round(dash.avg_ats) : '—', unit: '/100', icon: 'target', detail: 'Across your analyses', tone: 'orange' },
    { label: 'Roles explored', value: dash?.analyses ?? '—', icon: 'file', detail: 'Resume comparisons', tone: 'olive' },
    { label: 'Interview average', value: dash ? Math.round(dash.avg_interview) : '—', unit: '/100', icon: 'mic', detail: 'Across your answers', tone: 'blue' },
    { label: 'Practice sessions', value: dash?.interviews ?? '—', icon: 'chat', detail: 'Interviews started', tone: 'sand' },
  ];
  return <div className="page-enter">
    <PageHeading eyebrow="YOUR WORKSPACE" title={<>A clearer path <em>forward.</em></>} description="Your role fit, practice, and next steps. All in one place." action={<button className="button button-dark button-small" onClick={() => actions.navigate('analysis')}><Icon name="plus" size={16} /> New analysis</button>} />
    <div className="stats-grid">{stats.map(stat => <article className="stat-card" key={stat.label}><div className="stat-label"><span>{stat.label}</span><span className={'stat-icon tone-' + stat.tone}><Icon name={stat.icon} size={17} /></span></div><div className="stat-value">{stat.value}<small>{stat.unit}</small></div><span className="stat-detail">{stat.detail}</span></article>)}</div>
    <div className="overview-grid">
      <section className="surface activity-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>This week</h2></div><span className="quiet-tag">Last 7 days</span></div>{hasActivity ? <ActivityChart events={dash?.recent_events || []} demo={model.demo} /> : <EmptyState icon="branch" title="Your story starts with one step." action="Find your role fit" onAction={() => actions.navigate('analysis')}>Your analyses and practice sessions will appear here. Start with a role that interests you.</EmptyState>}<div className="panel-footer"><span className="tiny-dot" />{model.demo ? 'Sample activity · preview workspace' : 'Small, consistent steps add up.'}</div></section>
      <section className="next-step-card"><span className="eyebrow">YOUR NEXT STEP</span><div className="next-step-art" aria-hidden="true"><div className="art-stair stair-1" /><div className="art-stair stair-2" /><div className="art-stair stair-3" /><Icon name="arrowUp" size={50} /></div><h2>Your skills.<br />A new perspective.</h2><p>Put your experience next to a role you care about. Find the connections worth making.</p><button className="button button-dark button-small" onClick={() => actions.navigate('analysis')}>Explore your fit <Icon name="arrow" size={16} /></button></section>
    </div>
  </div>;
}

function AnalysisResult({ result, demo }) {
  const matched = result.ats?.matched_skills || [];
  const missing = result.gap?.missing_skills || result.ats?.missing_skills || [];
  return <section className="analysis-result surface page-enter" id="analysis-result" aria-label="Analysis results">
    <div className="panel-heading"><div><span className="eyebrow">THE BIGGER PICTURE</span><h2>Here’s where you connect.</h2></div><span className={'quiet-tag ' + (demo ? '' : 'tag-olive')}>{demo ? 'Preview · keyword comparison' : 'Analysis complete'}</span></div>
    <div className="result-top"><ScoreRing value={result.ats?.score} caption="Role fit" large /><div className="result-summary"><h3>Your experience has a story.</h3><p>{matched.length ? 'You already bring ' + matched.length + ' of the skills identified for this role. Focus your story on evidence, then give the gaps a practical plan.' : 'This role asks for a different set of skills. Use the gaps below to choose a focused next step.'}</p><div className="result-metrics"><div><strong>{result.ats?.keyword_match ?? 0}%</strong><span>Keyword match</span></div><div><strong>{matched.length}</strong><span>Skills connected</span></div><div><strong>{missing.length}</strong><span>Areas to explore</span></div></div></div></div>
    <div className="skill-columns"><div><h3><span className="tiny-dot olive" /> Bring these forward</h3><p>Strengths to support with your own examples.</p><div className="skill-tags">{matched.length ? matched.map(skill => <span className="skill-tag skill-positive" key={skill}><Icon name="check" size={13} />{skill}</span>) : <span className="muted-text">No matching skills identified yet.</span>}</div></div><div><h3><span className="tiny-dot" /> Your next learning edge</h3><p>Only add a skill when you can stand behind it.</p><div className="skill-tags">{missing.length ? missing.map(skill => <span className="skill-tag" key={skill}>{skill}</span>) : <span className="muted-text">All identified skills are represented.</span>}</div></div></div>
    <div className="learning-plan"><div className="plan-label"><span className="plan-icon"><Icon name="branch" /></span><div><span className="eyebrow">MAKE IT ACTIONABLE</span><h3>A plan for your next seven days.</h3><p>Small steps tied to your experience and this role.</p></div></div>{Array.isArray(result.plan) ? <div className="plan-days">{result.plan.map((day, index) => <article className="plan-day" key={day.day || index}><div className="plan-day-number">DAY <strong>{String(day.day || index + 1).padStart(2, '0')}</strong></div><div className="plan-day-content"><h4>{day.focus}</h4><p className="plan-why">{day.why}</p><ul>{(Array.isArray(day.tasks) ? day.tasks : []).map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul><div className="plan-deliverable"><strong>Make:</strong> {day.deliverable}</div><div className="plan-interview"><Icon name="mic" size={14} /><span>{day.interview_prompt}</span></div></div></article>)}</div> : <RichText>{result.plan}</RichText>}</div>
    <div className="result-disclaimer"><Icon name="info" size={16} /><p>{demo ? 'This preview uses a simple keyword comparison and an example plan. Sign in for the full local analysis workflow.' : 'This score is a guide, not a hiring prediction. Review the suggestions and keep every claim truthful.'}{!demo && result.verification && ' Evidence overlap: ' + Math.round((result.verification.confidence || 0) * 100) + '%.'}</p></div>
  </section>;
}

function Analysis({ model, actions }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const valid = model.resume.trim().length >= 30 && model.job.trim().length >= 30;
  const pending = model.pending.analysis;
  const upload = file => {
    setDragging(false);
    if (file) actions.upload(file);
  };
  return <div className="page-enter">
    <PageHeading eyebrow="RESUME & ROLE FIT" title={<>Find your <em>fit.</em></>} description="Compare your experience with the role. See your strengths and where to focus." action={<button className="button button-outline button-small" onClick={actions.loadExample}><Icon name="file" size={16} /> Use an example</button>} />
    <div className="analysis-editors">
      <section className="surface editor-panel"><div className="panel-heading"><div><span className="eyebrow">THE STARTING POINT</span><h2>Your resume or experience</h2><p className="field-help">Upload your resume, or paste its text below. Include work history, projects, skills, and results.</p></div><span className="step-badge">01</span></div><input ref={fileRef} className="visually-hidden" type="file" aria-label="Upload resume" accept=".pdf,.docx,.txt" disabled={model.demo || model.pending.upload} onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} /><button className={'upload-area ' + (dragging ? 'is-dragging' : '')} disabled={model.demo || model.pending.upload} onClick={() => fileRef.current.click()} onDragOver={event => { event.preventDefault(); if (!model.demo) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); if (!model.demo) upload(event.dataTransfer.files?.[0]); }}><span className="upload-icon">{model.pending.upload ? <Spinner label="Extracting resume" /> : <Icon name="upload" size={20} />}</span><span><strong>{model.pending.upload ? 'Reading your document…' : model.demo ? 'Sign in to upload a resume' : 'Choose a resume file or drop it here'}</strong><small>PDF, Word (.docx), or text file · up to 5 MB</small></span><Icon name="plus" size={16} /></button><label className="field-label" htmlFor="resume">Or paste your resume text here</label><textarea id="resume" value={model.resume} maxLength={50000} onChange={event => actions.setResume(event.target.value)} placeholder="Paste your work history, projects, education, and skills here" /><div className="editor-footer"><span>Give your skills a little context.</span><span>{model.resume.length.toLocaleString()} / 50,000</span></div></section>
      <section className="surface editor-panel"><div className="panel-heading"><div><span className="eyebrow">THE POSSIBILITY</span><h2>The job you want</h2></div><span className="step-badge">02</span></div><div className="job-context"><Icon name="target" size={24} /><span>A role that feels like a good next chapter.</span></div><label className="field-label" htmlFor="job">Paste the full job posting</label><p className="field-help">Copy it from the job ad, including the responsibilities and required skills. More detail makes the plan and interview questions more relevant.</p><textarea id="job" value={model.job} maxLength={50000} onChange={event => actions.setJob(event.target.value)} placeholder="Copy the job listing here, including responsibilities and required skills" /><div className="editor-footer"><span>More detail makes better connections.</span><span>{model.job.length.toLocaleString()} / 50,000</span></div></section>
    </div>
    <div className="analysis-action"><div><Icon name="shield" size={18} /><span>{valid ? 'Ready when you are. Let’s connect the dots.' : 'Add a little more detail to both fields before comparing.'}</span></div><button className="button button-dark" disabled={!valid || pending || model.pending.upload} onClick={actions.analyze}>{pending ? <Spinner label="Analyzing your experience" /> : <Icon name="spark" size={17} />}{pending ? 'Connecting the dots…' : 'Compare my resume with this job'}{!pending && <Icon name="arrow" size={17} />}</button></div>
    {pending && <div className="working-note" role="status"><span className="pulse-dot" /><div><strong>A thoughtful answer takes a little time.</strong><p>Your local model is reviewing skills, retrieving context, and putting together a plan.</p></div></div>}
    {model.result && <AnalysisResult result={model.result} demo={model.demo} />}
  </div>;
}

function Feedback({ feedback, demo }) {
  const evaluation = feedback.evaluation;
  return <section className="surface feedback-panel page-enter"><div className="panel-heading"><div><span className="eyebrow">SOMETHING TO BUILD ON</span><h2>{demo ? 'Example feedback' : 'Your last answer'}</h2></div><span className="quiet-tag">{Math.round(Number(evaluation.score) || 0)} / 100</span></div><div className="feedback-question">{feedback.question}</div><div className="rubric-grid">{['correctness', 'relevance', 'completeness', 'communication'].map(key => <div key={key}><span>{key}</span><strong>{Math.round(Number(evaluation[key]) || 0)}<small>/100</small></strong><div className="rubric-track"><span style={{ width: Math.max(0, Math.min(100, Number(evaluation[key]) || 0)) + '%' }} /></div></div>)}</div><RichText>{evaluation.feedback || evaluation}</RichText>{evaluation.follow_up && <p className="follow-up"><strong>Think about this next:</strong> {evaluation.follow_up}</p>}</section>;
}

function Interview({ model, actions }) {
  const recognitionRef = useRef(null);
  const transcriptBase = useRef('');
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  useEffect(() => () => recognitionRef.current?.abort(), []);
  const toggleDictation = () => {
    setSpeechError('');
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSpeechError('Speech-to-text is not available in this browser. You can still type your answer.'); return; }
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      transcriptBase.current = model.answer.trim();
      recognition.onresult = event => {
        const spoken = Array.from(event.results).map(result => result[0].transcript).join(' ').trim();
        actions.setAnswer([transcriptBase.current, spoken].filter(Boolean).join(' '));
      };
      recognition.onerror = event => { setListening(false); setSpeechError(event.error === 'not-allowed' ? 'Microphone access was blocked. Allow it in your browser settings, then try again.' : 'Speech recognition stopped. You can continue typing or try again.'); };
      recognition.onend = () => setListening(false);
      recognition.start(); setListening(true);
    } catch { setListening(false); setSpeechError('Could not start speech recognition. Check microphone access and try again.'); }
  };
  const hasContext = model.resume.trim().length >= 30 && model.job.trim().length >= 30;
  return <div className="page-enter">
    <PageHeading eyebrow="INTERVIEW STUDIO" title={<>A little practice. <em>More confidence.</em></>} description="Questions shaped by your experience, with room to think and useful feedback." />
    {!model.session ? <div className="interview-setup-grid"><section className="surface interview-setup"><span className="studio-label"><span className="tiny-dot" /> THE INTERVIEW STUDIO</span><h2>Make yourself<br />a little more ready.</h2><p>Your resume and target role shape the questions. You bring the thinking; your interviewer brings a fresh perspective.</p><div className={'context-status ' + (hasContext ? 'has-context' : '')}><Icon name={hasContext ? 'check' : 'file'} size={20} /><div><strong>{hasContext ? 'Your context is ready.' : 'A little context goes a long way.'}</strong><span>{hasContext ? 'Using the resume and job description from Role fit.' : 'Add your resume and target role before you begin.'}</span></div><button className="text-button" onClick={() => actions.navigate('analysis')}>{hasContext ? 'Review' : 'Add context'}<Icon name="arrow" size={15} /></button></div><fieldset className="difficulty-field"><legend>Choose your pace</legend><div className="difficulty-options">{['easy', 'medium', 'hard'].map(level => <label className={model.difficulty === level ? 'is-selected' : ''} key={level}><input type="radio" name="difficulty" value={level} checked={model.difficulty === level} onChange={() => actions.setDifficulty(level)} /><span>{level === 'easy' ? 'Warm up' : level === 'medium' ? 'Find your stride' : 'Stretch yourself'}</span></label>)}</div></fieldset><button className="button button-dark" onClick={actions.startInterview} disabled={!hasContext || model.pending.interview}>{model.pending.interview ? <Spinner label="Preparing your question" /> : <Icon name="mic" size={18} />}{model.pending.interview ? 'Setting the scene…' : 'Start a practice session'}<Icon name="arrow" size={17} /></button></section><aside className="studio-aside"><div className="studio-orbits" aria-hidden="true"><i /><i /><i /><span><Icon name="mic" size={42} /></span><div className="orbit-satellite" /></div><span className="eyebrow">THINKING OUT LOUD, IN WRITING.</span><h3>Confidence comes<br />from the doing.</h3><p>Get feedback on correctness, relevance, completeness, and communication. No timer. No audience. Just practice.</p><span className="mono">YOUR PACE. YOUR PROGRESS.</span></aside></div> : <>
      <section className="surface question-panel"><div className="panel-heading"><span className="studio-label"><span className="pulse-dot" /> SESSION IN PROGRESS</span><div className="question-tags"><span className="quiet-tag">{model.difficulty}</span><button className="text-button" onClick={() => { recognitionRef.current?.abort(); setListening(false); actions.endInterview(); }} disabled={model.pending.interview}>End session<Icon name="close" size={14} /></button></div></div><span className="eyebrow">QUESTION {String(model.questionNumber).padStart(2, '0')}</span><h2 className="interview-question">{model.question}</h2><label className="field-label" htmlFor="interview-answer">Talk us through your thinking</label><textarea id="interview-answer" value={model.answer} onChange={event => { transcriptBase.current = event.target.value.trim(); actions.setAnswer(event.target.value); }} maxLength={12000} placeholder="Start with the problem. Explain your approach, decisions, and trade-offs…" /><div className="speech-controls"><button type="button" className={'button button-outline button-small ' + (listening ? 'is-listening' : '')} onClick={toggleDictation} disabled={model.pending.interview}><Icon name={listening ? 'close' : 'mic'} size={16} />{listening ? 'Stop dictation' : 'Answer by voice'}</button><span>{listening ? 'Listening… speak naturally; your words will appear above.' : 'Your browser handles dictation; only the transcript is sent with your answer.'}</span></div>{speechError && <p className="form-error speech-error" role="alert">{speechError}</p>}<div className="answer-footer"><span><Icon name="clock" size={15} /> Take your time. Clear thinking matters.</span><button className="button button-dark button-small" disabled={!model.answer.trim() || model.pending.interview || listening} onClick={actions.answerInterview}>{model.pending.interview ? <Spinner label="Reviewing your answer" /> : null}{model.pending.interview ? 'Thinking it through…' : 'Get feedback & continue'}<Icon name="arrow" size={16} /></button></div></section>
      {model.feedback && <Feedback feedback={model.feedback} demo={model.demo} />}
    </>}
  </div>;
}

const PROMPTS = ['How does hybrid retrieval work?', 'How do I show impact in my resume?', 'How should I prepare for a Python interview?'];

function Assistant({ model, actions }) {
  const endRef = useRef(null);
  useEffect(() => { if (model.messages.length) endRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'end' }); }, [model.messages.length, model.pending.chat]);
  return <div className="assistant-page page-enter">
    <PageHeading eyebrow="CAREER COACH" title={<>Let’s work out <em>what’s next.</em></>} description="Ask a question, sharpen your story, or find a practical next step." action={model.messages.length ? <button className="button button-outline button-small" onClick={actions.clearChat} disabled={model.pending.chat}><Icon name="plus" size={15} /> New conversation</button> : null} />
    <section className="surface chat-panel">
      <div className="chat-panel-header"><div><span className="assistant-avatar"><Icon name="spark" size={19} /></span><span><strong>Career coach</strong><small>{model.demo ? 'Preview conversation · example answers' : 'Uses your resume and target role'}</small></span></div></div>
      <div className="chat-messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        {!model.messages.length ? <div className="chat-welcome"><div className="welcome-symbol"><Icon name="spark" size={36} /></div><span className="eyebrow">THERE’S NO WRONG STARTING POINT.</span><h2>What’s on your mind?</h2><p>A concept to understand. A story to sharpen.<br />A question you’ve been meaning to ask.</p><div className="suggested-prompts">{PROMPTS.map(prompt => <button key={prompt} onClick={() => actions.ask(prompt)} disabled={model.pending.chat}>{prompt}<Icon name="arrowUp" size={15} /></button>)}</div></div> : model.messages.map(message => <article className={'chat-message ' + message.role} key={message.id}><span className="message-avatar">{message.role === 'assistant' ? <Icon name="spark" size={17} /> : 'Y'}</span><div><span className="message-author">{message.role === 'assistant' ? 'CareerPilot' : 'You'}{message.preview && <small>EXAMPLE</small>}</span><RichText>{message.content}</RichText>{message.sources?.length > 0 && <div className="message-sources"><span className="mono">RETRIEVED CONTEXT</span>{[...new Set(message.sources.map(source => source.source || source.topic || 'Knowledge base'))].map(source => <span key={source}><Icon name="book" size={12} />{source}</span>)}</div>}{message.grounding && <span className="grounding-note"><Icon name="info" size={12} />{message.grounding.grounded ? 'Evidence overlap detected. Review the sources for context.' : 'Limited supporting evidence. Treat this as a starting point.'}</span>}</div></article>)}
        {model.pending.chat && <div className="chat-message assistant chat-thinking" role="status"><span className="message-avatar"><Icon name="spark" size={17} /></span><span><i /><i /><i /> Thinking with a little context…</span></div>}<div ref={endRef} />
      </div>
      <form className="chat-compose" onSubmit={event => { event.preventDefault(); actions.ask(model.query); }}><label htmlFor="chat-input" className="visually-hidden">Your career question</label><div className="compose-field"><textarea id="chat-input" rows="1" value={model.query} maxLength={4000} onChange={event => actions.setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (model.query.trim() && !model.pending.chat) actions.ask(model.query); } }} placeholder="Ask a question. Follow a thought." /><button className="send-button" type="submit" aria-label="Send question" disabled={model.query.trim().length < 2 || model.pending.chat}>{model.pending.chat ? <Spinner /> : <Icon name="arrow" size={19} />}</button></div><div className="compose-note"><span>Stay curious. Check important details.</span><span className="mono">ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span></div></form>
    </section>
  </div>;
}

export default function Workspace({ model, actions }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 899px)').matches);
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 899px)');
    const update = event => { setNarrow(event.matches); if (!event.matches) setMobileOpen(false); };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!narrow || !mobileOpen) return;
    const drawer = sidebarRef.current;
    drawer.querySelector('button')?.focus({ preventScroll: true });
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setMobileOpen(false); }
      if (event.key !== 'Tab') return;
      const items = [...drawer.querySelectorAll('button:not([disabled]), a[href]')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); triggerRef.current?.focus({ preventScroll: true }); };
  }, [narrow, mobileOpen]);
  const active = NAVIGATION.find(item => item.id === model.active) || NAVIGATION[0];
  const navigate = id => { setMobileOpen(false); actions.navigate(id); };
  return <div className="workspace-shell">
    <a className="skip-link" href="#workspace-main">Skip to workspace</a>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={'sidebar ' + (mobileOpen ? 'is-open' : '')} ref={sidebarRef} role={narrow ? 'dialog' : undefined} aria-modal={narrow && mobileOpen ? true : undefined} aria-hidden={narrow && !mobileOpen ? true : undefined} inert={narrow && !mobileOpen} aria-label="Workspace navigation"><div className="sidebar-brand"><button className="brand-link" onClick={() => navigate('overview')} aria-label="CareerPilot overview"><Brand /></button><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><Icon name="close" /></button></div><span className="sidebar-section-label mono">YOUR TOOLKIT</span><nav>{NAVIGATION.map(item => <button key={item.id} onClick={() => navigate(item.id)} className={'nav-item ' + (model.active === item.id ? 'is-active' : '')} aria-current={model.active === item.id ? 'page' : undefined}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom">{model.demo ? <button className="sidebar-account" onClick={() => actions.openAuth('register')}><span className="profile-avatar"><Icon name="eye" size={17} /></span><span>Just looking around<small>Create your workspace</small></span><Icon name="arrowUp" size={15} /></button> : <button className="sidebar-account" onClick={actions.logout} title="Sign out"><span className="profile-avatar">{(model.email || 'Y').slice(0, 1).toUpperCase()}</span><span>{model.email || 'Your account'}<small>Sign out of workspace</small></span><Icon name="logout" size={15} /></button>}</div></aside>
    <div className="workspace-body" inert={narrow && mobileOpen}><header className="workspace-header"><div className="workspace-breadcrumb"><button className="icon-button mobile-menu" ref={triggerRef} aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{active.label}</strong></div><div className="workspace-header-right">{!model.demo && <span className={'connection-note ' + (model.online === true ? 'is-online' : '')}><span className="tiny-dot" />{model.online === true ? 'Server connected' : model.online === false ? 'Server offline' : 'Connecting'}</span>}<button className="command-trigger" onClick={actions.openCommand} aria-label="Search Ctrl K"><Icon name="search" size={16} /><span>Search</span>{' '}<kbd aria-hidden="true">Ctrl K</kbd></button></div></header>
      {model.demo && <aside className="demo-banner" aria-label="Preview workspace notice"><div><span className="quiet-tag">PREVIEW</span><span>Sample data, nothing saved.</span></div><button onClick={() => actions.openAuth('register')}>Create account<Icon name="arrowUp" size={14} /></button></aside>}
      {model.online === false && !model.demo && <div className="offline-banner" role="status"><Icon name="info" size={17} /> The local server is unavailable. Your drafts are still here.<button onClick={actions.checkConnection}>Check again</button></div>}
      <main className="workspace-main" id="workspace-main" key={model.active}>{model.active === 'overview' ? <Overview model={model} actions={actions} /> : model.active === 'analysis' ? <Analysis model={model} actions={actions} /> : model.active === 'interview' ? <Interview model={model} actions={actions} /> : <Assistant model={model} actions={actions} />}</main>
      <footer className="workspace-footer"><span>Your career, a little clearer.</span>{model.demo && <button onClick={actions.home}>Back to home <Icon name="arrowUp" size={12} /></button>}</footer>
    </div>
  </div>;
}


