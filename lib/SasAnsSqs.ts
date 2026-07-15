import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';
import { EverestSqsConstructor } from './cdkLibs/everest.sqs.constructor';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends cdk.StackProps {
  // eventBus: IEventBus;
}

export class SasAnsSqs extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole: Role = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'SasAnsSqs',
    });

    EverestSqsConstructor.createSqsWithDql({
      scope: this,
      props: props,
      queueNome: 'AnsResposta',
      maxReceiveCount: 2,
      visibilityTimeout: 300,
    });

    const queueAnsProtocolo = EverestSqsConstructor.createSqsWithoutDql({
      scope: this,
      props: props,
      queueNome: 'AnsProtocolo',
      maxReceiveCount: 2,
      visibilityTimeout: 300,
    });

    // EverestLambdaConstructor.deployLambdaWithSqsTrigger({
    //   scope: this,
    //   props: props,
    //   queue: queueAnsProtocolo,
    //   timeOut: 240,
    //   memorySize: 1024,
    //   subDirectory: 'SasAns/SasAnsSqs',
    //   lambdaName: 'AnsProtocoloLambda',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });
  }
}
