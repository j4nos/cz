import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "assetStorage",
  access: (allow) => ({
    "public/assets/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "public/blog/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "private/assets/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
