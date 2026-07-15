import { EverestLogService } from './everest.log.services';

import { SESClient, SendEmailCommand, SendEmailCommandInput, SendEmailCommandOutput } from '@aws-sdk/client-ses';
// import dotenv from 'dotenv';
// dotenv.config();

// const region = process.env.AWSREGION;
// const accessKeyId = process.env.AWSACESSKEYID;
// const secretAccessKey = process.env.AWSSECRETACCESSKEY;

// if (!region || !accessKeyId || !secretAccessKey) {
//   throw new Error('AWS configuration environment variables are not set properly.');
// }

const sesClient = new SESClient({
  // region,
  // credentials: {
  //   accessKeyId,
  //   secretAccessKey,
  // },
});

const routeName = 'EverestSesServices';
const logService = new EverestLogService();
export class EverestSesServices {
  constructor() {}

  static async notificaErro({
    metodo,
    payload,
    errorMessage,
    emailsAdicionais = [],
    attachments = [],
  }: {
    metodo: string;
    payload: any;
    errorMessage?: string;
    emailsAdicionais?: string[];
    attachments?: {
      filename: string;
      content: string; // base64
      mimeType: string;
    }[];
  }) {
    const methodName = `${routeName}.notificaErro`;

    try {
      // debugger;

      const subject = `${metodo} - Erro`;
      const corpo = `
        <h1>Erro</h1>
        <p>${errorMessage}</p>
        <p>Payload: ${JSON.stringify(payload)}</p>
      `;

      const command: SendEmailCommandInput = {
        Destination: {
          ToAddresses: [...emailsAdicionais, 'henrique.serra@oito.srv.br'],
        },
        Message: {
          Body: {
            Html: {
              Data: corpo,
            },
          },
          Subject: {
            Data: subject,
          },
        },
        Source: 'everest@oito.srv.br',
      };

      const sendEmailCommand = new SendEmailCommand(command);
      const response = (await sesClient.send(sendEmailCommand)) as SendEmailCommandOutput;

      logService.info({ message: `${response.MessageId} => ${subject}`, method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  public static async enviaEmail({ corpoEmail, toAdresses, ccAdresses, bccAdresses, subject }: SesEnviaEmailInterface) {
    try {
      const params: SendEmailCommandInput = {
        Source: 'everest@oito.srv.br',
        Destination: {
          ToAddresses: toAdresses,
          CcAddresses: ccAdresses ?? [],
          BccAddresses: bccAdresses ?? [],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Text: {
              Data: corpoEmail,
              Charset: 'UTF-8',
            },
          },
        },
      };
      return await sesClient.send(new SendEmailCommand(params));
    } catch (error: any) {
      console.error('Error Message: ', error.message);
      throw new Error(`${error.message}`);
    }
  }
}

export interface SesEnviaEmailInterface {
  corpoEmail: string;
  toAdresses: string[];
  bccAdresses?: string[];
  ccAdresses?: string[];
  subject: string;
}
