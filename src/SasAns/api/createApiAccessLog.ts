import { Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const createApiAccessLog = async ({
  nome_atividade,
  pk,
  cliente,
  request,
  response,
  erro,
}: {
  nome_atividade: string;
  pk: string;
  cliente;
  request: AxiosRequestConfig;
  response?: AxiosResponse;
  erro?: AxiosError;
}) => {
  try {
    const params: PutItemCommandInput = {
      TableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
      Item: marshall(
        {
          pk,
          cliente,
          sk: `${nome_atividade}::${erro ? 'erro' : 'sucesso'}::${new Date().toISOString()}`,
          request,
          response: response ? response.data : null,
          erro: erro ? erro.message : null,
        },
        { removeUndefinedValues: true }
      ),
    };
    await dynamoDBClient.send(new PutItemCommand(params));
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`createApiAccessLog - ${error.message}`);
  }
};
