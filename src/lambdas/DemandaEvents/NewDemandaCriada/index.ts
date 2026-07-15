import { Context } from 'aws-lambda';
import { Everest2DemandaService, StatusInterface } from '../../../libs/everest.demanda.service';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  let pk: string = '';
  try {
    return true;
  } catch (error: any) {
    console.error(error.message);
    const pkService = new Everest2DemandaService({ pk: event.pk });

    let status: StatusInterface = await pkService.getStatus();

    await pkService.updateStatus({
      updated_by: process.env.LAMBDA_NAME as string,
      status_demanda: 'ExcecaoOito',
      nova_observacao: `${process.env.LAMBDA_NAME} - ${error.message}`,
    });
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
      // emailsAdicionais: ['kleber.canedo@oito.srv.br'],
    });
    return true;
  }
};
