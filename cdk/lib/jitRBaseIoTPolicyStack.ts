import * as cdk from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import { Construct } from 'constructs';

interface JitRBasePolicyDocumentParam {
    accountId: string;
    region: string;
};

const getJitRBasePolicyDocument = (param: JitRBasePolicyDocumentParam): string => {
    const jitRBasePolicyDocument = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['iot:Publish', 'iot:Receive'],
        Resource: [
          `arn:aws:iot:${param.region}:${param.accountId}:topic/jitr/start`,
          `arn:aws:iot:${param.region}:${param.accountId}:topic/jitr/request`,
        ],
      },
    ],
  });

  return jitRBasePolicyDocument;
};

export class JitRBaseIoTPolicyStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const accountId = cdk.Stack.of(this).account;
      const region = cdk.Stack.of(this).region;

      const policyDocument = getJitRBasePolicyDocument({
        accountId: accountId,
        region: region,
      });

      new iot.CfnPolicy(
        this,
        'jitRBaseIoTPolicy',
        {
            policyDocument: policyDocument,
            policyName: 'jitRBaseIoTPolicy',
        },
      );
    }
  }