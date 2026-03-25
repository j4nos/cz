import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

import type { RequestClaimPort } from "@/src/application/interfaces/requestClaimPort";
import {
  getAmplifyDataRegion,
  getAmplifyModelTableName,
} from "@/src/infrastructure/dynamodb/amplifyTableNames";

const CONTRACT_DEPLOYMENT_REQUEST_TABLE = getAmplifyModelTableName("ContractDeploymentRequest");
const MINT_REQUEST_TABLE = getAmplifyModelTableName("MintRequest");

export class DynamoDbRequestClaimGateway implements RequestClaimPort {
  private readonly client = new DynamoDBClient({ region: getAmplifyDataRegion() });

  async claimContractDeploymentRequest(input: {
    requestId: string;
    claimedAt: string;
  }): Promise<boolean> {
    return this.claim({
      tableName: CONTRACT_DEPLOYMENT_REQUEST_TABLE,
      requestId: input.requestId,
      claimedAt: input.claimedAt,
      statusName: "deploymentStatus",
    });
  }

  async claimMintRequest(input: { requestId: string; claimedAt: string }): Promise<boolean> {
    return this.claim({
      tableName: MINT_REQUEST_TABLE,
      requestId: input.requestId,
      claimedAt: input.claimedAt,
      statusName: "mintStatus",
    });
  }

  private async claim(input: {
    tableName: string;
    requestId: string;
    claimedAt: string;
    statusName: "deploymentStatus" | "mintStatus";
  }) {
    try {
      console.info("[request-claim] attempting claim", {
        tableName: input.tableName,
        requestId: input.requestId,
        statusName: input.statusName,
      });
      await this.client.send(
        new UpdateItemCommand({
          TableName: input.tableName,
          Key: { id: { S: input.requestId } },
          ConditionExpression:
            "attribute_exists(#id) AND (#status = :queued OR #status = :failed)",
          UpdateExpression:
            "SET #status = :submitting, #updatedAt = :updatedAt REMOVE #errorCode, #errorMessage",
          ExpressionAttributeNames: {
            "#id": "id",
            "#status": input.statusName,
            "#updatedAt": "updatedAt",
            "#errorCode": "errorCode",
            "#errorMessage": "errorMessage",
          },
          ExpressionAttributeValues: {
            ":queued": { S: "queued" },
            ":failed": { S: "failed" },
            ":submitting": { S: "submitting" },
            ":updatedAt": { S: input.claimedAt },
          },
        }),
      );
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      const errorName =
        typeof error === "object" && error && "name" in error ? String((error as { name?: unknown }).name) : "";
      if (process.env.NODE_ENV !== "production" && errorName === "ResourceNotFoundException") {
        console.warn("[request-claim] table not found, skipping claim in non-production", {
          tableName: input.tableName,
          requestId: input.requestId,
          statusName: input.statusName,
        });
        return true;
      }
      throw error;
    }
  }
}
