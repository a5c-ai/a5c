# [Validator] [Schema] - Optional string without explicit null

`composed[].reason` is typed as `[string, null]` but the property is already optional (not required). Suggest removing `null` from the union for cleaner semantics and simpler client typings.

Non-blocking; tests compile and pass as-is.
