# API: CLI Commands

## normalize
- Inputs: Actions env, `--in` file
- Output: NE JSON

## enrich
- Inputs: NE or raw payload
- Output: NE JSON with `enriched.*`

## emit
- Inputs: NE JSON
- Output: files/stdout; future sinks

### Usage

```
events emit --in path/to/event.json             # emit to stdout (default)
events emit --in path/to/event.json --sink stdout
events emit --in path/to/event.json --sink file --out out.json

# stdin
cat event.json | events emit
```

### Notes
- Redacts secrets via existing redaction utility.
- Exits non-zero on parse/IO errors.
