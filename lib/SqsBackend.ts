import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';
import { EverestSqsConstructor } from './cdkLibs/everest.sqs.constructor';

export class SqsBackend extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const customRole = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'Everest',
    });

    const lambdas: string[] = [
      'PosTipificacao',
      'PosIntegracao',
      'PosAuditoriaOito',
      'PosEsteiraOito',
      'PosEsteiraCliente',
      'EmailAutomatico',
      'PortalUploads',
      'Migracao',
      'TblDemandaTrigger',
      'TblDemandaDadoTrigger',
      'GmailAttachmentS3',
      'ExtracaoAutomatica',
      'SasAnsPush',
      'Email',
      'PosEmail',
      'IntegracaoPlataformaColeta',
      'Pink_Cerebro',
      'YelumRobo',
      'YelumRoboProtocolo',
    ];

    for (const lambda of lambdas) {
      const queuePortalUploads = EverestSqsConstructor.createSqsFifoWithDql({
        scope: this,
        props: props,
        queueNome: `${lambda}Sqs`,
        maxReceiveCount: 3,
        visibilityTimeout: 60,
      });
    }

    /* ----------------------------- Filas não FIFO ----------------------------- */
    EverestSqsConstructor.createSqsWithDql({
      scope: this,
      props: props,
      queueNome: 'PosDemandaCriada',
      maxReceiveCount: 2,
      visibilityTimeout: 60,
    });
    /* -------------------------------------------------------------------------- */

    /* ----------------------------- Filas não FIFO ----------------------------- */
    EverestSqsConstructor.createSqsWithDql({
      scope: this,
      props: props,
      queueNome: 'AnsResposta',
      maxReceiveCount: 1,
      visibilityTimeout: 120,
    });
    /* -------------------------------------------------------------------------- */

    Tags.of(customRole).add('Description', `${props?.tags?.Description}`);
    Tags.of(customRole).add('Project', `${props?.tags?.Project}`);
    Tags.of(customRole).add('Environment', `${props?.tags?.Environment}`);
  }
}
