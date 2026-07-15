import { Context } from 'aws-lambda';

import { sasAnsConsultaDocumentoBeneficiario } from '../../../../SasAns/api/sasAnsConsultaDocumentoBeneficiario';
import { GmailService } from '../../../../libs/gmail.service';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    if (!event.documento) throw new Error('documento is required');

    const contas = await sasAnsConsultaDocumentoBeneficiario({
      documento: event.documento,
      pk: event.pk,
    });

    return contas;
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
