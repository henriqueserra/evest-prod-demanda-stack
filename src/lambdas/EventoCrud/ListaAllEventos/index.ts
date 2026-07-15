import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';
import { DynamoDBServices } from '../../../libs/dynamodb.services';
import { EverestApoioService } from '../../../libs/everest.apoio.service';

export const handler = async (event: {}, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));
    console.info('context:');
    console.info(JSON.stringify(context));

    const dadosBrutos = await DynamoDBServices.scanItems({
      tableName: `Tbl${process.env.ENVIRONMENT}Evento` as string,
      projectionExpression: 'evento',
    });

    let listaAllEventos = dadosBrutos.map((item) => item.evento);
    listaAllEventos = EverestApoioService.removeDuplicatesFromStringArray(listaAllEventos);
    listaAllEventos = EverestApoioService.sortAlphabetically(listaAllEventos);

    return listaAllEventos;
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
