import { StackProps, Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Queue, FifoThroughputLimit, DeduplicationScope } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class EverestSqsConstructor {
  static createSqsWithDql(payload: {
    scope: Construct;
    props: StackProps;
    queueNome: string;
    maxReceiveCount: number;
    visibilityTimeout: number;
  }): Queue {
    //
    const queueName = `${payload?.props?.tags?.Project}${payload?.props?.tags?.Environment}${payload.queueNome}`;
    //

    const queueDql = new Queue(payload.scope, `${queueName}Dql`, {
      queueName: `${queueName}Dql`,
      visibilityTimeout: Duration.seconds(payload.visibilityTimeout),
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const queue = new Queue(payload.scope, `${queueName}`, {
      queueName: `${queueName}`,
      visibilityTimeout: Duration.seconds(payload.visibilityTimeout),
      deadLetterQueue: {
        maxReceiveCount: payload.maxReceiveCount < 1 ? 1 : payload.maxReceiveCount,
        queue: queueDql,
      },
      deliveryDelay: Duration.seconds(1),
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    Tags.of(queue).add('Description', `${payload?.props?.tags?.Description}`);
    Tags.of(queue).add('Project', `${payload?.props?.tags?.Project}`);
    Tags.of(queue).add('Environment', `${payload?.props?.tags?.Environment}`);

    return queue;
  }

  static createSqsWithoutDql(payload: {
    scope: Construct;
    props: StackProps;
    queueNome: string;
    maxReceiveCount: number;
    visibilityTimeout: number;
  }): Queue {
    //
    const queueName = `${payload?.props?.tags?.Project}${payload?.props?.tags?.Environment}${payload.queueNome}`;
    //

    const queue = new Queue(payload.scope, `${queueName}`, {
      queueName: `${queueName}`,
      visibilityTimeout: Duration.seconds(payload.visibilityTimeout),
      deliveryDelay: Duration.seconds(1),
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    Tags.of(queue).add('Description', `${payload?.props?.tags?.Description}`);
    Tags.of(queue).add('Project', `${payload?.props?.tags?.Project}`);
    Tags.of(queue).add('Environment', `${payload?.props?.tags?.Environment}`);

    return queue;
  }

  static createSqsFifoWithDql(payload: {
    scope: Construct;
    props: StackProps;
    queueNome: string;
    maxReceiveCount: number;
    visibilityTimeout: number;
    prefix?: string;
  }): Queue {
    //
    if (!payload.prefix) payload.prefix = payload?.props?.tags?.Project;
    const queueName = `${payload?.prefix}${payload?.props?.tags?.Environment}${payload.queueNome}`;
    //
    // console.log(`Creating SQS FIFO with DQL: ${queueName}`);
    const queueDql = new Queue(payload.scope, `${queueName}Dql.fifo`, {
      fifo: true,
      contentBasedDeduplication: true,
      queueName: `${queueName}Dql.fifo`,
      visibilityTimeout: Duration.seconds(payload.visibilityTimeout),
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const queue = new Queue(payload.scope, `${queueName}.fifo`, {
      queueName: `${queueName}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: Duration.seconds(payload.visibilityTimeout),
      deadLetterQueue: {
        maxReceiveCount: payload.maxReceiveCount < 1 ? 1 : payload.maxReceiveCount,
        queue: queueDql,
      },
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
      fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
    });

    Tags.of(queue).add('Description', `${payload?.props?.tags?.Description}`);
    Tags.of(queue).add('Project', `${payload?.props?.tags?.Project}`);
    Tags.of(queue).add('Environment', `${payload?.props?.tags?.Environment}`);

    return queue;
  }
}
