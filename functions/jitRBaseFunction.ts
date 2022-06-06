import { 
    IoTClient,
    AttachPolicyCommand,
    AttachPolicyCommandInput,
    UpdateCertificateCommand,
    UpdateCertificateCommandInput,
    CertificateStatus,
} from '@aws-sdk/client-iot';

const iotClient = new IoTClient( { region: 'ap-northeast-1' });

const jitRBasePolicyName = 'jitRBaseIoTPolicy'
const AWS_REGION = process.env.REGION;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

interface eventObj {
  certificateId: string;
  caCertificateId: string;
  timestamp: number;
  certificateStatus: 'PENDING_ACTIVATION';
  awsAccountId: string;
  certificateRegistrationTimestamp: null;
};

export const handler = async(event: eventObj): Promise<void> => {
    try {
        console.log({event});

        // 証明書の有効化
        const activateCertificateCommandOption: UpdateCertificateCommandInput = {
            certificateId: event.certificateId,
            newStatus: CertificateStatus.ACTIVE,
        }
        const activateCertificateCommand = new UpdateCertificateCommand(activateCertificateCommandOption);
        await iotClient.send(activateCertificateCommand);
    } catch (error) {
        console.log('Failed in activate certificate.');
        console.log({error})
    }
    try {
        // 証明書とBasePolicyのアタッチ
        const certificateArn = `arn:aws:iot:${AWS_REGION}:${AWS_ACCOUNT_ID}:cert/${event.certificateId}`;
        const attachPolicyCommandOption: AttachPolicyCommandInput = {
            policyName: jitRBasePolicyName,
            target: certificateArn,
        }
        const attachPolicyCommand = new AttachPolicyCommand(attachPolicyCommandOption);
        await iotClient.send(attachPolicyCommand);
    } catch (error) {
        console.log('Failed in attach policy to certificate.');
        console.log({error})
    }
};
