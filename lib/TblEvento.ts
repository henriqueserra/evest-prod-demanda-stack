import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';

interface CustomStackProps extends StackProps {}

export class TblEvento extends cdk.Stack {
  readonly tblEvento: Table;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // const customRole: Role = EverestRoleConstructor.createCustomRole({
    //   scope: this,
    //   props: props,
    //   clienteName: 'Evento',
    // });

    this.tblEvento = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'Evento',
      pk: 'pk',
      sortKey: 'sk',
    });

    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      table: this.tblEvento,
      indexName: 'cliente-sk-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'sk',
    });

    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      table: this.tblEvento,
      indexName: 'cliente-created_at-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'created_at',
    });
  }
}
