import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';
import { EverestLambdaConstructor } from './cdkLibs/everest.lambda.constructor';

interface CustomStackProps extends StackProps {}

export class TblDemanda extends cdk.Stack {
  readonly tblDemanda: Table;
  readonly tblDemandaInativo: Table;
  readonly tblDemandaDeletado: Table;
  readonly tblDemandaLogs: Table;
  readonly tableDados: Table;
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole: Role = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'TblDemanda',
    });

    this.tblDemanda = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'Demanda',
      sortKey: 'sk',
    });

    this.tblDemandaInativo = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'DemandaInativo',
      sortKey: 'sk',
    });

    this.tblDemandaDeletado = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'DemandaDeletado',
      sortKey: 'sk',
    });

    /* -------------------- Adiciona Global Secondary Indexes ------------------- */
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-sk-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'sk',
      table: this.tblDemanda,
      nonKeyAttributes: [
        'status_demanda',
        'perfil_demanda',
        'cod_nup',
        'id_cliente',
        'tipo_demanda',
        'created_at',
        'created_by',
        'updated_by',
        'updated_at',
        'data_carimbo',
        'due_date',
        'processo',
        'identificacao',
        'prioridade',
        'is_active',
        'proxima_etapa',
        'usuario_atuando',
        'status_demanda_anterior',
      ],
    });
    /* -------------------------------------------------------------------------- */

    /* -------------------- Adiciona Global Secondary Indexes ------------------- */
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-identificacao-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'identificacao',
      table: this.tblDemanda,
      nonKeyAttributes: [
        'sk',
        'status_demanda',
        'perfil_demanda',
        'cod_nup',
        'id_cliente',
        'tipo_demanda',
        'created_at',
        'created_by',
        'updated_by',
        'updated_at',
        'data_carimbo',
        'due_date',
        'processo',
        // 'identificacao',
        'prioridade',
        'is_active',
        'proxima_etapa',
        'usuario_atuando',
        'status_demanda_anterior',
      ],
    });
    /* -------------------------------------------------------------------------- */

    /* -------------------- Adiciona Global Secondary Indexes ------------------- */
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-processo-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'processo',
      table: this.tblDemanda,
      nonKeyAttributes: [
        'sk',
        'status_demanda',
        'perfil_demanda',
        'cod_nup',
        'id_cliente',
        'tipo_demanda',
        'created_at',
        'created_by',
        'updated_by',
        'updated_at',
        'data_carimbo',
        'due_date',
        // 'processo',
        'identificacao',
        'prioridade',
        'is_active',
        'proxima_etapa',
        'usuario_atuando',
        'status_demanda_anterior',
      ],
    });
    /* -------------------------------------------------------------------------- */

    /* -------------------- Adiciona Global Secondary Indexes ------------------- */
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      partitionKeyName: 'cliente',
      sortKeyName: 'status_demanda',
      indexName: 'cliente-status_demanda-index',
      table: this.tblDemanda,
    });
    /* -------------------------------------------------------------------------- */

    /* -------------------- Adiciona Global Secondary Indexes ------------------- */
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'status_demanda-perfil_demanda-index',
      partitionKeyName: 'status_demanda',
      sortKeyName: 'perfil_demanda',
      table: this.tblDemanda,
      nonKeyAttributes: [
        'cliente',
        'sk',
        // 'status_demanda',
        // 'perfil_demanda',
        'cod_nup',
        'id_cliente',
        'tipo_demanda',
        'created_at',
        'created_by',
        'updated_by',
        'updated_at',
        'data_carimbo',
        'due_date',
        'processo',
        'identificacao',
        'prioridade',
        'is_active',
        'proxima_etapa',
        'usuario_atuando',
        'status_demanda_anterior',
      ],
    });
    /* -------------------------------------------------------------------------- */

    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-cod_nup-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'cod_nup',
      table: this.tblDemanda,
      nonKeyAttributes: ['cod_nup'],
    });
    //

    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-id_cliente-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'id_cliente',
      table: this.tblDemanda,
      nonKeyAttributes: ['id_cliente'],
    });
    //

    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      indexName: 'cliente-created_at-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'created_at',
      table: this.tblDemanda,
    });
    //

    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionIncludes({
      scope: this,
      indexName: 'cliente-data_carimbo-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'data_carimbo',
      table: this.tblDemanda,
      nonKeyAttributes: ['status_demanda', 'tipo_demanda', 'created_at', 'data_carimbo', 'due_date', 'is_active'],
    });
    //

    // Adiciona Lambda
    const gravaLog = EverestLambdaConstructor.deployLambda({
      scope: this,
      props: props,
      timeOut: 60,
      lambdaName: 'DemandaGravaLog',
      memorySize: 1024,
      subDirectory: 'TblDemandaLog',
      environmentVariables: {},
      customRole: customRole,
    });

    gravaLog.node.addDependency(this.tblDemanda);
    // props.eventBus.grantPutEventsTo(gravaLog);
    //

    // Adiciona Lambda ao Stream
    const grand = EverestLambdaConstructor.grantStreamToLambda({
      scope: this,
      lambda: gravaLog,
      table: this.tblDemanda,
      props: props,
      lambdaName: 'DemandaGravaLog',
    });
    grand.node.addDependency(gravaLog);
    grand.node.addDependency(this.tblDemanda);

    this.tblDemandaLogs = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'DemandaLogs',
      sortKey: 'sk',
      ttlAttribute: 'ttl',
    });
    this.tblDemandaLogs.node.addDependency(this.tblDemanda);

    const tblEvent = EverestDynamoDBConstructor.createTablePk({
      scope: this,
      props: props,
      tableName: 'EventsLogs',
    });

    this.tableDados = EverestDynamoDBConstructor.createTablePkSk({
      scope: this,
      props: props,
      tableName: 'DemandaDado',
      sortKey: 'sk',
      pk: 'pk',
    });

    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      indexName: 'cliente-created_at-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'created_at',
      table: this.tableDados,
    });
    //
    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      indexName: 'cliente-created_by-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'created_by',
      table: this.tableDados,
    });
    //
    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      indexName: 'created_by-sk-index',
      partitionKeyName: 'created_by',
      sortKeyName: 'sk',
      table: this.tableDados,
    });
    //
    // Adiciona Global Secondary Indexes
    EverestDynamoDBConstructor.createGlobalSecondaryIndexProjectionAll({
      scope: this,
      indexName: 'cliente-sk-index',
      partitionKeyName: 'cliente',
      sortKeyName: 'sk',
      table: this.tableDados,
    });
    //

    // Adiciona Lambda
    // const triggerTblDemandaDado = EverestLambdaConstructor.deployLambda({
    //   scope: this,
    //   props: props,
    //   timeOut: 60,
    //   lambdaName: 'DemandaTriggerTblDemandaDado',
    //   memorySize: 512,
    //   subDirectory: 'TblDemandaLog',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });

    // triggerTblDemandaDado.node.addDependency(this.tableDados);
    // props.eventBus.grantPutEventsTo(triggerTblDemandaDado);

    // Adiciona Lambda ao Stream
    // const grantDemandaDado = EverestLambdaConstructor.grantStreamToLambda({
    //   scope: this,
    //   lambda: triggerTblDemandaDado,
    //   table: this.tableDados,
    //   props: props,
    //   lambdaName: 'DemandaTriggerTblDemandaDado',
    // });
    // grand.node.addDependency(triggerTblDemandaDado);
    // grand.node.addDependency(this.tableDados);

    //
  }
}
