import { expect, test, type Page } from '@playwright/test';
import { removeTestData } from './helpers/db-cleanup';

// Unique per run, so tests never touch notes that belong to someone else.
// Tag names are saved in lowercase, and the base-36 run id already is.
const runId = Date.now().toString(36);
const noteTitles: string[] = [];
const tagNames: string[] = [];
const collectionNames: string[] = [];

function sidebar(page: Page) {
  return page.locator('aside');
}

function noteLink(page: Page, title: string) {
  return page.getByRole('link', { name: title, exact: false }).first();
}

// The note's card in the main list; its tags are dots named after the tag.
function noteCard(page: Page, title: string) {
  return page.getByRole('main').getByRole('listitem').filter({ hasText: title });
}

async function openAllNotes(page: Page) {
  await page.goto('/notes');
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
}

async function createCollection(page: Page, name: string) {
  collectionNames.push(name);
  await sidebar(page).getByRole('button', { name: '+ New collection' }).click();
  await sidebar(page).getByLabel('Collection name').fill(name);
  await sidebar(page).getByRole('button', { name: 'Add' }).click();
  await expect(sidebar(page).getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
  // The form stays open after saving; close it so the tag form's Add button is unique.
  await sidebar(page).getByRole('button', { name: 'Close' }).click();
}

async function createTag(page: Page, name: string) {
  tagNames.push(name);
  await sidebar(page).getByRole('button', { name: '+ New tag' }).click();
  await sidebar(page).getByLabel('Tag name').fill(name);
  await sidebar(page).getByRole('button', { name: 'Add' }).click();
  await expect(sidebar(page).getByRole('link', { name: new RegExp(`^${name}\\s*\\d+$`) })).toBeVisible();
}

async function createNote(page: Page, title: string, collection: string, tag: string) {
  noteTitles.push(title);
  await page.goto('/notes/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Collection', { exact: true }).selectOption({ label: collection });
  await page.getByRole('button', { name: /^Tags/ }).click();
  await page.getByRole('menuitemcheckbox', { name: tag }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Create note' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

// Deleting in the app only moves a note to the Deleted tab, so everything this run
// created is removed permanently in the database, even after a failure.
test.afterEach(async () => {
  await removeTestData({ noteTitles, tagNames, collectionNames });
  noteTitles.length = 0;
  tagNames.length = 0;
  collectionNames.length = 0;
});

test('a deleted note leaves All notes, shows on Deleted, and restore brings it back whole', async ({
  page,
}) => {
  const title = `e2e deleted ${runId}`;
  const collection = `e2e-coll-${runId}`;
  const tag = `e2e-tag-${runId}`;

  await openAllNotes(page);
  await createCollection(page, collection);
  await createTag(page, tag);
  await createNote(page, title, collection, tag);
  await expect(noteLink(page, title)).toBeVisible();
  await expect(noteCard(page, title).getByRole('img', { name: tag })).toBeVisible();

  // The confirmation says the note is moved, not destroyed.
  await page.getByRole('button', { name: `Delete note ${title}` }).click();
  const confirm = page.getByRole('alertdialog', {
    name: 'Move this note to Deleted? It will be removed after 30 days.',
  });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Move to Deleted' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  // It is gone from All notes, also after a reload.
  await expect(noteLink(page, title)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(noteLink(page, title)).toHaveCount(0);

  // The Deleted page lists it with its countdown and a Restore button, and has no
  // way to delete it for good.
  await sidebar(page).getByRole('link', { name: /^Deleted/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Deleted' })).toBeVisible();
  const card = page.getByRole('main').getByRole('listitem').filter({ hasText: title });
  await expect(card).toBeVisible();
  await expect(card.getByText('Deletes in 30 days', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /delete forever|empty deleted/i })).toHaveCount(0);

  // Restore puts it back: in All notes, in its collection, with its tag.
  await card.getByRole('button', { name: `Restore note ${title}` }).click();
  await expect(card).toHaveCount(0);

  await openAllNotes(page);
  await expect(noteLink(page, title)).toBeVisible();
  await expect(noteCard(page, title).getByRole('img', { name: tag })).toBeVisible();

  await sidebar(page).getByRole('link', { name: new RegExp(`^${collection}`) }).click();
  await expect(page).toHaveURL(/collection=/);
  await expect(noteLink(page, title)).toBeVisible();
});
