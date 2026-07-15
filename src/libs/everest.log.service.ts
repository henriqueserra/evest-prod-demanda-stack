import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export class EverestLogService {
  private readonly dynamoDBClient: DynamoDBClient;
  private readonly tableName: string;

  constructor() {
    this.dynamoDBClient = new DynamoDBClient({
      region: 'us-east-1',
    });
    this.tableName = `Tbl${process.env.ENVIRONMENT}DemandaLogs`;
  }

  async newLog({ item }: { item: any }) {
    try {
      const params: PutItemCommandInput = {
        TableName: this.tableName,
        Item: marshall(
          {
            ...item,
          },
          { removeUndefinedValues: true }
        ),
      };

      return await this.dynamoDBClient.send(new PutItemCommand(params));
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`newLog - message: ${error.message} - stack: ${error.stack}`);
    }
  }
}
