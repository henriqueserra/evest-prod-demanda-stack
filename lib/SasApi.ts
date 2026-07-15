import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends StackProps {
  customRole: Role;
  // eventBus: IEventBus;
}

export class SasApi extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // Desbloqueia
    EverestLambdaConstructor.deployLambda({
      scope: this,
      props: props,
      timeOut: 60,
      lambdaName: 'GetToken',
      memorySize: 512,
      subDirectory: 'SasAns/SasApi',
      environmentVariables: {},
      customRole: props.customRole,
    });
    //
    // GetPickList
    EverestLambdaConstructor.deployLambda({
      scope: this,
      props: props,
      timeOut: 120,
      lambdaName: 'GetPickList',
      memorySize: 512,
      subDirectory: 'SasAns/SasApi',
      environmentVariables: {},
      customRole: props.customRole,
    });
    //
  }
}
