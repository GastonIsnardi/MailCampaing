#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EnersaStack } from "../lib/enersa-stack";

const app = new cdk.App();

// Lista de ambientes a crear
const stages = ["dev", "prod"];
// Crear un stack para cada ambiente
for (const stage of stages) {
  new EnersaStack(app, `EnersaStack-${stage}`, {
    stage: stage,
  });
}
