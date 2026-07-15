import { Context, DynamoDBStreamEvent } from 'aws-lambda';
import { EverestLogService } from '../../../libs/everest.log.service';

const logsService = new EverestLogService();

export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<any> => {
  // console.info('event');
  // console.info(JSON.stringify(event));
  // console.info('context');
  // console.info(JSON.stringify(context));
  // let pk: string = event.Records[0].dynamodb?.Keys?.pk?.S || '';

  try {
    // for (const Record of event.Records as DynamoDBRecord[]) {
    //   await SqsServices.sqsSendMessageFifo({
    //     queueName: `Everest${process.env.ENVIRONMENT}TblDemandaDadoTriggerSqs.fifo`,
    //     messageBody: JSON.stringify(Record),
    //   });
    // }
    return {};
  } catch (error: any) {
    console.error('Error Message: ', error.message);
    // await GmailService.notificaErro({
    //   lambda: process.env.LAMBDA_NAME as string,
    //   event,
    //   context,
    //   erro: `${process.env.LAMBDA_NAME} - ${error.message}`,
    // });
  }
};
