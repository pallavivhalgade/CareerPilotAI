export const SAMPLE_RESUME = 'Alex Morgan — Software Engineer\n\nI build thoughtful, reliable software with Python, FastAPI, React, and SQL. I designed REST APIs serving 12,000 daily requests, reduced database query times by 35%, and shipped a document-search prototype with semantic retrieval. I work closely with product and design, write automated tests, and enjoy turning ambiguous problems into useful tools.\n\nSkills: Python, FastAPI, React, SQL, Git, Docker, REST APIs, testing, and vector search.';
export const SAMPLE_JOB = 'AI Engineer — Product & Platform\n\nWe are looking for a software engineer who can take an AI feature from prototype to production. You will build Python and FastAPI services, design RAG pipelines, integrate LangChain, and work with SQL databases. Experience with Docker, automated testing, evaluation, and model monitoring is valuable.\n\nYou should communicate trade-offs clearly, collaborate with designers, and care about the details that make a product reliable.';
export const DEMO_DASHBOARD = { analyses: 4, avg_ats: 78, interviews: 3, avg_interview: 82, recent_events: [] };
export const DEMO_QUESTIONS = [
  'You have a semantic search prototype that works well on a small dataset. How would you turn it into a reliable RAG feature for production?',
  'A FastAPI endpoint becomes slow as traffic increases. How would you investigate the bottleneck and decide what to change?',
  'How would you evaluate whether a generated answer is supported by the documents your system retrieved?',
];

export function previewAnalysis(resume, job) {
  const skills = ['Python', 'FastAPI', 'React', 'SQL', 'Docker', 'LangChain', 'RAG', 'testing', 'evaluation', 'monitoring'];
  const required = skills.filter(skill => job.toLowerCase().includes(skill.toLowerCase()));
  const matched = required.filter(skill => resume.toLowerCase().includes(skill.toLowerCase()));
  const missing = required.filter(skill => !matched.includes(skill));
  const score = Math.round(matched.length / Math.max(1, required.length) * 100);
  return {
    ats: { score, skills_match: score, keyword_match: score, matched_skills: matched, missing_skills: missing },
    gap: { strong_skills: matched, missing_skills: missing, priority: missing.slice(0, 3) },
    plan: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      focus: ['Choose your target story', 'Map strengths to the role', 'Explore one skill gap', 'Build a small proof', 'Explain a technical decision', 'Practice a role-specific question', 'Polish and reflect'][index],
      why: index < 2 ? 'Connect a real project from your resume with a priority in this job description.' : `Focus on ${missing[Math.min(index - 2, Math.max(0, missing.length - 1))] || matched[index % Math.max(1, matched.length)] || 'one role-relevant skill'} without claiming experience you do not have.`,
      tasks: [index < 2 ? 'Pick one real project or responsibility from your experience.' : `Spend 30–45 minutes on ${missing[Math.min(index - 2, Math.max(0, missing.length - 1))] || 'a core role requirement'}.`, 'Write down the decisions you made and how you would explain them.'],
      deliverable: 'One concise note or example you can reuse in an interview.',
      interview_prompt: 'Which decision in this example had the greatest impact, and how do you know?'
    })),
    verification: { grounded: false, confidence: 0 },
    preview: true,
  };
}

export function previewAnswer(query) {
  if (/retriev|rag|search/i.test(query)) return 'Hybrid retrieval combines semantic search with keyword search. Semantic search finds related meaning; keyword search preserves precise terms such as tool names and error codes.\n\nA practical pipeline retrieves candidates from both methods, removes duplicates, reranks the remaining documents, and gives the strongest evidence to the language model.\n\nFor an interview, explain why you chose each stage and how you would measure retrieval quality. This is an example response from the preview workspace.';
  if (/resume|impact|experience/i.test(query)) return 'Make each project description do three things: explain the problem, name your contribution, and show the result.\n\nFor example: “Redesigned a slow SQL query in our Python API, reducing median response time by 35%.” Only use numbers and skills you can support with evidence.\n\nChoose the details that matter to the role you want. This is an example response from the preview workspace.';
  return 'Start with the role’s core requirements. Choose one project that demonstrates your strongest relevant skills, then practice explaining the problem, your decisions, and the trade-offs.\n\nFor each gap, make a small, concrete plan: learn the concept, build a working example, and explain how you would test it.\n\nThis is an example response. Sign in to ask the local model questions grounded in your knowledge base.';
}
