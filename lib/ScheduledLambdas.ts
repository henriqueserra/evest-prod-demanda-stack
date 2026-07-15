import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import { EventBus, IEventBus } from 'aws-cdk-lib/aws-events';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends StackProps {
  customRole: Role;
}

export class ScheduledLambdas extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const eventBus: IEventBus = EventBus.fromEventBusArn(
      this,
      'defaultEventBus',
      `arn:aws:events:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:event-bus/Everest${
        props?.tags?.Environment
      }EventBus`
    );

    EverestLambdaConstructor.deployLambdaWithCronSchedule({
      scope: this,
      props: props,
      timeOut: 30,
      lambdaName: 'MonitoriaSqs',
      memorySize: 512,
      subDirectory: 'Scheduled',
      environmentVariables: {},
      cronExpression: 'cron(0/30 12-20 ? * MON-FRI *)',
      customRole: props.customRole,
    });

    if (props.tags?.Environment === 'Prod') {
      // SasAnsRelatorioDiarioRespostaAns
      EverestLambdaConstructor.deployLambdaWithCronSchedule({
        scope: this,
        props: props,
        timeOut: 300,
        lambdaName: 'SasAnsRelatorioDiarioRespostaAns',
        memorySize: 512,
        subDirectory: 'Scheduled/SasAns',
        environmentVariables: {},
        cronExpression: 'cron(30 13,15,17,19,21 ? * MON-FRI *)',
        customRole: props.customRole,
      });
      //
    }
  }
}
