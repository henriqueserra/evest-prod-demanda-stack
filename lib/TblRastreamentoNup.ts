import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends StackProps {}

export class TblRastreamentoNup extends cdk.Stack {
  readonly tblEvento: Table;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole: Role = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'TblRastreamentoNup',
    });

    this.tblEvento = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'RastreamentoNup',
      pk: 'codigo_rastreamento',
      sortKey: 'sk',
    });

    const lambdas: string[] = ['CreateRastreamento', 'GetRastreamentoNup', 'UpdateAllRastreamentoNup'];

    for (const lambda of lambdas) {
      EverestLambdaConstructor.deployLambda({
        scope: this,
        props: props,
        timeOut: 60,
        lambdaName: lambda,
        memorySize: 1024,
        subDirectory: 'TblRastreamentoNup',
        environmentVariables: {},
        customRole: customRole,
      });
    }
  }
}
