# Ejemplo ficticio (PostgreSQL; sólo lectura)

```sql
SELECT id, nombre FROM ejemplo WHERE id = $1;
```

Parámetro `$1`: identificador entregado por el aplicador como dato separado. El nombre de tabla es ficticio. Para cambios de esquema o datos, entregar avance y reverso en archivos separados al aplicador; esta skill nunca los ejecuta.
