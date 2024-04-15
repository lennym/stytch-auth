import 'dotenv/config';
import minimist from 'minimist';

import { auth } from './auth';

const args = minimist(process.argv.slice(2));

const usage = () => {
  console.log(`

Generate an authentication token for a given email

  yarn auth [email]
  `);
};

(async () => {
  const [email] = args._ as [string];

  if (args.help) {
    return usage();
  }

  if (!email) {
    return usage();
  }
  return auth(email);
})();
