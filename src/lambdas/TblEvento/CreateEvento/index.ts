import { Context } from 'aws-lambda';
import { DynamoDBServices } from '../../../libs/dynamodb.services';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (
  event: {
    pk: string;
    cliente: string;
    created_at: string;
    evento: string;
  },
  context: Context
) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));

    if (!event.pk) throw new Error('pk não informado!');
    if (!event.cliente) throw new Error('cliente não informado!');
    if (!event.created_at) throw new Error('created_at não informado!');
    if (!event.evento) throw new Error('evento não informado!');

    return await DynamoDBServices.genericPutItem({
      tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
      item: {
        ...event,
      },
    });
  } catch (error: any) {
    console.error(error.message);
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
    });
    throw new Error(`${error.message}`);
  }
};
