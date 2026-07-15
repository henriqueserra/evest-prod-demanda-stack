import { Context } from 'aws-lambda';

import { DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { EverestApoioDateTimeService } from '../../../../libs/everest.apoio.dateTime.service';
import { SendGridSendEmailInterfaceWithAttachment } from '../../../../libs/everest.interfaces';
import { EverestSendGridService } from '../../../../libs/everest.sendgrid.service';
import { GmailService } from '../../../../libs/gmail.service';
import { EverestApoioService } from '../../../../libs/everest.apoio.service';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    const now = new Date();
    const start = now.setUTCHours(12, 0, 0, 0);
    const reportStatTime = new Date(start);
    console.log(reportStatTime.toISOString());
    const reportStatTimeTime = EverestApoioDateTimeService.findPreviousWorkingDateTime(
      reportStatTime.toISOString()
    ).setUTCHours(20, 59, 59, 99);
    const reportStatTimeDateStr = new Date(reportStatTimeTime).toISOString();
    const reportFinishTimeDateStr = new Date(now.setUTCHours(20, 59, 59, 99)).toISOString();

    /* ---------------------------------------------------------------------- */

    let dados = await getDemandasRespondidas({
      startTime: reportStatTimeDateStr,
      finishTime: reportFinishTimeDateStr,
    });
    /* ---------------------------------------------------------------------- */

    dados = EverestApoioService.ordenaArray(dados, 'created_at');

    let csv: string = `"Manifestacao";"Data Recebimento";"Data Resposta";"Observacao"\n`;

    for (const linha of dados) {
      let data_recebimento: string = ' ';
      let data_resposta: string = ' ';
      if (linha?.data_recebimento) {
        data_recebimento = new Date(linha.data_recebimento).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      }
      if (linha?.data_resposta) {
        try {
          data_resposta = new Date(linha.data_resposta).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        } catch (error: any) {
          data_resposta = ' ';
        }
      }
      const newLinha = `"${linha.pk}";"${data_recebimento}";"${data_resposta}";"${linha.obs || ' '}"\n`;
      csv += newLinha;
    }

    //convert to base64
    csv = Buffer.from(csv).toString('base64');

    const emailParams: SendGridSendEmailInterfaceWithAttachment = {
      to: [
        'roberta.papale@oito.srv.br',
        'flavio.mendes@sulamerica.com.br',
        'kathleen.mello@sulamerica.com.br',
        'flavia.panontin@sulamerica.com.br',
        'carla.devecchi@sulamerica.com.br',
        'hugo.forli@sulamerica.com.br',
        'alessandro.teixeira@sulamerica.com.br',
        'kcanedo@oito.srv.br'        
      ],
      cc: ['thiago.oliveira@oito.srv.br'],
      bcc: ['henrique.serra@oito.srv.br'],
      from: {
        email: 'sas.ans.relatorio.respondidos@oito.srv.br',
        name: 'SasAnsRelatorioRespondidos',
      },
      replyTo: 'roberta.papale@oito.srv.br',
      subject: 'Relatório de demandas respondidas',
      text: 'Relatório de demandas respondidas',
      attachment: [
        {
          content: csv,
          filename: 'relatorio_demandas_respondidas.csv',
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    };

    await EverestSendGridService.sendGridSendEmailWithAttachment(emailParams);

    return dados;
  } catch (error: any) {
    console.error('ERRO:');
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

const getDemandasRespondidas = async ({ startTime, finishTime }: { startTime: string; finishTime: string }) => {
  try {
    let lastKey: any = null;
    let items: any = [];
    do {
      const scanParams: ScanCommandInput = {
        TableName: 'TblProdAnsResposta',
        FilterExpression: `#created_at BETWEEN :startTime AND :finishTime`,
        ExpressionAttributeNames: {
          '#created_at': 'created_at',
        },
        ExpressionAttributeValues: {
          ':startTime': { S: startTime },
          ':finishTime': { S: finishTime },
        },
        ExclusiveStartKey: lastKey,
        ProjectionExpression: 'pk, created_at, data_recebimento, data_resposta, obs',
      };
      const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand(scanParams));

      lastKey = LastEvaluatedKey;
      items = items.concat(Items);
    } while (lastKey);
    return items.map((item) => {
      return unmarshall(item);
    });
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getDemandasRespondidas - ${error.message}`);
  }
};
