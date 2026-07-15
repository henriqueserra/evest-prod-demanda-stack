import { Context } from 'aws-lambda';

import { sasAnsGetToken } from '../../../../SasAns/api/sasAnsGetToken';
import { GmailService } from '../../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    let dados = await sasAnsGetToken({ force_refresh: false });
    return dados;
  } catch (error: any) {
    console.error('ERRO:');
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
