import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SAMPLE_JOB, SAMPLE_RESUME, previewAnalysis } from '../src/lib/demo.js';

const dashboard = { analyses: 0, avg_ats: 0, interviews: 0, avg_interview: 0, recent_events: [] };
const evaluation = { score: 84, correctness: 85, relevance: 89, completeness: 80, communication: 82, feedback: 'A clear answer. Explain how you would measure the result.', follow_up: 'Which metric would you monitor?' };
let calls;

test.beforeEach(async ({ page }) => {
  calls = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    let body;
    try { body = route.request().postDataJSON(); } catch { body = route.request().postData(); }
    calls.push({ path, body, authorization: route.request().headers().authorization });
    let data = {};
    let status = 200;
    if (path === '/health') data = { status: 'ok' };
    else if (path === '/dashboard') data = dashboard;
    else if (path.startsWith('/auth/')) {
      if (body.password === 'wrong-password') { status = 401; data = { detail: 'Invalid credentials' }; }
      else data = { token: 'test-session-token' };
    } else if (path === '/resume/extract') data = { text: SAMPLE_RESUME };
    else if (path === '/analysis') data = { ...previewAnalysis(body.resume_text, body.job_text), plan: Array.from({ length: 7 }, (_, index) => ({ day: index + 1, focus: 'Server-generated plan day ' + (index + 1), why: 'Connect your experience to the target role.', tasks: ['Build and test a role-specific example.'], deliverable: 'A clear project note.', interview_prompt: 'What trade-offs did you consider?' })) };
    else if (path === '/interview/start') data = { session_id: 17, question: 'How would you investigate a slow database query?' };
    else if (path === '/interview/answer') data = { evaluation, next_question: 'What would you measure after deploying the change?' };
    else if (path === '/chat') data = { answer: 'Hybrid retrieval combines semantic search and keyword search.', sources: [{ source: 'built-in career knowledge', topic: 'RAG' }], grounding: { grounded: true, confidence: .74 } };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
});

async function openNav(page, name) {
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation').getByRole('button', { name, exact: false }).click();
}

async function assertNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

async function verifyLandingContent(page) {
  for (const selector of ['.section-heading', '.tool-grid', '.process-section']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

test('landing, self-hosted typography, auth dialog and accessible structure', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next move.');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family.includes('DM Sans Variable') && font.status === 'loaded'))).toBeTruthy();
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family.includes('Instrument Serif') && font.status === 'loaded'))).toBeTruthy();
  await expect(page.getByRole('img', { name: 'Sample role fit: 82 out of 100' })).toBeVisible();
  await verifyLandingContent(page);
  await assertNoOverflow(page);
  await page.screenshot({ path: info.outputPath('landing.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Welcome back.' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Email address').fill('tester@example.com');
  await dialog.getByLabel('Password', { exact: true }).fill('wrong-password');
  await dialog.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(/Invalid credentials/);
  await assertNoOverflow(page);
  await page.screenshot({ path: info.outputPath('sign-in.png'), animations: 'disabled' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('preview connects all four tools without an account or AI request', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Take a look inside' }).click();
  await expect(page.locator('.demo-banner')).toContainText('Sample data, nothing saved.');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clearer path');
  await page.screenshot({ path: info.outputPath('overview.png'), fullPage: true, animations: 'disabled' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await openNav(page, 'Role fit');
  await page.getByRole('button', { name: 'Compare my resume with this job' }).click();
  await expect(page.getByRole('region', { name: 'Analysis results' })).toBeVisible();
  await expect(page.locator('.analysis-result')).toContainText('Preview · keyword comparison');
  await assertNoOverflow(page);
  await page.screenshot({ path: info.outputPath('role-fit.png'), fullPage: true, animations: 'disabled' });
  await openNav(page, 'Interview studio');
  await page.getByRole('button', { name: 'Start a practice session' }).click();
  await page.getByLabel('Talk us through your thinking').fill('I would instrument the service, measure retrieval quality, and compare the results with a small evaluation dataset.');
  await page.getByRole('button', { name: 'Get feedback & continue' }).click();
  await expect(page.getByRole('heading', { name: 'Example feedback' })).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: info.outputPath('interview.png'), fullPage: true, animations: 'disabled' });
  await openNav(page, 'Career coach');
  await page.getByRole('button', { name: 'How does hybrid retrieval work?' }).click();
  await expect(page.getByRole('log')).toContainText('Hybrid retrieval combines');
  await expect(page.getByRole('log')).toContainText('example response');
  await assertNoOverflow(page);
  await page.screenshot({ path: info.outputPath('assistant.png'), fullPage: true, animations: 'disabled' });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Jump to a workspace tool' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Find a workspace tool' }).fill('role');
  await page.getByRole('dialog').getByRole('button', { name: 'Role fit' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your fit.');
  expect(calls.filter(call => ['/analysis', '/interview/start', '/interview/answer', '/chat'].includes(call.path))).toEqual([]);
});

test('signed-in flow preserves upload, analysis, interview, chat and sign-out contracts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email address').fill('tester@example.com');
  await page.getByLabel('Password', { exact: true }).fill('correct-password');
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
  await expect(page.locator('.sidebar-account')).toContainText('tester@example.com');
  await expect(page.locator('.demo-banner')).toHaveCount(0);
  await openNav(page, 'Role fit');
  await page.getByRole('button', { name: 'Use an example' }).click();
  await page.getByLabel('Upload resume', { exact: true }).setInputFiles({ name: 'resume.txt', mimeType: 'text/plain', buffer: Buffer.from(SAMPLE_RESUME) });
  await expect(page.getByRole('button', { name: /Choose a resume file/ })).toBeEnabled();
  await page.getByRole('button', { name: 'Compare my resume with this job' }).click();
  await expect(page.locator('.plan-day')).toHaveCount(7);
  await expect(page.locator('.analysis-result')).toContainText('Server-generated plan day 7');
  const analysis = calls.find(call => call.path === '/analysis');
  expect(analysis.body).toEqual({ resume_text: SAMPLE_RESUME, job_text: SAMPLE_JOB });
  expect(analysis.authorization).toBe('Bearer test-session-token');
  await openNav(page, 'Interview studio');
  await page.getByRole('radio', { name: 'Stretch yourself' }).check();
  await page.getByRole('button', { name: 'Start a practice session' }).click();
  await expect(page.getByRole('heading', { name: 'How would you investigate a slow database query?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Answer by voice' })).toBeVisible();
  expect(calls.find(call => call.path === '/interview/start').body).toEqual({ resume_text: SAMPLE_RESUME, job_text: SAMPLE_JOB, difficulty: 'hard' });
  await page.getByLabel('Talk us through your thinking').fill('I would inspect the query plan, check indexes, and measure response time.');
  await page.getByRole('button', { name: 'Get feedback & continue' }).click();
  await expect(page.getByRole('heading', { name: 'Your last answer' })).toBeVisible();
  await expect(page.locator('.feedback-panel')).toContainText(evaluation.feedback);
  await openNav(page, 'Career coach');
  await page.getByLabel('Your career question', { exact: true }).fill('What is hybrid retrieval?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByRole('log')).toContainText('built-in career knowledge');
  await expect(page.getByRole('log')).toContainText('Evidence overlap detected');
  expect(calls.find(call => call.path === '/chat').body).toEqual({ query: 'What is hybrid retrieval?', resume_text: SAMPLE_RESUME, job_text: SAMPLE_JOB });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const accountMenu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await accountMenu.isVisible()) await accountMenu.click();
  await page.getByRole('button', { name: /tester@example.com/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next move.');
  expect(await page.evaluate(() => localStorage.getItem('cp_token'))).toBeNull();
});

test('small screens and reduced motion remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await expect(page.locator('.preview-window')).toHaveCSS('transform', 'none');
  await assertNoOverflow(page);
  await page.getByRole('button', { name: 'Take a look inside' }).click();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).not.toBeVisible();
  for (const name of ['Overview', 'Role fit', 'Interview studio', 'Career coach']) {
    await openNav(page, name);
    await assertNoOverflow(page);
  }
});

test('connection failures and generated markup are handled as text', async ({ page }) => {
  await page.route('**/api/health', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next move.');
  await expect(page.locator('.landing .connection-note')).toHaveCount(0);
  await page.evaluate(() => { localStorage.setItem('cp_token', 'test-session-token'); localStorage.setItem('cp_email', 'tester@example.com'); });
  await page.goto('/#/workspace/assistant');
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: /local server is unavailable/ })).toBeVisible();
  await page.route('**/api/chat', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: '<img src=x onerror="window.unexpectedScript=true"> is untrusted generated text.', sources: [] }) }));
  await page.getByLabel('Your career question', { exact: true }).fill('Show an example');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByRole('log')).toContainText('<img src=x');
  expect(await page.evaluate(() => Boolean(window.unexpectedScript))).toBeFalsy();
  expect(await page.getByRole('log').locator('img').count()).toBe(0);
});

test('signup reports unavailable account services without opening a fake session', async ({ page }) => {
  await page.route('**/api/auth/register', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html>Frontend fallback</html>' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my next move', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Make your next move.' });
  await dialog.getByLabel('Email address').fill('Candidate@Example.com');
  await dialog.getByLabel('Password', { exact: true }).fill('correct-password');
  await dialog.getByRole('button', { name: 'Create your workspace', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('The account service is unavailable');
  expect(await page.evaluate(() => localStorage.getItem('cp_token'))).toBeNull();
  expect(calls.filter(call => call.path === '/dashboard')).toEqual([]);
  await page.route('**/api/auth/register', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'The account service is temporarily unavailable. Please try again later.' }) }));
  await dialog.getByRole('button', { name: 'Create your workspace', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('The account service is temporarily unavailable');
});

test('actual same-origin API proxy reaches the local backend', async ({ request }) => {
  test.skip(!process.env.CAREERPILOT_LIVE_API, 'Enable when the local backend is running.');
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).status).toBe('ok');
});
