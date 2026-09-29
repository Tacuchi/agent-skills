# Fictional example (PostgreSQL; read only)

```sql
SELECT id, name FROM example WHERE id = $1;
```

Parameter `$1`: an identifier the applier supplies as separate data. The table name is fictional. For schema or data changes, deliver forward and rollback to the applier in separate files; this skill never runs them.
