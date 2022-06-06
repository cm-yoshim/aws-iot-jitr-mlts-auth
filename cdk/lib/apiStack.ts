import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const APIG_DOMAIN = process.env.CUSTOM_DOMAIN!;
const DOMAIN_CERTIFICATE_ARN = process.env.DOMAIN_CERTIFICATE_ARN!;
const CA_CERT_BUCKET_NAME = process.env.CA_CERT_BUCKET_NAME!;
const CA_CERT_KEY = process.env.CA_CERT_KEY!;


export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const sampleFunction = new NodejsFunction(
      this,
      'sampleFunction',
      {
        functionName: 'jitr-sample',
        entry: '../functions/sampleFunction.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_14_X,
        timeout: cdk.Duration.seconds(30),
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          sourceMap: true,
        },
      },
    );

    const api = new apig.RestApi(this, 'sampleApi', {
      restApiName: 'jitr-sample-api',
      endpointTypes: [apig.EndpointType.REGIONAL],
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: apig.MethodLoggingLevel.INFO,
      },
      disableExecuteApiEndpoint: true,
    });

    const sampleResource = api.root.addResource('sample');
    sampleResource.addMethod('GET', new apig.LambdaIntegration(sampleFunction));

    const caCertBucket = s3.Bucket.fromBucketName(
      this, 'caCertBucket',CA_CERT_BUCKET_NAME,
    );
    // WARN: ドメイン、証明書は手動で対応すること
    // ex.Route53でドメインを用意
    // ex.ACMで本APIで利用したいドメインでの証明書を用意（APIGatewayをリージョンタイプで用意するので、同一リージョンに作成すること）
    // ex.ここで作成したカスタムドメインの「エンドポイント設定」に出てくるAPIGatewayドメイン名と上記のドメインをCNAMEでRoute53のレコードに追加
    // ex.反映するまで少し待つこと(dig <domainName>で名前解決されるまで待つ)
    const apiGatewayCustomDomain = new apig.DomainName(
      this,
      'CustomDomain',
      {
        domainName: APIG_DOMAIN,
        certificate: Certificate.fromCertificateArn(
          this,
          'Certificate',
          DOMAIN_CERTIFICATE_ARN,
        ),
        securityPolicy: apig.SecurityPolicy.TLS_1_2,
        mtls: {
          bucket: caCertBucket,
          key: CA_CERT_KEY,
        }
      },
    );

    new apig.BasePathMapping(this, 'BasePathMapping', {
      domainName: apiGatewayCustomDomain,
      restApi: api,
    });
  }
}

export const addCorsOptions = (apiResource: apig.IResource) => {
  apiResource.addMethod('OPTIONS', new apig.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apig.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}