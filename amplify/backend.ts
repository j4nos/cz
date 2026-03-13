import { defineBackend } from "@aws-amplify/backend";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { storage } from "./storage/resource.js";

export const backend = defineBackend({
  auth,
  data,
  storage,
});

const webOrigins = (process.env.WEB_ORIGINS ?? "http://localhost:3000,https://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const storageOai = new OriginAccessIdentity(backend.storage.stack, "StorageOai");
backend.storage.resources.bucket.grantRead(storageOai);

const storageCdn = new Distribution(backend.storage.stack, "StorageCdn", {
  defaultBehavior: {
    origin: new S3Origin(backend.storage.resources.bucket, {
      originAccessIdentity: storageOai,
    }),
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
});

backend.storage.resources.cfnResources.cfnBucket.corsConfiguration = {
  corsRules: [
    {
      allowedOrigins: webOrigins,
      allowedMethods: ["GET", "PUT", "POST", "HEAD"],
      allowedHeaders: ["*"],
      exposedHeaders: ["ETag"],
      maxAge: 3000,
    },
  ],
};

backend.addOutput({
  custom: {
    storageCdnUrl: `https://${storageCdn.domainName}`,
  },
});
