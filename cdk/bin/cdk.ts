import * as cdk from 'aws-cdk-lib';

import { JitRBaseIoTPolicyStack } from '../lib/jitRBaseIoTPolicyStack';
import { JitRAppIoTPolicyStack } from '../lib/jitRAppIoTPolicyStack';
import { JitRBaseFunctionsStack } from '../lib/jitRBaseFunctionsStack';
import { JitRAppFunctionsStack } from '../lib/jitRAppFunctionsStack';
import { ApiStack } from '../lib/apiStack';


const app = new cdk.App();

new JitRBaseIoTPolicyStack(
  app,
  'blog-jitr-base-iot-policy',
);
new JitRAppIoTPolicyStack(
  app,
  'blog-jitr-app-iot-policy',
);
new JitRBaseFunctionsStack(
  app,
  'blog-jitr-base-function',
);
new JitRAppFunctionsStack(
  app,
  'blog-jitr-app-function',
);
new ApiStack(
  app,
  'blog-jitr-api',
);