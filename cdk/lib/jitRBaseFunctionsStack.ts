import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';


export class JitRBaseFunctionsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    const jitRBaseFunction = new NodejsFunction(
      this,
      'jitRBaseFunction',
      {
        functionName: 'jitr-base',
        entry: '../functions/jitRBaseFunction.ts',
        handler: 'handler',
        environment: {
          REGION: region,
          AWS_ACCOUNT_ID: accountId,
        },
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: cdk.Duration.seconds(60),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          sourceMap: true,
        },
      },
    );

    jitRBaseFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iot:*'],
        resources: ['*'],
      }),
    );

    const iotRole = new iam.Role(
      this,
      'jitRBaseIotRole',
      {
        assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
      },
    );

    iotRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'lambda:*',
        ],
        effect: iam.Effect.ALLOW,
        resources: [jitRBaseFunction.functionArn],
      }),
    );

    const topicRule = new iot.CfnTopicRule(
      this,
      'jitRFirstTopicRule',
      {
        ruleName: 'jitRBaseRule',
        topicRulePayload: {
          sql: "SELECT * FROM '$aws/events/certificates/registered/+' WHERE certificateStatus = 'PENDING_ACTIVATION'",
          actions: [
            {
              lambda: {
                functionArn: jitRBaseFunction.functionArn,
              },
            },
          ],
        },
      },
    );

    jitRBaseFunction.addPermission('IotPermission', {
      principal: new iam.ServicePrincipal('iot.amazonaws.com'),
      sourceArn: topicRule.attrArn,
    });
  }
}