import { expect, test, type Locator, type Page } from '@playwright/test';
import { removeTestData } from './helpers/db-cleanup';

// Unique per run, so tests never touch notes that belong to someone else.
const runId = Date.now().toString(36);
const created: string[] = [];

function uniqueTitle(label: string) {
  const title = `e2e ${label} ${runId}`;
  created.push(title);
  return title;
}

// Local calendar date n days from today, as YYYY-MM-DD (what a date input holds).
function dateFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { iso: `${d.getFullYear()}-${month}-${day}`, day: d.getDate() };
}

async function createNote(page: Page, title: string, dueDate: string) {
  await page.goto('/notes/new');
  await page.getByLabel('Title').fill(title);
  const [year, month, day] = dueDate.split('-');
  await page.getByLabel('Due date').fill(`${day}/${month}/${year}`);
  await page.getByRole('button', { name: 'Create note' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

function noteLink(page: Page, title: string) {
  return page.getByRole('link', { name: title, exact: false }).first();
}

// The chips may be links or buttons; match either by their visible name.
function chip(page: Page, name: string) {
  return page.locator('a, button').filter({ hasText: new RegExp(`^${name}\\b`) }).first();
}

// Deleting in the app only moves a note to the Deleted tab, so the notes this run
// created are removed permanently in the database, even after a failure.
test.afterEach(async () => {
  await removeTestData({ noteTitles: created });
  created.length = 0;
});

// True when the red channel clearly dominates the text colour.
async function isRed(locator: Locator) {
  const color = await locator.evaluate((el) => getComputedStyle(el).color);
  const [r, g, b] = (color.match(/\d+/g) ?? []).map(Number);
  return r > 180 && g < 120 && b < 120;
}

test('due date filter chips split overdue from upcoming, and overdue is red', async ({ page }) => {
  const overdueTitle = uniqueTitle('overdue');
  const soonTitle = uniqueTitle('soon');
  const yesterday = dateFromToday(-1);
  const inThreeDays = dateFromToday(3);

  await createNote(page, overdueTitle, yesterday.iso);
  await createNote(page, soonTitle, inThreeDays.iso);

  await chip(page, 'Overdue').click();
  await expect(noteLink(page, overdueTitle)).toBeVisible();
  await expect(page.getByRole('link', { name: soonTitle })).toHaveCount(0);

  await chip(page, 'Due in 7 days').click();
  await expect(noteLink(page, soonTitle)).toBeVisible();
  await expect(page.getByRole('link', { name: overdueTitle })).toHaveCount(0);

  await chip(page, 'All').click();
  await expect(noteLink(page, overdueTitle)).toBeVisible();
  const [year, month, day] = yesterday.iso.split('-');
  const overdueDate = page
    .getByRole('listitem')
    .filter({ hasText: overdueTitle })
    .getByText(`Due ${day}/${month}/${year}`, { exact: true });
  await expect(overdueDate).toBeVisible();
  expect(await isRed(overdueDate)).toBe(true);
});
