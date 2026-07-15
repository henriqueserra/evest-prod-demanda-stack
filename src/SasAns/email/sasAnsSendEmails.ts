import { EverestApoioDateTimeService } from '../../libs/everest.apoio.dateTime.service';
import { SendGridAttachmentInterface } from '../../libs/everest.interfaces';
import { EverestSendGridService } from '../../libs/everest.sendgrid.service';
import { S3Service } from '../../libs/s3.service';
import { getFluxoEmail } from './getFluxoEmail';

const environment = process.env.ENVIRONMENT?.toLowerCase();

export const sendEmailConfirmacaoRecebimentoDemandaResposta = async ({ protocolo }: { protocolo: string }) => {
  try {
    const ehHoraUtil = await EverestApoioDateTimeService.getEhHoraUtil({
      data: new Date().toISOString(),
    });

    const fluxoEmails = await getFluxoEmail();

    const paramsEmail = {
      to: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.recebimento_resposta.emails
        : fluxoEmails.notifica_sucesso.recebimento_fora_horario.emails,
      from: {
        email: 'everest@oito.srv.br',
        name: 'Oito ANS Demanda recebida',
      },
      bcc: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.recebimento_resposta.bcc
        : fluxoEmails.notifica_sucesso.recebimento_fora_horario.bcc,
      replyTo: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.recebimento_resposta.reply_to
        : fluxoEmails.notifica_sucesso.recebimento_fora_horario.reply_to,
      templateId: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.recebimento_resposta.template_id
        : fluxoEmails.notifica_sucesso.recebimento_fora_horario.template_id,
      dynamicTemplateData: {
        protocolo,
        data_recebimento: new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
      },
    };

    if (environment !== 'prod') {
      console.log('params-confirmacao-recebimento-demanda-resposta', paramsEmail)
      return
    }

    const resposta = await EverestSendGridService.sendGridSenEmailTemplate(paramsEmail);

    // const resposta = await EverestSendGridService.sendGridSenEmailTemplate({
    //   to: ehHoraUtil
    //     ? fluxoEmails.notifica_sucesso.recebimento_resposta.emails
    //     : fluxoEmails.notifica_sucesso.recebimento_fora_horario.emails,
    //   from: {
    //     email: 'everest@oito.srv.br',
    //     name: 'Oito ANS Demanda recebida',
    //   },
    //   bcc: ['roberta.papale@oito.srv.br', 'luiz.silva@oito.srv.br'],
    //   replyTo: 'luiz.silva@oito.srv.br',
    //   templateId: ehHoraUtil
    //     ? fluxoEmails.notifica_sucesso.recebimento_resposta.template_id
    //     : fluxoEmails.notifica_sucesso.recebimento_fora_horario.template_id,
    //   dynamicTemplateData: {
    //     protocolo,
    //     data_recebimento: new Date().toLocaleString('pt-BR', {
    //       timeZone: 'America/Sao_Paulo',
    //     }),
    //   },
    // });

    return resposta;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sendEmailConfirmacaoRecebimentoDemandaResposta - ${error.message}`);
  }
};

export const sendEmailConfirmacaoDemandaRespondida = async ({
  protocolo,
  arquivo_protocolo,
  arquivo_video,
}: {
  protocolo: string;
  arquivo_protocolo: { s3Key: string; s3Bucket: string };
  arquivo_video: { s3Key: string; s3Bucket: string };
}) => {
  try {
    const ehHoraUtil = await EverestApoioDateTimeService.getEhHoraUtil({
      data: new Date().toISOString(),
    });

    const fluxoEmails = await getFluxoEmail();

    const bufferProtocolo = await S3Service.s3GetObject({
      s3Key: arquivo_protocolo.s3Key,
      s3Bucket: arquivo_protocolo.s3Bucket,
    });
    const bufferVideo = await S3Service.s3GetObject({
      s3Key: arquivo_video.s3Key,
      s3Bucket: arquivo_video.s3Bucket,
    });

    const attachmentProtocolo: SendGridAttachmentInterface = {
      content: bufferProtocolo.toString('base64'),
      filename: `protocolo_${protocolo}.pdf`,
      type: 'application/pdf',
      disposition: 'attachment',
    };
    const attachmentVideo: SendGridAttachmentInterface = {
      content: bufferVideo.toString('base64'),
      filename: `video_robo_${protocolo}.avi`,
      type: 'video/x-msvideo',
      disposition: 'attachment',
    };

    const paramsEmail = {
      to: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.resposta_protocolada.emails
        : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.emails,
      from: {
        email: 'everest@oito.srv.br',
        name: 'Oito ANS Protocolado',
      },
      bcc: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.resposta_protocolada.bcc
        : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.bcc,
      replyTo: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.resposta_protocolada.reply_to
        : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.reply_to,
      templateId: ehHoraUtil
        ? fluxoEmails.notifica_sucesso.resposta_protocolada.template_id
        : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.template_id,
      dynamicTemplateData: {
        protocolo,
        data_recebimento: new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
      },
      attachments: [attachmentProtocolo, attachmentVideo],
    };

    if (environment !== 'prod') {
      console.log('params-confirmacao-demanda-respondida', paramsEmail)
      return
    }

    const resposta = await EverestSendGridService.sendGridSenEmailTemplate(paramsEmail);

    // const resposta = await EverestSendGridService.sendGridSenEmailTemplate({
    //   to: ehHoraUtil
    //     ? fluxoEmails.notifica_sucesso.resposta_protocolada.emails
    //     : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.emails,
    //   from: {
    //     email: 'everest@oito.srv.br',
    //     name: 'Oito ANS Protocolado',
    //   },
    //   bcc: ['roberta.papale@oito.srv.br', 'luiz.silva@oito.srv.br'],
    //   replyTo: 'luiz.silva@oito.srv.br',
    //   templateId: ehHoraUtil
    //     ? fluxoEmails.notifica_sucesso.resposta_protocolada.template_id
    //     : fluxoEmails.notifica_sucesso.resposta_protocolada_fora_horario.template_id,
    //   dynamicTemplateData: {
    //     protocolo,
    //     data_recebimento: new Date().toLocaleString('pt-BR', {
    //       timeZone: 'America/Sao_Paulo',
    //     }),
    //   },
    //   attachments: [attachmentProtocolo, attachmentVideo],
    // });

    return resposta;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sendEmailConfirmacaoRecebimentoDemandaResposta - ${error.message}`);
  }
};

export const sendEmailNotificaErroPayload = async ({
  protocolo,
  excecao,
  attachments = [],
}: {
  protocolo: string;
  excecao: string;
  attachments?: SendGridAttachmentInterface[];
}) => {
  try {
    const ehHoraUtil = await EverestApoioDateTimeService.getEhHoraUtil({
      data: new Date().toISOString(),
    });

    const fluxoEmails = await getFluxoEmail();

    const resposta = await EverestSendGridService.sendGridSenEmailTemplate({
      to: ehHoraUtil
        ? fluxoEmails.notifica_excecao.payload_resposta_invalido.emails
        : fluxoEmails.notifica_excecao.payload_resposta_invalido.emails,
      from: {
        email: 'everest@oito.srv.br',
        name: 'Oito ANS ERRO recebido',
      },
      bcc: ['roberta.papale@oito.srv.br'],
      replyTo: 'roberta.papale@oito.srv.br',
      templateId: fluxoEmails.notifica_excecao.payload_resposta_invalido.template_id,
      dynamicTemplateData: {
        protocolo,
        data_recebimento: new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        excecao,
      },
      attachments: attachments,
    });

    return resposta;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sendEmailNotificaErroPayload - ${error.message}`);
  }
};
