import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    const body = JSON.parse(JSON.parse(event.detail.message));

    return true;
  } catch (error: any) {
    console.error(error.message);

    if (error.message.includes('ultrapassa 5 MBytes!')) {
      return true;
    }
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
      emailsAdicionais: ['kleber.canedo@oito.srv.br'],
    });
    return true;
  }
};
