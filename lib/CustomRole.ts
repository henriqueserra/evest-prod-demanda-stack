import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { EverestRoleConstructor } from './cdkLibs/everest.role.constructor';

export class CustomRole extends cdk.Stack {
  readonly customRole: Role;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const roleName = `Custom`;

    // const assumedBy: IPrincipal = new ServicePrincipal('lambda.amazonaws.com');

    // const inlinePolicies: {
    //   [name: string]: PolicyDocument;
    // } = {
    //   CustomRolePolicy: new PolicyDocument({
    //     statements: [
    //       new PolicyStatement({
    //         actions: ['logs:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['dynamodb:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['sqs:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['ses:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['scheduler:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['events:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['cloudformation:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['cloudwatch:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['lambda:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['states:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['tag:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['xray:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['cognito-idp:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['cognito-identity:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['cognito-sync:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['s3:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //       new PolicyStatement({
    //         actions: ['ec2:*'],
    //         resources: ['*'],
    //         effect: Effect.ALLOW,
    //       }),
    //     ],
    //   }),
    // };

    // this.customRole = new Role(this, roleName, {
    //   assumedBy: assumedBy,
    //   inlinePolicies: inlinePolicies,
    //   roleName: roleName,
    // });

    this.customRole = EverestRoleConstructor.createCustomRole({
      scope: this,
      props: props,
      clienteName: roleName,
    });

    Tags.of(this.customRole).add('Description', `${props?.tags?.Description}`);
    Tags.of(this.customRole).add('Project', `${props?.tags?.Project}`);
    Tags.of(this.customRole).add('Environment', `${props?.tags?.Environment}`);
  }
}
