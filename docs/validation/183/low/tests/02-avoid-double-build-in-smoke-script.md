# [Validator] [Tests] Avoid redundant builds in smoke script

`npm run build` may run via package `prepare` script during install and again inside `scripts/smoke-cli.sh`. Consider skipping the second build if `dist/` exists to shave CI seconds.

Priority: low
