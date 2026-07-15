import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';

import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends StackProps {
  customRole: Role;
}

export class DemandaCrud extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // const lambdas = ['CreatePk', 'GetStatusByClienteCodNup', 'GetStatusByPk', 'GetArquivoByPkSk', 'SendGridEmail'];
    const lambdas = ['CreatePk'];

    for (const lambda of lambdas) {
      /* ----------------------------- SendGridEmail ----------------------------- */
      EverestLambdaConstructor.deployLambda({
        scope: this,
        props: props,
        timeOut: 30,
        lambdaName: lambda,
        memorySize: 512,
        subDirectory: 'DemandaCrud',
        environmentVariables: {},
        customRole: props.customRole,
      });
      /* -------------------------------------------------------------------------- */
    }
  }
}
