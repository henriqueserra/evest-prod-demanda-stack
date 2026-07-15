import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';

interface CustomStackProps extends StackProps {}

export class Users extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    // const customRole: Role = EverestRoleConstructor.createCustomRole({
    //   scope: this,
    //   props: props,
    //   clienteName: 'Users',
    // });

    /* ------------------------- CREATE TABLE USERS ------------------------- */
    EverestDynamoDBConstructor.createTablePk({
      scope: this,
      props: props,
      tableName: 'Users',
      pk: 'pk',
    });

    // // GetPermitions
    // EverestLambdaConstructor.deployLambda({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'GetPermitions',
    //   memorySize: 512,
    //   subDirectory: 'Users',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });
    // //

    // // GetPermitions
    // EverestLambdaConstructor.deployLambda({
    //   scope: this,
    //   props: props,
    //   timeOut: 30,
    //   lambdaName: 'ListAllUsers',
    //   memorySize: 512,
    //   subDirectory: 'Users',
    //   environmentVariables: {},
    //   customRole: customRole,
    // });
    // //
  }
}
