import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Test cleanup talks to the database directly, because deleting a note in the app
// only moves it to the Deleted tab. This is test-only code: the app itself never
// deletes a note permanently. Credentials come from .env.local and are never printed.

function readEnv(name: string) {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = new RegExp(`^${name}=(.*)$`).exec(line);
      if (match) return match[1].replace(/^(["'])(.*)\1$/, '$2');
    }
  } catch {
    // No .env.local: the variable may only come from the environment.
  }
  return undefined;
}

function requireEnv(name: string) {
  const value = readEnv(name);
  // Only the variable's name is reported, never its value.
  if (!value) throw new Error(`${name} is missing. Set it in .env.local.`);
  return value;
}

export type TestData = {
  noteTitles?: string[];
  tagNames?: string[];
  collectionNames?: string[];
};

// Permanently removes the named test rows, signed in as the E2E user. A note's
// note_tags rows go with it (ON DELETE CASCADE). Rows that are already gone are fine.
export async function removeTestData({
  noteTitles = [],
  tagNames = [],
  collectionNames = [],
}: TestData) {
  if (noteTitles.length + tagNames.length + collectionNames.length === 0) return;

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: requireEnv('E2E_EMAIL'),
    password: requireEnv('E2E_PASSWORD'),
  });
  if (signInError) throw new Error(`E2E cleanup could not sign in: ${signInError.message}`);

  const steps = [
    { table: 'notes', column: 'title', values: noteTitles },
    { table: 'tags', column: 'name', values: tagNames },
    { table: 'collections', column: 'name', values: collectionNames },
  ];
  for (const { table, column, values } of steps) {
    if (values.length === 0) continue;
    const { error } = await supabase.from(table).delete().in(column, values);
    if (error) throw new Error(`E2E cleanup could not delete from ${table}: ${error.message}`);
  }
  // No signOut(): it defaults to a global scope and would revoke the browser
  // session the tests are signed in with. This client keeps nothing to clean up.
}
