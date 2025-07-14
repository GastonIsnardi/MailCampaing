#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ComputedStack } from "../lib/computed/computed";
import { StorageStack } from "../lib/storage/storage";
const app = new cdk.App();

const storageStack = new StorageStack(app, "StorageStack-enersa", {
  envType: "PRO",
  projectName: "enersa",
});

new ComputedStack(app, "ComputedStack-enersa", {
  envType: "PRO",
  projectName: "enersa",
  dynamoTable: storageStack.dynamoTable,
  s3URL: storageStack.bucketUrl,
});
