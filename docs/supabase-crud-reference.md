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

## Filter: case-insensitive pattern match (ilike)
Source: https://supabase.com/docs/reference/javascript/using-filters-ilike

```ts
const { data, error } = await supabase
  .from('characters')
  .select()
  .ilike('name', '%lu%')
```

## Filter: match any of several conditions (or)
Source: https://supabase.com/docs/reference/javascript/using-filters-or

```ts
const { data, error } = await supabase
  .from('characters')
  .select('name')
  .or('id.eq.2,name.eq.Han')
```

## Reserved characters in filter values (quoting and escaping)
Source: https://docs.postgrest.org/en/stable/references/api/url_grammar.html#reserved-characters
(PostgREST is the API layer behind supabase-js filters such as `.or()`.)

```text
curl "http://localhost:3000/marks?name=in.(%22Quote:%5C%22%22,%22Backslash:%5C%5C%22)"
```

How this project uses it: lib/db.ts wraps the search pattern in double quotes inside
`.or()`, and escapes `"` as `\"` and `\` as `\\`, so commas, brackets and quotes in the
search text cannot change the filter. `%` and `_` are escaped separately so `ilike`
treats them literally. A typed `*` is replaced with `_`, because PostgREST treats `*`
as a wildcard in like/ilike.

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

## Full-text search: prefix matching while typing
Source: https://supabase.com/docs/guides/database/full-text-search

```ts
select title from books where to_tsvector(title) @@ to_tsquery('Lit:*');
```