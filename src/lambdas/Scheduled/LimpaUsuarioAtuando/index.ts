import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GmailService } from '../../../libs/gmail.service';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const handler = async (event: any, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));

    // const clientes = await EverestClienteServices.getClientes();

    // for (const cliente of clientes) {
    //   console.info(`Iterando sobre o cliente ${cliente.cliente}`);
    //   const params: QueryCommandInput = {
    //     TableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
    //     IndexName: 'cliente-status_demanda-index',
    //     KeyConditionExpression: 'cliente = :cliente and status_demanda = :status_demanda',
    //     FilterExpression: 'usuario_atuando > :usuario_atuando',
    //     ExpressionAttributeValues: {
    //       ':cliente': { S: cliente.cliente },
    //       ':status_demanda': { S: 'EsteiraOito' },
    //       ':usuario_atuando': { S: '' },
    //     },
    //     // ConsistentRead: true,
    //   };

    //   const { Items } = await dynamoDBClient.send(new QueryCommand(params));

    //   if (Items?.length === 0) continue;

    //   const items = Items?.map((item) => unmarshall(item));

    //   if (!items || items.length === 0) return;

    //   // Calculate 5 minutes from now
    //   const fiveMinutesFromNow = new Date();
    //   fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() - 31);

    //   for (const item of items) {
    //     const pkService = new Everest2DemandaService({ pk: item.pk });

    //     let status: StatusInterface = await pkService.getStatus();
    //     if (item.updated_at < fiveMinutesFromNow.toISOString()) {
    //       await EverestSesService.enviaEmail({
    //         toAdresses: [item.usuario_atuando],
    //         ccAdresses: [],
    //         bccAdresses: [],
    //         subject: `[Evertest] Demanda desbloqueada por inatividade`,
    //         corpoEmail: `Você foi desbloqueado da demanda ${item.pk} por inatividade.`,
    //       });
    //       await pkService.updateStatus({
    //         pk: item.pk,
    //         usuario_atuando: '',
    //         updated_by: process.env.LAMBDA_NAME as string,
    //       });
    //     }
    //   }
    // }

    // const axiosRequest: AxiosRequestConfig = {
    //   method: 'GET',
    //   url: 'https://everest.oito.srv.br/prod/backend/v1/batch/return/auditoria_automatica',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `123deoliveira4`,
    //   },
    // };

    // const response = await axios(axiosRequest);

    // return true;
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
