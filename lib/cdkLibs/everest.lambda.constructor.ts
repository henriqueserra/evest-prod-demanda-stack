import * as cdk from 'aws-cdk-lib';
import { StackProps, Tags } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EventSourceMapping, FunctionUrlAuthType, InvokeMode, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IEventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { EverestRuleConstructor } from './everest.rule.constructor';
import { EverestSqsConstructor } from './everest.sqs.constructor';

export class EverestLambdaConstructor {
  static deployLambda({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    customRole,
    nodeModules = [],
    cliente,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    reservedConcurrentExecutions?: number;
    customRole: Role;
    nodeModules?: string[];
    cliente?: string;
  }): NodejsFunction {
    const functionName = `${cliente ?? props.tags?.Project}${props.tags?.Environment}${lambdaName}`;

    // Criar LogGroup com retenção de 5 dias
    const logGroup = new LogGroup(scope, `${functionName}LogGroup`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: RetentionDays.FIVE_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambda = new NodejsFunction(scope, functionName, {
      entry: `src/lambdas/${subDirectory}/${lambdaName}/index.ts`,
      handler: 'handler',
      description: props?.tags?.Description,
      runtime: Runtime.NODEJS_20_X,
      functionName: functionName,
      memorySize: memorySize,
      timeout: cdk.Duration.seconds(timeOut),
      role: customRole,
      logGroup: logGroup,
      environment: {
        ENVIRONMENT: props?.tags?.Environment as string,
        LAMBDA_PREFIXO: `${props.tags?.Project}${props?.tags?.Environment}`,
        LAMBDA_NAME: functionName,
        ...environmentVariables,
      },
      bundling: {
        nodeModules: ['axios', ...nodeModules],
        minify: false,
        sourceMap: false,
        keepNames: true,
      },
    });

    // Add tags to the Lambda function
    Tags.of(lambda).add('Description', `${props?.tags?.Description}`);
    Tags.of(lambda).add('Project', `${props?.tags?.Project}`);
    Tags.of(lambda).add('Environment', `${props?.tags?.Environment}`);

    return lambda;
  }

  static deployLambdaWithAccessToRds({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    nodeModules = [],
    customRole,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    nodeModules?: string[];
    customRole: Role;
  }): NodejsFunction {
    //
    const functionName = `${props.tags?.Project}${props.tags?.Environment}${lambdaName}`;
    // Get a existing vpc by vpc id
    const vpc = ec2.Vpc.fromLookup(scope, `${functionName}Vpc`, {
      vpcId: 'vpc-23d41d45',
    });

    // get subnet by subnet id
    const subnet: ec2.ISubnet = ec2.Subnet.fromSubnetId(scope, `${functionName}Subnet`, 'subnet-04ed0af68dc6b39b7');

    // Get security group by security group id
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      scope,
      `${functionName}SecurityGroup`,
      'sg-0b5158119d75fa36d'
    );

    // Criar LogGroup com retenção de 5 dias
    const logGroup = new LogGroup(scope, `${functionName}LogGroup`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: RetentionDays.FIVE_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambda = new NodejsFunction(scope, functionName, {
      entry: `src/lambdas/${subDirectory}/${lambdaName}/index.ts`,
      handler: 'handler',
      description: props?.tags?.Description,
      runtime: Runtime.NODEJS_20_X,
      functionName: functionName,
      memorySize: memorySize,
      timeout: cdk.Duration.seconds(timeOut),
      role: customRole ?? Role.fromRoleArn(scope, `${functionName}Role`, props?.tags?.RoleArn as string),
      logGroup: logGroup,
      vpc,
      securityGroups: [securityGroup],
      vpcSubnets: {
        subnets: [subnet],
      },
      environment: {
        ENVIRONMENT: props?.tags?.Environment as string,
        LAMBDA_PREFIXO: `${props.tags?.Project}${props?.tags?.Environment}`,
        LAMBDA_NAME: functionName,
        ...environmentVariables,
      },
      bundling: {
        nodeModules: ['aws-sdk', 'pg', 'axios', ...nodeModules],
        minify: true,
        sourceMap: false,
      },
      // tracing: Tracing.ACTIVE,
      // reservedConcurrentExecutions: reservedConcurrentExecutions,
    });

    Tags.of(lambda).add('Description', `${props?.tags?.Description}`);
    Tags.of(lambda).add('Project', `${props?.tags?.Project}`);
    Tags.of(lambda).add('Environment', `${props?.tags?.Environment}`);

    return lambda;
  }

  static deployLambdaWithCronSchedule({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    cronExpression,
    reservedConcurrentExecutions = 3,
    customRole,
    nodeModules = [],
    enabled = true,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    cronExpression: string;
    reservedConcurrentExecutions?: number;
    customRole: Role;
    nodeModules?: string[];
    enabled?: boolean;
  }): NodejsFunction {
    //
    const functionName = `${props.tags?.Project}${props.tags?.Environment}${lambdaName}`;

    const lambda = this.deployLambda({
      scope,
      props,
      timeOut,
      lambdaName,
      memorySize,
      subDirectory,
      environmentVariables,
      reservedConcurrentExecutions,
      customRole: customRole,
      nodeModules,
    });

    new Rule(scope, `${functionName}Schedule`, {
      ruleName: `${functionName}Schedule`,
      schedule: Schedule.expression(cronExpression),
      targets: [new LambdaFunction(lambda)],
      description: `${props?.tags?.Description}`,
      enabled: enabled,
    });

    return lambda;
  }

  static deployLambdaWithSqsTrigger({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    queue,
    nodeModules = [],
    customRole,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    queue: Queue;
    nodeModules?: string[];
    customRole: Role;
  }) {
    //
    const functionName = `${props.tags?.Project}${props.tags?.Environment}${lambdaName}`;
    const lambda = this.deployLambda({
      scope,
      props,
      lambdaName,
      memorySize,
      timeOut,
      environmentVariables,
      subDirectory,
      nodeModules,
      customRole,
    });

    const eventSource = new cdk.aws_lambda_event_sources.SqsEventSource(queue, {
      batchSize: 5,
      enabled: true,
      reportBatchItemFailures: true,
      maxConcurrency: 100,
    });

    lambda.addEventSource(eventSource);

    return lambda;
  }

  static grantStreamToLambda({
    scope,
    lambda,
    table,
    props,
    lambdaName,
  }: {
    scope: Construct;
    lambda: NodejsFunction;
    lambdaName: string;
    table: Table;
    props: StackProps;
  }): EventSourceMapping {
    // Adiciona Lambda ao Stream
    table.grantStreamRead(lambda);
    // table.grantFullAccess(lambda);

    const id = `${props.tags?.Project}${process.env.ENVIRONMENT}${lambdaName}EventSourceMapping`;

    const eventSourcingMapping = lambda.addEventSourceMapping(id, {
      eventSourceArn: table.tableStreamArn,
      startingPosition: StartingPosition.LATEST,
      batchSize: 5,
      enabled: true,
    });

    return eventSourcingMapping;
    //
  }

  static deployLambdaTriggeredByEvent({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    customRole,
    nodeModules = [],
    ruleName,
    source,
    detailType,
    enabled,
    eventBus,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    customRole: Role;
    nodeModules?: string[];
    ruleName: string;
    source: string[];
    detailType: string[];
    enabled: boolean;
    eventBus: IEventBus;
  }) {
    //   SasAnsDocumentoBeneficiarioSucessor
    const lambda = this.deployLambda({
      scope: scope,
      props: props,
      timeOut: timeOut,
      memorySize: memorySize,
      subDirectory: subDirectory,
      lambdaName: lambdaName,
      environmentVariables: environmentVariables,
      customRole: customRole,
      nodeModules: nodeModules,
    });
    //

    EverestRuleConstructor.createRule({
      scope: scope,
      props: props,
      ruleName: ruleName,
      eventBus: eventBus,
      eventPattern: {
        source: source,
        detailType: detailType,
      },
      targets: [lambda],
      enabled: enabled,
    });

    return lambda;
  }

  static deployLambdaTriggeredBySqs = ({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    reservedConcurrentExecutions = 3,
    customRole,
    nodeModules = [],
    dql,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    reservedConcurrentExecutions?: number;
    customRole: Role;
    nodeModules?: string[];
    dql: boolean;
  }) => {
    if (timeOut < 30) timeOut = 30;
    let queue: Queue;
    if (dql === true) {
      queue = EverestSqsConstructor.createSqsWithDql({
        scope: scope,
        props: props,
        queueNome: lambdaName + 'Sqs',
        maxReceiveCount: 3,
        visibilityTimeout: timeOut + 10,
      });
    } else {
      queue = EverestSqsConstructor.createSqsWithoutDql({
        scope: scope,
        props: props,
        queueNome: lambdaName + 'Sqs',
        maxReceiveCount: 3,
        visibilityTimeout: timeOut + 10,
      });
    }

    const lambda = this.deployLambdaWithSqsTrigger({
      scope: scope,
      props: props,
      timeOut: timeOut,
      lambdaName: lambdaName,
      memorySize: memorySize,
      subDirectory: subDirectory,
      environmentVariables: {
        QUEUE_NAME: queue.queueName,
        ...environmentVariables,
      },
      queue: queue,
      nodeModules: nodeModules,
      customRole,
    });

    return lambda;
  };

  static deployLambdaWithUrl = ({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    customRole,
    nodeModules = [],
    cliente,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    reservedConcurrentExecutions?: number;
    customRole: Role;
    nodeModules?: string[];
    cliente?: string;
  }): NodejsFunction => {
    //
    const lambda = this.deployLambda({
      scope,
      props,
      timeOut,
      lambdaName,
      memorySize,
      subDirectory,
      environmentVariables,
      customRole,
      nodeModules,
      cliente,
    });

    lambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
      },
      invokeMode: InvokeMode.BUFFERED,
    });

    return lambda;
  };

  static deployLambdaWithSqsTriggerWithRds({
    scope,
    props,
    timeOut,
    lambdaName,
    memorySize,
    subDirectory,
    environmentVariables,
    queue,
    nodeModules = [],
    customRole,
  }: {
    scope: Construct;
    props: StackProps;
    timeOut: number;
    lambdaName: string;
    memorySize: number;
    subDirectory: string;
    environmentVariables: object;
    queue: Queue;
    nodeModules?: string[];
    customRole: Role;
  }) {
    //
    const functionName = `Everest${props.tags?.Environment}${lambdaName}`;
    const lambda = this.deployLambdaWithAccessToRds({
      scope,
      props,
      lambdaName,
      memorySize,
      timeOut,
      environmentVariables,
      subDirectory,
      nodeModules,
      customRole,
    });

    const eventSource = new cdk.aws_lambda_event_sources.SqsEventSource(queue, {
      batchSize: 5,
      enabled: true,
      reportBatchItemFailures: true,
      maxConcurrency: 100,
    });

    lambda.addEventSource(eventSource);

    return lambda;
  }
}
