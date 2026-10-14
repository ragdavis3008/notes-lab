# Supabase JS client — CRUD reference

- Copied from the official Supabase docs for use in this project.
- supabase-js version: 2.117.3 (via @supabase/ssr 0.12.7)
- Date copied: 2026-10-13

## Read rows (select)
Source: https://supabase.com/docs/reference/javascript/select

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
```

## Create rows (insert)
Source: https://supabase.com/docs/reference/javascript/insert

```ts
const { error } = await supabase
  .from('countries')
  .insert({ id: 1, name: 'Mordor' })
```

## Change rows (update)
Source: https://supabase.com/docs/reference/javascript/update

```ts
const { error } = await supabase
  .from('instruments')
  .update({ name: 'piano' })
  .eq('id', 1)
```

## Remove rows (delete)
Source: https://supabase.com/docs/reference/javascript/delete

```ts
const response = await supabase
  .from('countries')
  .delete()
  .eq('id', 1)
```

## Sort rows (order)
Source: https://supabase.com/docs/reference/javascript/using-modifiers-order

```ts
const { data, error } = await supabase
  .from('characters')
  .select('id, name')
  .order('id', { ascending: false })
```

## Zero or one row (maybeSingle)
Source: https://supabase.com/docs/reference/javascript/using-modifiers-maybesingle

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
  .eq('name', 'Katniss')
  .maybeSingle()
```

## Return changed rows (select after update or delete)
Source: https://supabase.com/docs/reference/javascript/using-modifiers-select

```ts
const { data, error } = await supabase
  .from('characters')
  .upsert({ id: 1, name: 'Han Solo' })
  .select()
```

## Filter: equal to a value (eq)
Source: https://supabase.com/docs/reference/javascript/using-filters-eq

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
  .eq('name', 'Leia')
```

## Filter: is null (is)
Source: https://supabase.com/docs/reference/javascript/using-filters-is

```ts
const { data, error } = await supabase
  .from('countries')
  .select()
  .is('name', null)
```

## Read related rows through a join table
Source: https://supabase.com/docs/reference/javascript/select
(Example tab: "Query referenced tables through a join table")

Note: this project does not use embedded selects. lib/db.ts reads note_tags
with select/eq/in and joins notes and tags in code instead.

```ts
const { data, error } = await supabase
  .from('users')
  .select(`
    name,
    teams (
      name
    )
  `)
```

## Filter: value is in a list (in)
Source: https://supabase.com/docs/reference/javascript/using-filters-in

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
  .in('name', ['Leia', 'Han'])
```

## Full-text search filter (textSearch)
Source: https://supabase.com/docs/reference/javascript/using-filters-textsearch

```ts
const result = await supabase
  .from("texts")
  .select("content")
  .textSearch("content", `'eggs' & 'ham'`, {
    config: "english",
  });
```
How this project uses it: lib/db.ts keeps only the letters and digits from the search
text, turns each word into `word:*` and joins them with ` & `, then calls
`.textSearch('search_vector', 'meet:* & notes:*', { config: 'english' })`. Notes are
read with an explicit column list, so search_vector is never sent to the app.

The english config must match the config used for search_vector and its index. With
it, Postgres stems words (edit finds edited) and drops stop words (the, and, of), so a
search made only of stop words returns no notes.

## Full-text search: prefix matching while typing
Source: https://supabase.com/docs/guides/database/full-text-search (section "Implementing partial search")

```sql
select title from books where to_tsvector(title) @@ to_tsquery('Lit:*');
```

Note: `.textSearch()` without a `type` option uses `to_tsquery`, so the same `word:*`
prefix syntax works there. This project does not use the RPC approach from the guide.