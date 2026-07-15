import { StackProps, Tags } from 'aws-cdk-lib';
import { Role, IPrincipal, ServicePrincipal, PolicyDocument, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class EverestRoleConstructor {
  static createCustomRole({
    scope,
    props,
    clienteName,
  }: {
    scope: Construct;
    props: StackProps;
    clienteName: string;
  }): Role {
    const roleName = `${props.tags?.Project}${props.tags?.Environment}${clienteName}Role`;

    const assumedBy: IPrincipal = new ServicePrincipal('lambda.amazonaws.com');

    const inlinePolicies: {
      [name: string]: PolicyDocument;
    } = {
      CustomRolePolicy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ['logs:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['dynamodb:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['sqs:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['ses:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['scheduler:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['events:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['cloudformation:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['cloudwatch:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['lambda:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['states:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['tag:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['xray:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['cognito-idp:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['cognito-identity:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['cognito-sync:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['s3:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            actions: ['ec2:*'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
        ],
      }),
    };

    const customRole = new Role(scope, roleName, {
      assumedBy: assumedBy,
      inlinePolicies: inlinePolicies,
      roleName: roleName,
    });

    Tags.of(customRole).add('Description', `${props?.tags?.Description}`);
    Tags.of(customRole).add('Project', `${props?.tags?.Project}`);
    Tags.of(customRole).add('Environment', `${props?.tags?.Environment}`);

    return customRole;
  }
}
