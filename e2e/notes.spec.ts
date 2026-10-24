import { expect, test, type Page } from '@playwright/test';
import { removeTestData } from './helpers/db-cleanup';

// Unique per run, so tests never touch notes that belong to someone else.
const runId = Date.now().toString(36);
const created: string[] = [];

function uniqueTitle(label: string) {
  const title = `e2e ${label} ${runId}`;
  created.push(title);
  return title;
}

async function createNote(page: Page, title: string, content = '') {
  await page.goto('/notes/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Content').fill(content);
  await page.getByRole('button', { name: 'Create note' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

// Next.js keeps the previous page hidden in the DOM while the next one loads, and
// it has the same field ids. Wait for the visible edit page before using the form.
async function openNote(page: Page, title: string) {
  await noteLink(page, title).click();
  await expect(page.getByRole('heading', { name: 'Edit note' })).toBeVisible();
}

function noteLink(page: Page, title: string) {
  return page.getByRole('link', { name: title, exact: false }).first();
}

async function deleteFromList(page: Page, title: string) {
  await page.getByRole('button', { name: `Delete note ${title}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Move to Deleted' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
}

// Deleting in the app only moves a note to the Deleted tab, so the notes this run
// created are removed permanently in the database, even after a failure.
test.afterEach(async () => {
  await removeTestData({ noteTitles: created });
  created.length = 0;
});

test('create a note and see it in the list', async ({ page }) => {
  const title = uniqueTitle('create');
  await createNote(page, title, 'created by an e2e test');

  await expect(noteLink(page, title)).toBeVisible();
});

test('edit a note body and keep it after a refresh', async ({ page }) => {
  const title = uniqueTitle('edit');
  await createNote(page, title, 'original body');

  await openNote(page, title);
  const edited = `edited body ${runId}`;
  await page.getByLabel('Content').fill(edited);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/notes$/);

  await openNote(page, title);
  await page.reload();
  await expect(page.getByLabel('Content')).toHaveValue(edited);
});

test('deleting a note moves it from All notes to the Deleted page', async ({ page }) => {
  const title = uniqueTitle('delete');
  await createNote(page, title, 'to be deleted');
  await expect(noteLink(page, title)).toBeVisible();

  await deleteFromList(page, title);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(page.getByRole('link', { name: title })).toHaveCount(0);

  await page.goto('/notes/deleted');
  await expect(page.getByRole('heading', { level: 1, name: 'Deleted' })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
});
