import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (event: {}, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));
    console.info('context:');
    console.info(JSON.stringify(context));

    return true;
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
