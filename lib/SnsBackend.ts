import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';

interface CustomStackProps extends cdk.StackProps {}

export class SnsBackend extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    const customRole = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: 'SnsTextractor',
    });

    new Topic(this, `Everest${props.tags?.Environment}SnsTextractor`);
  }
}
