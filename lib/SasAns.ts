import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';
import { StackProps } from 'aws-cdk-lib';

// interface CustomStackProps extends cdk.StackProps {
//   customRole: Role;
//   // eventBus: IEventBus;
// }

export class SasAns extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    /* -------------------------------------------------------------------------- */
    /*                          Cria tabela AnsPickLists                          */
    /* -------------------------------------------------------------------------- */
    const tabela = EverestDynamoDBConstructor.createTablePk({
      scope: this,
      props: props,
      tableName: 'AnsResposta',
      pk: 'pk',
    });

    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      table: tabela,
      indexName: 'cliente-created_at-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'created_at',
    });
  }
}
