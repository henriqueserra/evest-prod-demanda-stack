import { Context } from 'aws-lambda';
import { EverestSendGridService } from '../../../libs/everest.sendgrid.service';
import { SqsServices } from '../../../libs/sqs.services';
import { GmailService } from '../../../libs/gmail.service';

export const handler = async (event: any, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));
    console.info('context:');
    console.info(JSON.stringify(context));
    /* -------------------------------------------------------------------------- */

    const listDqlQueues = await SqsServices.listDqlQueues();
    if (!listDqlQueues) return;
    let queuesWithMessages: any[] = [];
    for (const dqlQueue of listDqlQueues) {
      const queue: {
        QueueName: string;
        QueueArn: string;
        ApproximateNumberOfMessages: number;
      } = await SqsServices.messagesOnQueue(dqlQueue);
      if (queue.ApproximateNumberOfMessages > 0) {
        queuesWithMessages.push(`${queue.QueueName} - ${queue.ApproximateNumberOfMessages}`);
      }
    }

    if (queuesWithMessages.length > 0) {
      // await EverestSendGridService.sendGridSendEmail;
      let filas = '';
      for (const queueWithMessages of queuesWithMessages) {
        filas += `${queueWithMessages}\n`;
      }

      let texto = `Existem mensagens nas filas DQL:\n\n${filas}`;
      await EverestSendGridService.sendGridSendEmail({
        to: ['henrique.serra@oito.srv.br', 'wendell.bitencourt@oito.srv.br'],
        from: {
          name: 'Everest - Filas DQL',
          email: `${process.env.LAMBDA_NAME}@oito.srv.br`,
        },
        subject: 'Filas DQL com mensagens',
        text: texto,
      });
      console.info(texto);
    }

    /* -------------------------------------------------------------------------- */
    return queuesWithMessages;
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
