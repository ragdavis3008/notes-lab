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