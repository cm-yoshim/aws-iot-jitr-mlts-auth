import * as cdk from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import { Construct } from 'constructs';

interface JitRAppPolicyDocumentParam {
    accountId: string;
    region: string;
};

const getJitRAppPolicyDocument = (param: JitRAppPolicyDocumentParam): string => {
    const jitRAppPolicyDocument = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['iot:Publish', 'iot:Receive'],
        Resource: [
          `arn:aws:iot:${param.region}:${param.accountId}:topic/things/\${iot:Connection.Thing.ThingName}/*`
        ],
      },
      {
        Effect: 'Allow',
        Action: ['iot:Subscribe'],
        Resource: [
          `arn:aws:iot:${param.region}:${param.accountId}:topicfilter/things/\${iot:Connection.Thing.ThingName}/*`
        ],
      },
      {
        Effect: 'Allow',
        Action: ['iot:Connect'],
        Resource: [
          `arn:aws:iot:${param.region}:${param.accountId}:client/\${iot:Connection.Thing.ThingName}`,
        ],
      },
    ],
  });

  return jitRAppPolicyDocument;
};

export class JitRAppIoTPolicyStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const accountId = cdk.Stack.of(this).account;
      const region = cdk.Stack.of(this).region;

      const policyDocument = getJitRAppPolicyDocument({
        accountId: accountId,
        region: region,
      });

      new iot.CfnPolicy(
        this,
        'jitRAppIoTPolicy',
        {
            policyDocument: policyDocument,
            policyName: 'jitRAppIoTPolicy',
        },
      );
    }
  }