import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';

interface CustomStackProps extends StackProps {}

export class PlataformaColeta extends Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'PlataformaColeta',
    });

    const lambdas = ['ConsultaNup', 'AtualizaCitacaoIntegrada', 'ExecutaQuery'];

    for (const lambda of lambdas) {
      EverestLambdaConstructor.deployLambdaWithAccessToRds({
        scope: this,
        props: props,
        timeOut: 120,
        lambdaName: lambda,
        memorySize: 1024,
        subDirectory: 'PlataformaColeta',
        environmentVariables: {},
        customRole: customRole,
      });
    }
  }
}
