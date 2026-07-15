import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';

import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';

interface CustomStackProps extends StackProps {}

export class EventoCrud extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'EventoCrud',
    });

    const lambdas = ['ListaAllEventos'];

    for (const lambda of lambdas) {
      /* ----------------------------- SendGridEmail ----------------------------- */
      EverestLambdaConstructor.deployLambda({
        scope: this,
        props: props,
        timeOut: 30,
        lambdaName: lambda,
        memorySize: 512,
        subDirectory: 'EventoCrud',
        environmentVariables: {},
        customRole: customRole,
      });
      /* -------------------------------------------------------------------------- */
    }
  }
}
