import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

interface CustomStackProps extends StackProps {
  // eventBus: IEventBus;
}

export class DemandaSqs extends Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // const customRole: Role = EverestRoleConstructor.createCustomRole({
    //   scope: this,
    //   props: props,
    //   clienteName: 'DemandaSqs',
    // });

    // /* ------------------------- CRIA FILA PARA LOG ------------------------- */
    // const queueLogs = EverestSqsConstructor.createSqsFifoWithDql({
    //   scope: this,
    //   props: props,
    //   queueNome: 'DemandaLogsSqs',
    //   maxReceiveCount: 3,
    //   visibilityTimeout: 35,
    // });

    // EverestLambdaConstructor.deployLambdaWithSqsTrigger({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'DemandaLogs',
    //   memorySize: 512,
    //   subDirectory: 'DemandaSqs',
    //   environmentVariables: {},
    //   queue: queueLogs,
    //   customRole: customRole,
    // });
    // /* ---------------------------------------------------------------------- */

    // /* ----------------------- CRIA FILA PARA O ROUTER ---------------------- */
    // const queueRouter = EverestSqsConstructor.createSqsFifoWithDql({
    //   scope: this,
    //   props: props,
    //   queueNome: 'DemandaRouterSqs',
    //   maxReceiveCount: 3,
    //   visibilityTimeout: 35,
    // });

    // EverestLambdaConstructor.deployLambdaWithSqsTrigger({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'DemandaRouter',
    //   memorySize: 512,
    //   subDirectory: 'DemandaSqs',
    //   environmentVariables: {},
    //   queue: queueRouter,
    //   customRole: customRole,
    // });
    // /* ---------------------------------------------------------------------- */
  }
}
