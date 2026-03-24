import { defineAuth, secret } from "@aws-amplify/backend";

const appUrl = process.env.APP_URL;
const callbackUrls = [
  "http://localhost:3000/login",
  "https://localhost:3001/login",
  "http://localhost:3000/register",
  "https://localhost:3001/register",
  ...(appUrl ? [`${appUrl}/login`, `${appUrl}/register`] : []),
];

const logoutUrls = [
  "http://localhost:3000/",
  "https://localhost:3001/",
  ...(appUrl ? [`${appUrl}/`] : []),
];

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: "email",
        },
      },
      scopes: ["OPENID", "EMAIL", "PROFILE"],
      callbackUrls,
      logoutUrls,
    },
  },
});
