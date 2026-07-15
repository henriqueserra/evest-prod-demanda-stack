import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { EverestDynamoDBConstructor } from './cdkLibs/everest.dynamodb.constructor';

interface CustomStackProps extends StackProps {}

export class Props extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CustomStackProps) {
    super(scope, id, props);

    EverestDynamoDBConstructor.createTablePk({
      scope: this,
      props: props,
      tableName: 'EverestProps',
    });
  }
}
