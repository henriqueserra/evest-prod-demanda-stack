import * as cdk from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

export class EventBridge extends cdk.Stack {
  public readonly bus: EventBus;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const eventBusName = `${props?.tags?.Project || 'Everest'}${props?.tags?.Environment || 'Dev'}EventBus`;

    /* -------------------------------------------------------------------------- */
    /*                                Cria EventBus                               */
    /* -------------------------------------------------------------------------- */
    this.bus = new EventBus(this, eventBusName, {
      eventBusName: eventBusName,
    });

    Tags.of(this.bus).add('Description', `${props?.tags?.Description}`);
    Tags.of(this.bus).add('Project', `${props?.tags?.Project}`);
    Tags.of(this.bus).add('Environment', `${props?.tags?.Environment}`);
    /* -------------------------------------------------------------------------- */
    //
  }
}
