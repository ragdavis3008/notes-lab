import { expect, test, type Page } from '@playwright/test';

// Unique per run, so tests never touch notes or tags that belong to someone else.
// Tag names are saved in lowercase, and the base-36 run id already is.
const runId = Date.now().toString(36);
const TAG_PREFIX = 'e2e-tag-';
const created: string[] = [];

function uniqueTitle(label: string) {
  const title = `e2e ${label} ${runId}`;
  created.push(title);
  return title;
}

function sidebar(page: Page) {
  return page.locator('aside');
}

// The tag's row in the sidebar: its link reads "<name><count>".
function sidebarTag(page: Page, name: string) {
  return sidebar(page).getByRole('link', { name: new RegExp(`^${name}\\s*\\d+$`) });
}

function tagMenuButton(page: Page, name: string) {
  return sidebar(page).getByRole('button', { name: `Actions for tag ${name}` });
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

async function createTag(page: Page, name: string) {
  await sidebar(page).getByRole('button', { name: '+ New tag' }).click();
  await sidebar(page).getByLabel('Tag name').fill(name);
  await sidebar(page).getByRole('button', { name: 'Add' }).click();
  await expect(sidebarTag(page, name)).toBeVisible();
}

async function createNoteWithTag(page: Page, title: string, tagName: string) {
  await page.goto('/notes/new');
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /^Tags/ }).click();
  await page.getByRole('menuitemcheckbox', { name: tagName }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Create note' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

async function deleteNoteFromList(page: Page, title: string) {
  await page.getByRole('button', { name: `Delete note ${title}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
}

// Removes whatever is left of what this run created, even after a failure: its
// notes first, then every tag whose name starts with the e2e prefix (this also
// clears tags left behind by an earlier failed run).
test.afterEach(async ({ page }) => {
  await openAllNotes(page);
  for (const title of created) {
    const button = page.getByRole('button', { name: `Delete note ${title}` });
    if ((await button.count()) > 0) {
      await deleteNoteFromList(page, title);
      await expect(button).toHaveCount(0);
    }
  }
  created.length = 0;

  const leftovers = sidebar(page).getByRole('button', {
    name: new RegExp(`^Actions for tag ${TAG_PREFIX}`),
  });
  while ((await leftovers.count()) > 0) {
    await leftovers.first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  }
});

test('rename a tag keeps its colour and notes; deleting it removes it from its notes', async ({
  page,
}) => {
  const title = uniqueTitle('tag menu');
  const oldName = `${TAG_PREFIX}${runId}`;
  const newName = `${TAG_PREFIX}renamed-${runId}`;

  await openAllNotes(page);
  await createTag(page, oldName);
  await createNoteWithTag(page, title, oldName);
  await expect(noteCard(page, title).getByRole('img', { name: oldName })).toBeVisible();

  // Give the tag a colour, so the rename has something to keep.
  await sidebar(page)
    .getByRole('button', { name: `Change colour of tag ${oldName}, currently gray` })
    .click();
  await page.getByRole('button', { name: 'red', exact: true }).click();
  await expect(
    sidebar(page).getByRole('button', { name: `Change colour of tag ${oldName}, currently red` }),
  ).toBeVisible();

  // Rename: the new name shows in the sidebar, the colour stays, the note keeps the tag.
  await tagMenuButton(page, oldName).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await sidebar(page).getByLabel(`New name for tag ${oldName}`).fill(newName);
  await sidebar(page).getByRole('button', { name: 'Save' }).click();

  await expect(sidebarTag(page, newName)).toBeVisible();
  await expect(sidebarTag(page, oldName)).toHaveCount(0);
  await expect(
    sidebar(page).getByRole('button', { name: `Change colour of tag ${newName}, currently red` }),
  ).toBeVisible();
  await page.reload();
  await expect(noteCard(page, title).getByRole('img', { name: newName })).toBeVisible();
  await expect(noteCard(page, title).getByRole('img', { name: oldName })).toHaveCount(0);

  // Select the tag in the filter, then delete it while it is selected.
  await sidebarTag(page, newName).click();
  await expect(page).toHaveURL(/tag=\d+/);
  await expect(noteLink(page, title)).toBeVisible();

  await tagMenuButton(page, newName).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const confirm = page.getByRole('alertdialog', {
    name: 'Delete this tag? It will be removed from its notes.',
  });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Delete' }).click();

  // The tag is gone from the sidebar and the note, the filter dropped it, and the
  // note itself is still there.
  await expect(sidebarTag(page, newName)).toHaveCount(0);
  await expect(page).not.toHaveURL(/tag=/);
  await expect(page.getByRole('heading', { level: 1, name: 'All notes' })).toBeVisible();
  await expect(noteLink(page, title)).toBeVisible();
  await expect(noteCard(page, title).getByRole('img', { name: newName })).toHaveCount(0);

  await page.reload();
  await expect(noteLink(page, title)).toBeVisible();
  await expect(noteCard(page, title).getByRole('img')).toHaveCount(0);
  await expect(sidebarTag(page, newName)).toHaveCount(0);
});
