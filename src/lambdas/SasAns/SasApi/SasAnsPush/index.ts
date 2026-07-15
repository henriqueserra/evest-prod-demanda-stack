import { Context } from 'aws-lambda';
import { sasAnsConsultaManifestacao } from '../../../../SasAns/api/sasAnsConsultaManifestacao';
import { sasAnsGetLinkDownload } from '../../../../SasAns/api/sasAnsGetLinkDownload';
import { sasAnsRegistraDemandaDeResposta } from '../../../../SasAns/demanda/sasAnsRegistrosResposta';
import {
  sendEmailNotificaErroPayload,
  sendEmailConfirmacaoRecebimentoDemandaResposta,
} from '../../../../SasAns/email/sasAnsSendEmails';
import { getTipificacaoAns } from '../../../../SasAns/sasAnsFuncoesApoio';
import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import axios, { AxiosRequestConfig } from 'axios';
import { S3Service } from '../../../../libs/s3.service';
import { SqsServices } from '../../../../libs/sqs.services';
import { GmailService } from '../../../../libs/gmail.service';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    const eventExists = await checkEventExists(event.id);

    // if (eventExists) return true;
    const payload = JSON.parse(event.detail.message);
    const payloadStr = `${JSON.stringify(payload)}`;

    const dadosParaEnvio = {
      codigo_ans: payload.codigo_ans,
      num_protocolo: payload.num_protocolo,
      num_manifestacao: payload.num_manifestacao,
      lstAnexos: payload.lstAnexos,
    };

    /* ---------------- Checa se arquivos estão dentro das regras --------------- */
    const tipificacaoAns = await getTipificacaoAns();
    if (!payload?.codigo_ans) {
      await sendEmailNotificaErroPayload({
        protocolo: dadosParaEnvio.num_protocolo,
        excecao: `A informação código ANS não foi informada!`,
      });
      return true;
    }
    for (const arquivo of dadosParaEnvio.lstAnexos) {
      if (!tipificacaoAns.includes(arquivo.tipificacao)) {
        await sendEmailNotificaErroPayload({
          protocolo: dadosParaEnvio.num_protocolo,
          excecao: `A tipificação "${arquivo.tipificacao}"
          indicada para o arquivo ${arquivo.nome_anexo}
          não consta do site ANS!`,
        });
        return true;
      }
      const tamanho = arquivo.nome_anexo.length;
      const ext = arquivo.nome_anexo.toLowerCase().split('.').pop();
      if (tamanho > 110) {
        await sendEmailNotificaErroPayload({
          protocolo: dadosParaEnvio.num_protocolo,
          excecao: `O arquivo ${arquivo.nome_anexo} ultrapassa o limite de 110 caracteres!`,
        });
        return true;
      }
      if (!(ext === 'pdf ' || 'doc' || 'docx' || 'wav' || 'mp3')) {
        await sendEmailNotificaErroPayload({
          protocolo: dadosParaEnvio.num_protocolo,
          excecao: `O arquivo ${arquivo.nome_anexo} possui extensão inválida!`,
        });
        return true;
      }
    }
    /* -------------------------------------------------------------------------- */

    /* -------------------------------------------------------------------------- */
    /*                                Checa horário                               */
    /* -------------------------------------------------------------------------- */
    const horaAtualUtc = new Date().getUTCHours();

    const manifestacao = await sasAnsConsultaManifestacao({
      manifestacao: dadosParaEnvio.num_protocolo,
    });
    if (manifestacao.manifestacao.length === 0) {
      throw new Error(`Manifestação referente ao protocolo ${dadosParaEnvio.num_protocolo} não encontrada!`);
    }

    const manifestacaoComDemanda = manifestacao.manifestacao.find(
      (item: any) => item.numero_da_demanda && item.numero_da_demanda.length > 0
    );

    const manifestacaoComCia = manifestacao.manifestacao.find(
      (item: any) => item.cia_constante_na_demanda && item.cia_constante_na_demanda.length > 0
    );

    const numero_demanda = manifestacaoComDemanda.numero_da_demanda;
    const cia_constante_demanda = manifestacaoComCia.cia_constante_na_demanda;
    //

    //
    let arquivosPersistidos: any[] = [];

    /* ----------------------- Apaga arquivos no diretório ---------------------- */
    let arquivosGravados = await S3Service.s3ListFilesInBucketAndKey({
      s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
      s3PartialKey: numero_demanda + '/',
    });
    if (arquivosGravados && arquivosGravados.length > 0) {
      for (const arquivo of arquivosGravados) {
        await S3Service.s3DeleteObject({
          s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
          s3Key: arquivo as string,
        });
      }
    }
    for (const arquivo of dadosParaEnvio.lstAnexos) {
      const dados = await sasAnsGetLinkDownload({
        arquivo: arquivo.nome_anexo,
      });
      if (dados.link.length === 0) {
        throw new Error(`Link para download do arquivo ${arquivo.nome_anexo} não pode ser gerada!`);
      }
      const buffer = await downloadFile({ url: dados.link[0].url_assinada });
      if (buffer.length > 5 * 1024 * 1024) {
        await sendEmailNotificaErroPayload({
          protocolo: dadosParaEnvio.num_protocolo,
          excecao: `O tamanho do arquivo ${arquivo.nome_anexo} ultrapassa 5 MBytes!`,
        });
        throw new Error(`O tamanho do arquivo ${arquivo.nome_anexo} ultrapassa 5 MBytes!`);
      }
      const arquivoGravado = await S3Service.s3PutObject({
        s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
        s3Key: numero_demanda + '/' + dados.link[0].arquivo,
        buffer: buffer,
      });
      arquivosPersistidos.push({
        path: numero_demanda + '/' + dados.link[0].arquivo,
        tipo: arquivo.tipificacao,
      });
    }
    //
    arquivosGravados = await S3Service.s3ListFilesInBucketAndKey({
      s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
      s3PartialKey: numero_demanda + '/',
    });

    if (dadosParaEnvio.lstAnexos.length !== arquivosGravados.length) {
      await sendEmailNotificaErroPayload({
        protocolo: dadosParaEnvio.num_protocolo,
        excecao: `Quantidade de arquivos informados (${dadosParaEnvio.lstAnexos.length}) 
        difere da quantidade de arquivos de fato (${arquivosGravados.length}) pois há arquivos duplicados!`,
      });
      return true;
    }

    // Prepara o Payload para o SQS
    const payloadSqsRobo = {
      bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.sasansresposta`,
      region: 'us-east-1',
      nip: numero_demanda,
      operadora: payload.codigo_ans ?? extraiCiaSaude({ cia_constante_demanda }),
      protocolo: dadosParaEnvio.num_protocolo,
      arquivos: arquivosPersistidos,
    };

    const queueName = `${process.env.LAMBDA_PREFIXO}AnsResposta`;
    const fila = await SqsServices.sqsSendMessageNoFifo({
      queueName: queueName,
      messageBody: JSON.stringify(payloadSqsRobo),
      delaySeconds: 1,
    });

    /* -------------------------------------------------------------------------- */
    /*                              Registra demanda                              */
    /* -------------------------------------------------------------------------- */
    await sasAnsRegistraDemandaDeResposta({
      protocolo: dadosParaEnvio,
      payloadSqsRobo: JSON.stringify(payloadSqsRobo),
    });

    /* -------------------------------------------------------------------------- */
    /* ------------------- Envia email via sendgrid e template ------------------ */

    await sendEmailConfirmacaoRecebimentoDemandaResposta({
      protocolo: payload.num_protocolo,
    });

    /* -------------------------------------------------------------------------- */

    return true;
  } catch (error: any) {
    console.error(error.message);

    if (error.message.includes('ultrapassa 5 MBytes!')) {
      return true;
    }
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

const downloadFile = async ({ url }: { url: string }): Promise<Buffer> => {
  try {
    const axiosRequest: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    };
    const response = await axios(axiosRequest);
    console.log(`Arquivo baixado!`);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`downloadFile - ${error.message}`);
  }
};

const extraiCiaSaude = ({ cia_constante_demanda }: { cia_constante_demanda: string }) => {
  try {
    if (cia_constante_demanda === 'Cia Saude') {
      return '006246';
    }
    if (cia_constante_demanda === 'Nova Sulamed') {
      return '416428';
    }
    if (cia_constante_demanda === 'Odonto') {
      return '417815';
    }
    if (cia_constante_demanda === 'Odonto') {
      return '321991';
    }
    if (cia_constante_demanda === 'Paraná Clinicas') {
      return '350141';
    }
    if (cia_constante_demanda === 'Odonto') {
      return '380041';
    }
    if (cia_constante_demanda === 'Sulasaude') {
      return '005622';
    }
    if (cia_constante_demanda === 'SOMPO') {
      return '000477';
    }
    if (cia_constante_demanda === 'Cia Saude') {
      return '000043';
    }
    if (cia_constante_demanda === 'SulaSeguro') {
      return '000043';
    }
    throw new Error('Cia não encontrada');
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`extraiCiaSaude - ${error.message}`);
  }
};

const checkEventExists = async (pk: string): Promise<boolean> => {
  try {
    const tableName = `Tbl${process.env.ENVIRONMENT}EventsLogs`;
    const getParams: GetItemCommandInput = {
      TableName: tableName,
      Key: {
        pk: { S: pk },
      },
      ConsistentRead: true,
    };
    const { Item } = await dynamoDBClient.send(new GetItemCommand(getParams));

    if (!Item) {
      const putParams: PutItemCommandInput = {
        TableName: tableName,
        Item: marshall({
          pk: pk,
          created_at: { S: new Date().toISOString() },
          try_count: 1,
        }),
      };
      await dynamoDBClient.send(new PutItemCommand(putParams));
      return false;
    } else {
      const item = unmarshall(Item);
      if (item?.try_count) {
        item.try_count = item.try_count + 1;
      } else {
        item.try_count = 2;
      }
      const putParams: PutItemCommandInput = {
        TableName: tableName,
        Item: marshall(item, { removeUndefinedValues: true }),
      };
      await dynamoDBClient.send(new PutItemCommand(putParams));
      return true;
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`checkEventExists - ${error.message}`);
  }
};
