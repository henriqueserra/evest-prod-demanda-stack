import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';

interface CustomStackProps extends StackProps {}

export class TblAdmCliente extends cdk.Stack {
  readonly tblAdmCliente: Table;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // const customRole: Role = EverestRoleConstructor.createCustomRole({
    //   scope: this,
    //   props: props,
    //   clienteName: 'AdmCliente',
    // });

    this.tblAdmCliente = EverestDynamoDBConstructor.createTablePk({
      scope: this,
      props: props,
      tableName: 'AdmCliente',
      pk: 'cliente',
    });

    // Adiciona Lambda
    // const gravaLog = EverestLambdaConstructor.deployLambda({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'AdmClienteTriggeredActions',
    //   memorySize: 1024,
    //   subDirectory: 'AdmCliente',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });
    // gravaLog.node.addDependency(this.tblAdmCliente);

    // Adiciona Lambda ao Stream
    // const grand = EverestLambdaConstructor.grantStreamToLambda({
    //   scope: this,
    //   lambda: gravaLog,
    //   table: this.tblAdmCliente,
    //   props: props,
    //   lambdaName: 'AdmClienteTriggeredActions',
    // });
    //
    /* ------------------------------- Get Cliente ------------------------------ */
    // EverestLambdaConstructor.deployLambda({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'GetCliente',
    //   memorySize: 1024,
    //   subDirectory: 'AdmCliente',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });
  }
}
