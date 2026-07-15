import { DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const sasAnsGetPickList = async ({
  dominio,
  dependente,
}: {
  dominio: string;
  dependente?: string;
}): Promise<any> => {
  try {
    let resultado = await sasAnsPicklistGetDominio(dominio);

    let resultadoFinal: any = [];
    if (dependente) {
      resultadoFinal = resultado?.filter((item) => {
        if (item.valores_validos_para.includes(dependente)) {
          return true;
        } else {
          return false;
        }
      });
      resultado = resultadoFinal;
    }

    return resultado?.map((item) => item.valor);
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getPickList - ${error.message}`);
  }
};

export const sasAnsPicklistGetDominio = async (dominio: string) => {
  try {
    const tableName: string = `Tbl${process.env.ENVIRONMENT}AnsPickLists`;
    const queryParams: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: 'dominio = :dominio',
      ExpressionAttributeValues: {
        ':dominio': { S: dominio },
      },
      ScanIndexForward: true,
      ConsistentRead: true,
    };
    const queryCommand = new QueryCommand(queryParams);
    const { Items } = await dynamoDBClient.send(queryCommand);
    return Items?.map((item) => {
      return unmarshall(item);
    });
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsPicklistGetDominio - ${error.message}`);
  }
};
