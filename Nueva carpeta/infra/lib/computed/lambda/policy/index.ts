import * as iam from "aws-cdk-lib/aws-iam";
import type * as lambda from "aws-cdk-lib/aws-lambda";

export function addGroupedPoliciesToLambda(
  lambdaFunction: lambda.Function,
  groupedPolicies: Record<string, { actions: string[]; resources: string[] }>
) {
  for (const [group, policy] of Object.entries(groupedPolicies)) {
    const sid = normalizeSid(`${lambdaFunction.functionName}-${group}`);

    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        sid,
        actions: policy.actions,
        resources: policy.resources,
        effect: iam.Effect.ALLOW,
      })
    );
  }
}

function normalizeSid(s: string): string {
  const normalized = s.replace(/[^0-9A-Za-z]/g, "");
  return normalized.substring(0, 128) || "DefaultPolicySid";
}
