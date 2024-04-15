import { Client } from 'stytch';

const encodedAuth = Buffer.from(
  `${process.env.STYTCH_PROJECT_ID}:${process.env.STYTCH_SECRET}`
).toString('base64');

let stytchClient: Client;

const initStytch = async (): Promise<Client> => {
  if (stytchClient) {
    return stytchClient;
  }
  const stytch = new Client({
    project_id: process.env.STYTCH_PROJECT_ID as string,
    secret: process.env.STYTCH_SECRET as string,
  });
  stytchClient = stytch;
  return stytch;
};

const getStytchUserByEmail = async (email: string) => {
  const stytch = await initStytch();
  const users = await stytch.users.search({
    query: {
      operator: 'AND',
      operands: [{ filter_name: 'email_address', filter_value: [email] }],
    },
  });

  if (users.results.length) {
    return users.results[0];
  }

  const user = await stytch.users.create({
    email,
  });
  return user;
};

type MagicLinkResponse = { token: string; error_message?: string };

const getMagicLink = async (userId: string) => {
  const domain = process.env.STYTCH_PROJECT_ID?.includes('live')
    ? 'https://api.stytch.com'
    : 'https://test.stytch.com';
  const response = await fetch(`${domain}/v1/magic_links`, {
    body: JSON.stringify({
      user_id: userId, // taken from the Stytch dev dashboard
    }),
    headers: {
      Authorization: `Basic ${encodedAuth}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const body = (await response.json()) as MagicLinkResponse;
  if (response.status > 299) {
    throw new Error(
      body.error_message || 'An error occurred fetching authentication token'
    );
  }
  return body.token;
};

const getSessionToken = async (token: string) => {
  const stytch = await initStytch();
  return stytch.magicLinks.authenticate({
    token,
    session_duration_minutes: 30,
  });
};

const auth = async (email: string) => {
  const stytchUser = await getStytchUserByEmail(email);
  const magicLink = await getMagicLink(stytchUser.user_id);
  const session = await getSessionToken(magicLink);
  console.log(session.session_jwt);
};

export { auth };
