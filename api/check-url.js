#!/usr/bin/env node
const { runCheck } = require('./monitor');

runCheck(process.argv[2])
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
