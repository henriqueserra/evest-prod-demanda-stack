import {
  AttributeValue,
  DeleteItemCommand,
  DeleteItemCommandInput,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export class DynamoDBServices {
  constructor() {}

  static async queryItems({
    tableName,
    indexName,
    keyConditionExpression,
    expressionAttributeValues,
    projectionExpression,
    filterExpression,
  }: {
    tableName: string;
    indexName?: string;
    keyConditionExpression: string;
    expressionAttributeValues: Record<string, AttributeValue>;
    projectionExpression?: string;
    filterExpression?: string;
  }) {
    try {
      let items: any[] = [];
      let lastKey: any = null;
      do {
        const queryParams: QueryCommandInput = {
          TableName: tableName,
          ExclusiveStartKey: lastKey,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ScanIndexForward: true,
        };
        if (projectionExpression) queryParams.ProjectionExpression = projectionExpression;
        if (indexName) queryParams.IndexName = indexName;
        if (filterExpression) queryParams.FilterExpression = filterExpression;

        const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new QueryCommand(queryParams));

        if (Items && Items?.length > 0) {
          Items.map((item) => {
            items.push(item);
          });
        }
        lastKey = LastEvaluatedKey;
      } while (lastKey);
      return items.map((item) => {
        return unmarshall(item);
      });
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`queryItems - ${error.message}`);
    }
  }

  static async scanItems({
    tableName,
    filterExpression,
    expressionAttributeValues,
    projectionExpression,
    limit,
  }: {
    tableName: string;
    filterExpression?: string;
    expressionAttributeValues?: Record<string, AttributeValue>;
    projectionExpression?: string;
    limit?: number;
  }) {
    try {
      let items: any[] = [];
      let lastKey: any = null;
      do {
        console.info(`Itens: ${items.length}`);
        const queryParams: ScanCommandInput = {
          TableName: tableName,
          ExclusiveStartKey: lastKey,
        };
        if (filterExpression) queryParams.FilterExpression = filterExpression;
        if (expressionAttributeValues) queryParams.ExpressionAttributeValues = expressionAttributeValues;
        if (projectionExpression) queryParams.ProjectionExpression = projectionExpression;

        const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(queryParams));

        if (Items && Items?.length > 0) {
          Items.map((item) => {
            items.push(item);
          });
        }
        lastKey = LastEvaluatedKey;
        if (limit && items.length >= limit) {
          break;
        }
      } while (lastKey);
      return items.map((item) => {
        return unmarshall(item);
      });
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`scanItems - ${error.message}`);
    }
  }

  static async getItem({ pk, sk, tableName }: { pk: string; sk?: string; tableName: string }) {
    try {
      if (!pk) throw new Error('pk não informado!');
      // if (!sk) throw new Error('sk não informado!');

      let params: GetItemCommandInput = {
        TableName: tableName,
        Key: {
          pk: { S: pk },
        },
        ConsistentRead: true,
      };

      if (sk) {
        params = {
          TableName: tableName,
          Key: {
            pk: { S: pk },
            sk: { S: sk },
          },
          ConsistentRead: true,
        };
      }

      const data = await dynamoDBClient.send(new GetItemCommand(params));
      if (!data.Item) return {};
      return unmarshall(data.Item);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getItem - ${error.message}`);
    }
  }

  static async getItemWithouSk({ pk, tableName }: { pk: string; tableName: string }) {
    try {
      if (!pk) throw new Error('pk não informado!');

      const params: GetItemCommandInput = {
        TableName: tableName,
        Key: {
          pk: { S: pk },
        },
        ConsistentRead: true,
      };

      const data = await dynamoDBClient.send(new GetItemCommand(params));
      if (!data.Item) return {};
      return unmarshall(data.Item);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getItem - ${error.message}`);
    }
  }

  static async getItemKey({ key, tableName }: { key: object; tableName: string }) {
    try {
      if (!key) throw new Error('key não informado!');

      const params: GetItemCommandInput = {
        TableName: tableName,
        Key: marshall(key, { removeUndefinedValues: true, convertClassInstanceToMap: true, convertEmptyValues: true }),
        ConsistentRead: true,
      };

      const data = await dynamoDBClient.send(new GetItemCommand(params));
      if (!data.Item) return {};
      return unmarshall(data.Item);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getItem - ${error.message}`);
    }
  }

  static async putItem({ tableName, item }: { tableName: string; item: any }) {
    try {
      item.updated_at = new Date().toISOString();

      const params: PutItemCommandInput = {
        TableName: tableName,
        Item: marshall(item, {
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        }),
      };

      const result = await dynamoDBClient.send(new PutItemCommand(params));

      return result.$metadata;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`putItem - ${error.message}`);
    }
  }

  static async genericPutItem({ tableName, item }: { tableName: string; item: any }) {
    try {
      item.updated_at = new Date().toISOString();

      const params: PutItemCommandInput = {
        TableName: tableName,
        Item: marshall(item, {
          removeUndefinedValues: true,
          convertEmptyValues: true,
          convertClassInstanceToMap: true,
        }),
      };

      const result = await dynamoDBClient.send(new PutItemCommand(params));

      return result.$metadata;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`putItem - ${error.message}`);
    }
  }

  static async deleteItem({ tableName, item }: { tableName: string; item: any }) {
    try {
      const params: DeleteItemCommandInput = {
        TableName: tableName,
        Key: {
          pk: { S: item.pk },
          sk: { S: item.sk },
        },
      };

      const result = await dynamoDBClient.send(new DeleteItemCommand(params));

      return result.$metadata;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`deleteItem - ${error.message}`);
    }
  }
}
