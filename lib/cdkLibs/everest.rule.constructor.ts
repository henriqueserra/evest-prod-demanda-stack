import { StackProps, Duration, Tags } from 'aws-cdk-lib';
import { IEventBus, EventPattern, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class EverestRuleConstructor {
  static createRule({
    scope,
    props,
    ruleName,
    eventBus,
    eventPattern,
    enabled = true,
    targets,
  }: {
    scope: Construct;
    props: StackProps;
    ruleName: string;
    eventBus: IEventBus;
    enabled?: boolean;
    eventPattern: EventPattern;
    targets: NodejsFunction[];
  }): Rule {
    const name = `${props?.tags?.Project}${props?.tags?.Environment}${ruleName}Rule`;

    const rule: Rule = new Rule(scope, name, {
      ruleName: name,
      enabled,
      description: props?.tags?.Description,
      eventBus,
      eventPattern,
    });

    for (const target of targets) {
      rule.addTarget(
        new LambdaFunction(target, {
          // deadLetterQueue: queueDql, // Optional: add a dead letter queue
          retryAttempts: 1, // Optional: add retry attempts
          maxEventAge: Duration.hours(10), // Optional: add max event age
        }),
      );
    }

    Tags.of(rule).add('Description', `${props?.tags?.Description}`);
    Tags.of(rule).add('Project', `${props?.tags?.Project}`);
    Tags.of(rule).add('Environment', `${props?.tags?.Environment}`);

    return rule;
  }
}
