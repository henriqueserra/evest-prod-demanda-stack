import { Context } from 'aws-lambda';
import { EverestSendGridService } from '../../../libs/everest.sendgrid.service';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    const body = JSON.parse(event.detail.message);
    const pk = body.idOficio;
    const observacao = body?.observacao ?? 'Observação não informada';
    const url = `https://everest.oito.srv.br/everest/portal/consulta/oficio/${pk}`;
    // const result = await EverestSendGridService.sendGridNotificaNewExecao({
    //   to: ['bmiguel@oito.srv.br'],
    //   cc: ['thiago.oliveira@oito.srv.br', 'roberta.papale@oito.srv.br', 'larissa.freitas@oito.srv.br'],
    //   bcc: ['henrique.serra@oito.srv.br'],
    //   pk: pk,
    //   url: url,
    //   observacao: observacao,
    // });
    return true;
  } catch (error: any) {
    console.error(error.message);
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
