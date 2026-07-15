import { Duration, RemovalPolicy, StackProps, Tags } from 'aws-cdk-lib';
import { BackupPlan, BackupPlanRule, BackupResource } from 'aws-cdk-lib/aws-backup';
import {
  Table,
  AttributeType,
  BillingMode,
  TableEncryption,
  StreamViewType,
  TableClass,
  ProjectionType,
  ITable,
} from 'aws-cdk-lib/aws-dynamodb';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export class EverestDynamoDBConstructor {
  static createTablePk(payload: {
    scope: Construct;
    props: StackProps;
    tableName: string;
    pk?: string;
    ttlAttribute?: string;
  }): Table {
    const partitionKey = payload.pk ? payload.pk : 'pk';
    const tabela = new Table(payload.scope, 'UsersTable', {
      tableName: `Tbl${payload?.props?.tags?.Environment as string}${payload.tableName}`,
      partitionKey: { name: partitionKey, type: AttributeType.STRING },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: payload?.props?.tags?.Environment === 'Prod' ? true : false,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      tableClass: TableClass.STANDARD,
      removalPolicy: payload?.props?.tags?.Environment === 'Prod' ? RemovalPolicy.DESTROY : RemovalPolicy.DESTROY,
      // removalPolicy: RemovalPolicy.DESTROY,
      // deletionProtection: false,
      deletionProtection: payload?.props?.tags?.Environment === 'Prod' ? false : false,
      timeToLiveAttribute: payload.ttlAttribute,
    });

    Tags.of(tabela).add('Description', `${payload?.props?.tags?.Description}`);
    Tags.of(tabela).add('Project', `${payload?.props?.tags?.Project}`);
    Tags.of(tabela).add('Environment', `${payload?.props?.tags?.Environment}`);

    return tabela;
  }

  static createTablePkSk(payload: {
    scope: Construct;
    props: StackProps;
    tableName: string;
    sortKey: string;
    pk?: string;
    ttlAttribute?: string;
  }): Table {
    const nomeTabela = `Tbl${payload?.props?.tags?.Environment as string}${payload.tableName}`;
    const partitionKey = payload.pk ? payload.pk : 'pk';
    const tabela = new Table(payload.scope, nomeTabela, {
      tableName: nomeTabela,
      partitionKey: { name: partitionKey, type: AttributeType.STRING },
      sortKey: { name: payload.sortKey, type: AttributeType.STRING },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: payload?.props?.tags?.Environment === 'Prod' ? true : false,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      tableClass: TableClass.STANDARD,
      removalPolicy: payload?.props?.tags?.Environment === 'Prod' ? RemovalPolicy.DESTROY : RemovalPolicy.DESTROY,
      // removalPolicy: RemovalPolicy.DESTROY,
      // deletionProtection: false,
      deletionProtection: payload?.props?.tags?.Environment === 'Prod' ? false : false,
      timeToLiveAttribute: payload.ttlAttribute,
    });

    Tags.of(tabela).add('Description', `${payload?.props?.tags?.Description}`);
    Tags.of(tabela).add('Project', `${payload?.props?.tags?.Project}`);
    Tags.of(tabela).add('Environment', `${payload?.props?.tags?.Environment}`);

    return tabela;
  }

  static createGlobalSecondaryIndexProjectionAll(payload: {
    scope: Construct;
    partitionKeyName: string;
    sortKeyName: string;
    table: Table;
    indexName: string;
  }): void {
    payload.table.addGlobalSecondaryIndex({
      indexName: payload.indexName,
      partitionKey: {
        name: payload.partitionKeyName,
        type: AttributeType.STRING,
      },
      sortKey: { name: payload.sortKeyName, type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });
  }

  static createGlobalSecondaryIndexProjectionIncludes(payload: {
    scope: Construct;
    partitionKeyName: string;
    sortKeyName: string;
    table: Table;
    indexName: string;
    nonKeyAttributes: string[];
  }): void {
    payload.table.addGlobalSecondaryIndex({
      indexName: payload.indexName,
      partitionKey: {
        name: payload.partitionKeyName,
        type: AttributeType.STRING,
      },
      sortKey: { name: payload.sortKeyName, type: AttributeType.STRING },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: payload.nonKeyAttributes,
    });
  }

  static createLocalSecondaryIndex(payload: {
    scope: Construct;
    sortKeyName: string;
    table: Table;
    indexName: string;
  }): void {
    payload.table.addLocalSecondaryIndex({
      indexName: payload.indexName,
      sortKey: { name: payload.sortKeyName, type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });
  }

  static createBackUpRuleAndSelection({
    tableName,
    scope,
    backupPlan,
  }: {
    tableName: string;
    scope: Construct;
    backupPlan: BackupPlan;
  }) {
    const tableTarget: ITable = Table.fromTableName(scope, tableName, tableName);
    // Define Backup Rule
    backupPlan.addRule(
      new BackupPlanRule({
        ruleName: `${tableTarget.tableName}DailyBackupRule`,
        scheduleExpression: Schedule.cron({
          // Daily at 00:00 UTC
          minute: '0',
          hour: '0',
        }),
        enableContinuousBackup: true,
        deleteAfter: process.env.ENVIRONMENT === 'Dev' ? Duration.days(5) : Duration.days(30),
      })
    );

    // Add the DynamoDB table to the Backup Plan
    backupPlan.addSelection(`${tableTarget.tableName}BackupSelection`, {
      resources: [BackupResource.fromDynamoDbTable(tableTarget)],
    });
  }
}
