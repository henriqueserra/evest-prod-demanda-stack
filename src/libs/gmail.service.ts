import { Context } from 'aws-lambda';
// import { EverestApoioDateTimeService } from './everest.apoio.dateTime.service';
import { LambdaServices } from './lambda.services';

import {
  DeleteEmailByIdInterface,
  EmailResponseInterface,
  EnviaConfirmacaoPortalUploadsInterface,
  EnviaEmailAnexoS3Interface,
  EnviaEmailTemplateSasAnsConfirmacaoDemandaRespondidaInterface,
  GetThreadIdByAssuntoParcialInterface,
  GetThreadIdByEnderecoEmailInterface,
} from './everest.interfaces';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

function isArrayOfStrings(arr: any) {
  return Array.isArray(arr) && arr.every((item) => typeof item === 'string');
}

function isArrayOfBucket(arr: any) {
  return (
    Array.isArray(arr) &&
    arr.every((item) => {
      const s3Key = item?.s3Key;
      const s3Bucket = item?.s3Bucket;
      return typeof s3Key === 'string' && typeof s3Bucket === 'string';
    })
  );
}

// function isBase64(string: string) {
//   const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
//   return base64Regex.test(string);
// }

export interface GmailEmailResponse {
  id: string;
  labelIds: string[];
  threadId: string;
}

export class GmailService {
  public static async enviaEmailAnexoS3(payload: EnviaEmailAnexoS3Interface): Promise<GmailEmailResponse> {
    try {
      console.info('Iniciando envio de e-mail');

      if (payload?.from?.email === undefined || payload?.from?.email?.trim() === '') {
        throw new Error('from.email não informado');
      }

      if (payload?.from?.name === undefined || payload?.from?.name?.trim() === '') {
        throw new Error('from.name não informado');
      }

      if (payload?.to && isArrayOfStrings(payload?.to) && payload?.to.length === 0) {
        throw new Error('to não informado ou formato inválido');
      }

      if (payload?.cc && !isArrayOfStrings(payload?.cc)) {
        throw new Error('cc com formato inválido');
      }

      if (payload?.bcc && !isArrayOfStrings(payload?.bcc)) {
        throw new Error('bcc com formato inválido');
      }

      if (payload?.replyTo && !isArrayOfStrings(payload?.replyTo)) {
        throw new Error('replyTo com formato inválido');
      }

      if (payload?.attachments && !isArrayOfBucket(payload?.attachments)) {
        throw new Error('attachments com formato inválido');
      }

      payload?.mime_type ? payload.mime_type : 'text/plain';

      const response = await LambdaServices.invokeLambda({
        lambdaName: `Email${process.env.ENVIRONMENT}EnviaEmailAnexoS3`,
        payload,
      });

      console.info('Email enviado com sucesso', response);

      return response;
    } catch (error: any) {
      console.error(`enviaEmailAnexoS3 - ${JSON.stringify(error?.message)}`);
      throw new Error(`enviaEmailAnexoS3 - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async enviaConfirmacaoPortalUploads(
    payload: EnviaConfirmacaoPortalUploadsInterface
  ): Promise<EmailResponseInterface> {
    try {
      const axiosRequest: AxiosRequestConfig = {
        method: 'POST',
        url: 'http://44.213.41.119:8037/email/confirmacao_portal_uploads',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          ...payload,
        },
      };

      const response: AxiosResponse = await axios(axiosRequest);

      console.info('Email enviado com sucesso', JSON.stringify(response.data));

      return response.data as EmailResponseInterface;
    } catch (error: any) {
      console.error(`enviaConfirmacaoPortalUploads - ${JSON.stringify(error?.message)}`);
      throw new Error(`enviaConfirmacaoPortalUploads - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async enviaEmailTemplateSasAnsConfirmacaoDemandaRespondida(
    payload: EnviaEmailTemplateSasAnsConfirmacaoDemandaRespondidaInterface
  ): Promise<GmailEmailResponse> {
    try {
      console.info('Iniciando envio de e-mail');

      if (payload?.from?.email === undefined || payload?.from?.email?.trim() === '') {
        throw new Error('from.email não informado');
      }

      if (payload?.from?.name === undefined || payload?.from?.name?.trim() === '') {
        throw new Error('from.name não informado');
      }

      if (payload?.to && isArrayOfStrings(payload?.to) && payload?.to.length === 0) {
        throw new Error('to não informado ou formato inválido');
      }

      if (payload?.cc && !isArrayOfStrings(payload?.cc)) {
        throw new Error('cc com formato inválido');
      }

      if (payload?.bcc && !isArrayOfStrings(payload?.bcc)) {
        throw new Error('bcc com formato inválido');
      }

      if (payload?.replyTo && !isArrayOfStrings(payload?.replyTo)) {
        throw new Error('replyTo com formato inválido');
      }

      if (payload?.template === undefined || payload?.template?.data === undefined) {
        throw new Error('template.data não informado');
      }

      if (
        payload?.template?.data?.data_recebimento === undefined ||
        payload?.template?.data?.data_recebimento?.trim() === ''
      ) {
        throw new Error('template.data.data_recebimento não informado');
      }

      if (payload?.template?.data?.protocolo === undefined || payload?.template?.data?.protocolo?.trim() === '') {
        throw new Error('template.data.protocolo não informado');
      }

      const response = await LambdaServices.invokeLambda({
        lambdaName: `Email${process.env.ENVIRONMENT}EnviaEmailTemplateSasAnsConfirmacaoDemandaRespondida`,
        payload,
      });

      console.info('Email enviado com sucesso', response);

      return response;
    } catch (error: any) {
      console.error(`enviaEmailTemplateSasAnsConfirmacaoDemandaRespondida - ${JSON.stringify(error?.message)}`);
      throw new Error(`enviaEmailTemplateSasAnsConfirmacaoDemandaRespondida - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async notificaErro({
    lambda = '',
    event = '',
    context,
    erro = '',
    emailsAdicionais = [],
    attachments,
  }: {
    lambda?: string;
    event: any;
    context: Context;
    erro?: string;
    emailsAdicionais?: string[];
    attachments?: {
      filename: string;
      content: string; // base64
      mimeType: string;
    }[];
  }): Promise<AxiosRequestConfig> {
    // const cloudWatchUrl = EverestApoioDateTimeService.getCloudWatchLogUrl(context);

    const payloadNotificaErro = {
      lambda: lambda,
      event: JSON.stringify(event),
      context: JSON.stringify(context),
      errorMessage: erro,
      emailsAdicionais: emailsAdicionais,
      attachments,
    };

    const axiosRequest: AxiosRequestConfig = {
      method: 'POST',
      url: 'http://44.213.41.119:8037/email/notifica_erro_lambda',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        ...payloadNotificaErro,
      },
    };

    const response: AxiosResponse = await axios(axiosRequest);

    console.info('Email enviado com sucesso', response);

    return response;
  }

  public static async getThreadIdByEnderecoEmail(payload: GetThreadIdByEnderecoEmailInterface) {
    try {
      console.info('Obtendo threadId e emails por endereço de e-mail');

      if (payload?.from?.email === undefined || payload?.from?.email?.trim() === '') {
        throw new Error('from.email não informado');
      }

      if (payload?.from?.name === undefined || payload?.from?.name?.trim() === '') {
        throw new Error('from.name não informado');
      }

      if (payload?.enderecoEmail === undefined || payload?.enderecoEmail?.trim() === '') {
        throw new Error('enderecoEmail não informado');
      }

      const emails = await LambdaServices.invokeLambda({
        lambdaName: `Email${process.env.ENVIRONMENT}GetThreadIdByEnderecoEmail`,
        payload,
      });

      return emails;
    } catch (error: any) {
      console.error(`getThreadIdByEnderecoEmail - ${JSON.stringify(error?.message)}`);
      throw new Error(`getThreadIdByEnderecoEmail - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async getThreadIdByAssuntoParcial(payload: GetThreadIdByAssuntoParcialInterface) {
    try {
      console.info('Obtendo threadId e emails por assunto parcial');

      if (payload?.from?.email === undefined || payload?.from?.email?.trim() === '') {
        throw new Error('from.email não informado');
      }

      if (payload?.from?.name === undefined || payload?.from?.name?.trim() === '') {
        throw new Error('from.name não informado');
      }

      if (payload?.assuntoParcial === undefined || payload?.assuntoParcial?.trim() === '') {
        throw new Error('assuntoParcial não informado');
      }

      const emails = await LambdaServices.invokeLambda({
        lambdaName: `Email${process.env.ENVIRONMENT}GetThreadIdByAssuntoParcial`,
        payload,
      });

      return emails;
    } catch (error: any) {
      console.error(`getThreadIdByAssuntoParcial - ${JSON.stringify(error?.message)}`);
      throw new Error(`getThreadIdByAssuntoParcial - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async deleteEmailById(payload: DeleteEmailByIdInterface) {
    try {
      console.info('Removendo e-mail por id');

      if (payload?.from?.email === undefined || payload?.from?.email?.trim() === '') {
        throw new Error('from.email não informado');
      }

      if (payload?.from?.name === undefined || payload?.from?.name?.trim() === '') {
        throw new Error('from.name não informado');
      }

      if (payload?.emailId === undefined || payload?.emailId?.trim() === '') {
        throw new Error('id não informado');
      }

      await LambdaServices.invokeLambda({
        lambdaName: `Email${process.env.ENVIRONMENT}DeleteEmailById`,
        payload,
      });

      console.info('Email removido com sucesso');
    } catch (error: any) {
      console.error(`deleteEmailById - ${JSON.stringify(error?.message)}`);
      throw new Error(`deleteEmailById - ${JSON.stringify(error?.message)}`);
    }
  }

  public static async sendNotificacao({
    to = ['henrique.serra@oito.srv.br'],
    subject,
  }: {
    to?: string[];
    subject: string;
  }) {
    const axiosRequest: AxiosRequestConfig = {
      method: 'POST',
      url: 'http://44.213.41.119:8037/email/notificacao',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        to,
        subject,
      },
    };

    const response: AxiosResponse = await axios(axiosRequest);

    console.info('Email enviado com sucesso', response);

    return response;
  }
}
