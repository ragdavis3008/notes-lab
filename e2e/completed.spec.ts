import { expect, test, type Page } from '@playwright/test';

// Unique per run, so tests never touch notes that belong to someone else.
const runId = Date.now().toString(36);
const created: string[] = [];

function uniqueTitle(label: string) {
  const title = `e2e ${label} ${runId}`;
  created.push(title);
  return title;
}

// Local calendar date n days from today. `iso` is what the form saves (YYYY-MM-DD);
// `display` is how a note card shows it (dd/mm/yyyy).
function dateFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { iso: `${year}-${month}-${day}`, display: `${day}/${month}/${year}` };
}

async function createNote(page: Page, title: string, dueDate: { display: string }) {
  await page.goto('/notes/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Due date').fill(dueDate.display);
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

function completeBox(page: Page, title: string) {
  return page.getByRole('checkbox', { name: `Complete note ${title}` });
}

async function openAllNotes(page: Page) {
  await page.goto('/notes');
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
}

async function openCompleted(page: Page) {
  await page.goto('/notes');
  await page.getByRole('link', { name: /^Completed/ }).first().click({ timeout: 5000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Completed' })).toBeVisible();
}

async function deleteFromList(page: Page, title: string) {
  await page.getByRole('button', { name: `Delete note ${title}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
}

// Removes whatever is left of the notes this run created, in All notes or Completed,
// even after a failure.
test.afterEach(async ({ page }) => {
  for (const open of [openAllNotes, openCompleted]) {
    await open(page).catch(() => undefined);
    for (const title of created) {
      const button = page.getByRole('button', { name: `Delete note ${title}` });
      if ((await button.count()) > 0) {
        await deleteFromList(page, title);
        await expect(button).toHaveCount(0);
      }
    }
  }
  created.length = 0;
});

test('completing a note moves it to Completed, and unchecking brings it back', async ({
  page,
}) => {
  const title = uniqueTitle('completed');
  const yesterday = dateFromToday(-1);
  const today = dateFromToday(0);

  await createNote(page, title, yesterday);
  await expect(noteLink(page, title)).toBeVisible();

  // Mark it completed: it saves straight away and leaves All notes.
  await completeBox(page, title).check();
  await expect(noteLink(page, title)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(noteLink(page, title)).toHaveCount(0);

  // It is gone from the Overdue chip too.
  await chip(page, 'Overdue').click();
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(noteLink(page, title)).toHaveCount(0);

  // The Completed page lists it with the date it was completed.
  await openCompleted(page);
  await expect(noteLink(page, title)).toBeVisible();
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: title })
      .getByText(`Completed ${today.display}`, { exact: true }),
  ).toBeVisible();

  // Unchecking it there moves it back to the main list.
  await completeBox(page, title).uncheck();
  await expect(noteLink(page, title)).toHaveCount(0);

  await openAllNotes(page);
  await expect(noteLink(page, title)).toBeVisible();
  await chip(page, 'Overdue').click();
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(noteLink(page, title)).toBeVisible();
});
