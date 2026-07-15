import { Context } from 'aws-lambda';

import { sasAnsGetPickList } from '../../../../SasAns/api/sasAnsGetPickList';
import { GmailService } from '../../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    if (!event.dominio) throw new Error('O campo dominio é obrigatório');
    if (!event.dependente) event.dependente = '';
    const resultados = await sasAnsGetPickList({
      dominio: event.dominio,
      dependente: event.dependente,
    });
    return resultados;
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
