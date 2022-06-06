import { 
    IoTClient,
    AttachPolicyCommand,
    AttachPolicyCommandInput,
    AttachThingPrincipalCommand,
    AttachThingPrincipalCommandInput,
    CertificateStatus,
    CreateThingCommand,
    CreateThingCommandInput,
    DescribeCertificateCommand,
    DescribeCertificateCommandInput,
    DescribeCertificateCommandOutput,
    ListPrincipalThingsCommand,
    ListPrincipalThingsCommandInput,
    ListPrincipalThingsCommandOutput,
    DetachPolicyCommand,
    DetachPolicyCommandInput,
} from '@aws-sdk/client-iot';

const iotClient = new IoTClient( { region: 'ap-northeast-1' });
const jitrBasePolicyName = 'jitRBaseIoTPolicy';
const jitrAppPolicyName = 'jitRAppIoTPolicy';

const AWS_REGION = process.env.REGION;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;

interface eventObj {
  thingName: string;
  certificateId: string;
};

interface validateParam {
    thingName: string;
    certificateArn: string;
    certificateId: string;
};

interface attachCertificateToThingParam {
    thingName: string;
    certificateArn: string;
};

const validate = async(param: validateParam): Promise<boolean> => {
    // 指定したcertificateと紐づいているThingが存在しないか？
    try {
        const commandOption: ListPrincipalThingsCommandInput = {
            principal: param.certificateArn,
        };
        const command = new ListPrincipalThingsCommand(commandOption);
        const commandResult: ListPrincipalThingsCommandOutput = await iotClient.send(command);
        if (commandResult.things.length > 0) {
            console.log('certificate already used.');
            throw new Error(
                `certificate already used.${JSON.stringify(param)}`
            );
        }
    } catch (error) {
        console.log('Failed in validate First.')
        console.log({param})
        throw new Error();
    }
    try {
        // 指定したcertificateのステータスがACTIVEか？
        const commandOption: DescribeCertificateCommandInput = {
            certificateId: param.certificateId,
        };
        const command = new DescribeCertificateCommand(commandOption);
        const commandResult: DescribeCertificateCommandOutput = await iotClient.send(command);

        if (commandResult.certificateDescription!.status !== CertificateStatus.ACTIVE) {
            throw new Error(
                `certificate status is not active.${JSON.stringify(param)}`
            );            
        }
    } catch (error) {
        console.log('Failed in validate Second.')
        console.log({param})
        throw new Error();
    }

    return true

};

const createThing = async (thingName: string): Promise<void> => {
    try {
        const commandOption: CreateThingCommandInput = {
            thingName: thingName,
        };
        const command = new CreateThingCommand(commandOption);
        await iotClient.send(command);
    } catch (error) {
        console.log('Failed in createThing.');
        console.log({error});
    }
};

const attachCertificateToThing = async (param: attachCertificateToThingParam): Promise<void> => {
    try {
        const commandOption: AttachThingPrincipalCommandInput = {
            thingName: param.thingName,
            principal: param.certificateArn,
        };
        const command = new AttachThingPrincipalCommand(commandOption);
        await iotClient.send(command);
    } catch (error) {
        console.log('Failed in attachCertificateToThing.');
        console.log({error});
    }
};

const attachCertificateToAppPolicy = async (param: attachCertificateToThingParam): Promise<void> => {
    try {
        const commandOption: AttachPolicyCommandInput = {
            policyName: jitrAppPolicyName,
            target: param.certificateArn,
        }
        const command = new AttachPolicyCommand(commandOption);
        await iotClient.send(command);
    } catch (error) {
        console.log('Failed in attachCertificateToAppPolicy.');
        console.log({error});
    }  
};

const detachBaseIoTPolicy = async(certificateArn: string): Promise<void> => {
    try {
        const commandOption: DetachPolicyCommandInput = {
            policyName: jitrBasePolicyName,
            target: certificateArn,
        }
        const command = new DetachPolicyCommand(commandOption);
        await iotClient.send(command);
    } catch (error) {
        console.log('Failed in detachBaseIoTPolicy.');
        console.log({error});
    }
};

export const handler = async(event: eventObj): Promise<void> => {
    try {
        console.log({event});
        const certificateArn = `arn:aws:iot:${AWS_REGION}:${AWS_ACCOUNT_ID}:cert/${event.certificateId}`;
        await validate({
            thingName: event.thingName,
            certificateArn: certificateArn,
            certificateId: event.certificateId,
        });
        await createThing(event.thingName);
        await attachCertificateToThing({
            thingName: event.thingName,
            certificateArn: certificateArn,
        });
        await attachCertificateToAppPolicy({
            thingName: event.thingName,
            certificateArn: certificateArn,
        });

        await detachBaseIoTPolicy(certificateArn);

    } catch (error: unknown) {
        console.log({error})
        throw new Error('Failed in handler.');
    }
};
