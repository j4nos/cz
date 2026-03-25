import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export async function deleteCognitoUser(input: {
  userPoolId: string;
  username: string;
  region: string;
}): Promise<void> {
  const cognito = new CognitoIdentityProviderClient({ region: input.region });
  const command = new AdminDeleteUserCommand({
    UserPoolId: input.userPoolId,
    Username: input.username,
  });
  await cognito.send(command);
}
