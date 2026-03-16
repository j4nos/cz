export interface RequestClaimPort {
  claimContractDeploymentRequest(input: { requestId: string; claimedAt: string }): Promise<boolean>;
  claimMintRequest(input: { requestId: string; claimedAt: string }): Promise<boolean>;
}
