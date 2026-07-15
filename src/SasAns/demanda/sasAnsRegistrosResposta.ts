import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { get } from 'http';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const sasAnsRegistraDemandaDeResposta = async ({
  protocolo,
  payloadSqsRobo,
}: {
  protocolo: any;
  payloadSqsRobo: string;
}) => {
  try {
    const tableName = `Tbl${process.env.ENVIRONMENT}AnsResposta`;
    const item = {
      pk: protocolo.num_protocolo,
      created_at: new Date().toISOString(),
      data_recebimento: new Date().toISOString(),
      protocolo,
      payloadSqsRobo,
      cliente: 'SasAns',
    };
    const putItemParams: PutItemCommandInput = {
      TableName: tableName,
      Item: marshall(item, {
        removeUndefinedValues: true,
      }),
    };
    return await dynamoDBClient.send(new PutItemCommand(putItemParams));
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsRegistraDemandaDeResposta - ${error.message}`);
  }
};

export const sasAnsRegistraRespostaProtocolada = async ({ protocolo }: { protocolo: any }) => {
  try {
    const tableName = `Tbl${process.env.ENVIRONMENT}AnsResposta`;

    const item = await getRegistroAnsResposta({ protocolo });

    if (!item?.pk) {
      throw new Error('Registro não encontrado');
    }

    item.data_resposta = new Date().toISOString();

    const putItemParams: PutItemCommandInput = {
      TableName: tableName,
      Item: marshall(item, {
        removeUndefinedValues: true,
      }),
    };
    return await dynamoDBClient.send(new PutItemCommand(putItemParams));
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsRegistraDemandaDeResposta - ${error.message}`);
  }
};

export const sasAnsRegistraRespostaProtocoladaComErro = async ({
  protocolo,
  errorMessage,
}: {
  protocolo: any;
  errorMessage: string;
}) => {
  try {
    const tableName = `Tbl${process.env.ENVIRONMENT}AnsResposta`;

    const item = await getRegistroAnsResposta({ protocolo });

    if (!item?.pk) {
      throw new Error('Registro não encontrado');
    }

    item.data_resposta = errorMessage;
    item.obs = errorMessage;

    const putItemParams: PutItemCommandInput = {
      TableName: tableName,
      Item: marshall(item, {
        removeUndefinedValues: true,
      }),
    };
    return await dynamoDBClient.send(new PutItemCommand(putItemParams));
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsRegistraDemandaDeResposta - ${error.message}`);
  }
};

export const getRegistroAnsResposta = async ({ protocolo }: { protocolo: any }) => {
  try {
    const tableName = `Tbl${process.env.ENVIRONMENT}AnsResposta`;
    const getItemParams: GetItemCommandInput = {
      TableName: tableName,
      Key: marshall({ pk: protocolo }),
    };
    const { Item } = await dynamoDBClient.send(new GetItemCommand(getItemParams));
    return Item ? unmarshall(Item, {}) : {};
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getRegistroAnsResposta - ${error.message}`);
  }
};

export const getDemandasParaReprocessamento = async () => {
  try {
    const tableName = `TblProdAnsResposta`;
    let today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const hoje = today.toISOString();
    let lastKey: any = null;
    let items: any[] = [];
    do {
      const scanParams: ScanCommandInput = {
        TableName: tableName,
        FilterExpression: 'attribute_not_exists(data_resposta) AND created_at > :created_at',
        ExpressionAttributeValues: {
          ':created_at': { S: hoje },
        },
        ExclusiveStartKey: lastKey,
      };

      const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));
      lastKey = LastEvaluatedKey;
      if (Items && Items.length > 0) {
        Items.map((item) => {
          const itemUnmarshalled = unmarshall(item);
          // add 10 minutes to created_at
          const dataTarget = new Date(new Date(itemUnmarshalled.created_at).getTime() + 600000);
          if (new Date() > dataTarget) {
            items.push(unmarshall(item));
          }
        });
      }
    } while (lastKey);
    return items;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getDemandasParaReprocessamento - ${error.message}`);
  }
};
