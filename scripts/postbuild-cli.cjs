const fs = require('fs');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
const content = '#!/usr/bin/env node\nimport(\'./src/cli.js\');\n';
fs.writeFileSync(cliPath, content, { encoding: 'utf8', mode: 0o755 });
