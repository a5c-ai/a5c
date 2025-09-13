const m = require('./scripts/redact.js');
console.log('module keys', Object.keys(m));
console.log('type redactString', typeof m.redactString);
console.log('raw inspect', m);
