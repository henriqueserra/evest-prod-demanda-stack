import { Context, SQSEvent } from 'aws-lambda';
import {
  RequestAtualizaArquivoEmManifestacaoInterface,
  RequestEnviaArquivoParaLinkAssinadoInterface,
  RequestLinkAssinadoUploadInterface,
  ResponseRequestLinkAssinadoUploadInterface,
} from '../../../../SasAns/SasAns.Interface';
import {
  sendEmailConfirmacaoDemandaRespondida,
  sendEmailNotificaErroPayload,
} from '../../../../SasAns/email/sasAnsSendEmails';
import { sasAnsAtualizaArquivoEmManifestacao } from '../../../../SasAns/api/sasAnsAtualizaArquivoEmManifestacao';
import { sasAnsGetLinkUploadAssinado } from '../../../../SasAns/api/sasAnsGetLinkUploadAssinado';
import { sasAnsUploadArquivoLinkAssinado } from '../../../../SasAns/api/sasAnsUploadArquivoLinkAssinado';
import {
  sasAnsRegistraRespostaProtocoladaComErro,
  sasAnsRegistraRespostaProtocolada,
} from '../../../../SasAns/demanda/sasAnsRegistrosResposta';
import { SendGridAttachmentInterface } from '../../../../libs/everest.interfaces';
import { S3Service } from '../../../../libs/s3.service';
import { SqsServices } from '../../../../libs/sqs.services';
import { GmailService } from '../../../../libs/gmail.service';

export const handler = async (event: SQSEvent, context: Context) => {
  console.log('event');
  console.log(JSON.stringify(event));
  let bufferVideo: Buffer = Buffer.from('');
  let record: any = {};
  try {
    for (const Record of event.Records) {
      record = Record;
      const body = JSON.parse(Record.body);
      body.protocolo = body.payload.protocolo;
      if (!body.protocolo) {
        await SqsServices.deleteMessageFromQueue({ Record });
        throw new Error('Protocolo não informado');
      }

      // if (body.protocolo === '00624620251106024391') {
      //   await SqsServices.deleteMessageFromQueue({ Record });
      //   continue;
      // }

      const protocolo = body.arquivosGerados.find(
        (item: any) => item.tipo === 'protocolo' && item.path?.includes('comprovante')
      );

      const video = body.arquivosGerados.find((item: any) => item.tipo === 'video');
      if (video?.path) {
        bufferVideo = await S3Service.s3GetObject({
          s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
          s3Key: video.path,
        });
      }
      // TODO: Implementar a rotina de envio dos emails para um container e usar o email do google.
      // TODO: Alterar o envio de arquivos para o envio de link pré-assinado.
      if (body.sucesso === false) {
        console.error(body.mensagemErro);
        await SqsServices.deleteMessageFromQueue({ Record });
        if (body.mensagemErro.includes('Demanda não encontrada')) {
          const mensagemDeErro = `Demanda não encontrada para o protocolo ${body.protocolo}, nip ${body.payload.nip} e empresa ${body.payload.operadora}`;
          let attachments: SendGridAttachmentInterface[] = [];
          if (bufferVideo.length > 0) {
            attachments.push({
              content: bufferVideo.toString('base64'),
              filename: 'video.avi',
              type: 'video/avi',
              disposition: 'attachment',
            });
          }
          await sendEmailNotificaErroPayload({
            protocolo: body.protocolo,
            excecao: mensagemDeErro,
            attachments,
          });
          await sasAnsRegistraRespostaProtocoladaComErro({
            protocolo: body.protocolo,
            errorMessage: mensagemDeErro,
          });

          return true;
        } else if (body.mensagemErro.includes('Tipo de arquivo selecionado não é igual ao tipo de arquivo enviado')) {
          const mensagemDeErro = `Site ANS não aceitou a tipificação para o protocolo ${body.protocolo}, nip ${body.payload.nip} e empresa ${body.payload.operadora}`;
          let attachments: SendGridAttachmentInterface[] = [];
          if (bufferVideo.length > 0) {
            attachments.push({
              content: bufferVideo.toString('base64'),
              filename: 'video.avi',
              type: 'video/avi',
              disposition: 'attachment',
            });
          }
          await sendEmailNotificaErroPayload({
            protocolo: body.protocolo,
            excecao: mensagemDeErro,
            attachments,
          });
          await sasAnsRegistraRespostaProtocoladaComErro({
            protocolo: body.protocolo,
            errorMessage: mensagemDeErro,
          });
          console.error(body.mensagemErro);

          return true;
        } else if (body.mensagemErro.includes('Aguardando tela de responder')) {
          const mensagemDeErro = `Demanda já está respondida no site ANS.`;
          let attachments: SendGridAttachmentInterface[] = [];
          if (bufferVideo.length > 0) {
            attachments.push({
              content: bufferVideo.toString('base64'),
              filename: 'video.avi',
              type: 'video/avi',
              disposition: 'attachment',
            });
          }
          await sendEmailNotificaErroPayload({
            protocolo: body.protocolo,
            excecao: mensagemDeErro,
            attachments,
          });
          await sasAnsRegistraRespostaProtocoladaComErro({
            protocolo: body.protocolo,
            errorMessage: mensagemDeErro,
          });
          console.error(body.mensagemErro);

          return true;
        }
        throw new Error(body.mensagemErro);
      }

      // Cria Upload

      const nomeComprovante = `PROTOCOLO_${new Date().getTime()}.pdf`;

      const payloadGetLinkPreAssinadoUpload: RequestLinkAssinadoUploadInterface = {
        arquivos: [nomeComprovante],
      };

      // Gera link assinado para upload
      const urlAssinada: ResponseRequestLinkAssinadoUploadInterface = await sasAnsGetLinkUploadAssinado({
        payload: payloadGetLinkPreAssinadoUpload,
      });
      //
      // Envia arquivo para o link assinado
      const dadosArquivo = await S3Service.s3GetObject({
        s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
        s3Key: protocolo.path,
      });
      const payloadUpload: RequestEnviaArquivoParaLinkAssinadoInterface = {
        url_assinada: urlAssinada.url_assinada,
        data: dadosArquivo,
      };
      const response = await sasAnsUploadArquivoLinkAssinado({
        ...payloadUpload,
      });
      //

      // Atualiza manifestação
      const payloadAtualizaManifestacao: RequestAtualizaArquivoEmManifestacaoInterface = {
        protocolo: body.protocolo,
        lista_anexos_link_assinado: [
          {
            nome_anexo: `${nomeComprovante}`,
            formato_anexo: 'pdf',
          },
        ],
      };
      await sasAnsAtualizaArquivoEmManifestacao({
        ...payloadAtualizaManifestacao,
      });
      //

      /* -------------------------------------------------------------------------- */
      /*                      Registra a resposta do protocoloÇ                     */
      /* -------------------------------------------------------------------------- */
      await sasAnsRegistraRespostaProtocolada({
        protocolo: body.protocolo,
      });
      /* -------------------------------------------------------------------------- */

      //

      /* -------------------------------------------------------------------------- */
      /*             Envia email de notificação de resposta protocolada             */
      /* -------------------------------------------------------------------------- */

      await sendEmailConfirmacaoDemandaRespondida({
        protocolo: body.protocolo,
        arquivo_protocolo: {
          s3Key: protocolo.path,
          s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
        },
        arquivo_video: {
          s3Key: video.path,
          s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
        },
      });

      /* -------------------------------------------------------------------------- */
      await SqsServices.deleteMessageFromQueue({ Record });
    }
    return true;
  } catch (error: any) {
    console.error(error.message);
    let attachments: {
      filename: string;
      content: string;
      mimeType: string;
    }[] = [];
    // if (bufferVideo.length > 0) {
    //   attachments.push({
    //     content: bufferVideo.toString('base64'),
    //     filename: 'video.avi',
    //     mimeType: 'video/avi',
    //   });
    // }

    // debugger;

    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
      attachments,
      emailsAdicionais: ['kleber.canedo@oito.srv.br', 'roberta.papale@oito.srv.br'],
    });

    throw new Error(`${error.message}`);
  }
};
