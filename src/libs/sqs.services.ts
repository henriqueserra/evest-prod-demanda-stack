import {
  DeleteMessageCommand,
  DeleteMessageCommandInput,
  GetQueueAttributesCommand,
  GetQueueAttributesCommandInput,
  GetQueueAttributesCommandOutput,
  GetQueueAttributesRequest,
  GetQueueUrlRequest,
  SendMessageCommand,
  SendMessageCommandOutput,
  SendMessageRequest,
  SQS,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { SQSRecord } from 'aws-lambda';
import { randomUUID } from 'crypto';

const sqsClient = new SQSClient({ region: 'us-east-1' });
const sqs = new SQS({ region: 'us-east-1' });

export class SqsServices {
  static async listQueues() {
    try {
      const listQueues = await sqs.listQueues();
      return listQueues;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`listQueues - ${error.message}`);
    }
  }

  static async listDqlQueues() {
    try {
      let listQueues = await sqs.listQueues();
      const step_01 = listQueues.QueueUrls?.filter((queue) => queue.includes(process.env.ENVIRONMENT as string));
      const step_02 = step_01?.filter((queue) => queue.includes('Dql'));
      return step_02;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`listDqlQueues - ${error.message}`);
    }
  }

  static async messagesOnQueue(queueUrl: string): Promise<{
    QueueName: string;
    QueueArn: string;
    ApproximateNumberOfMessages: number;
  }> {
    try {
      const params: GetQueueAttributesCommandInput = {
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      };
      const response: GetQueueAttributesCommandOutput = await sqsClient.send(new GetQueueAttributesCommand(params));
      const QueueName = queueUrl.split('/').pop();
      const resposta: {
        QueueName: string;
        QueueArn: string;
        ApproximateNumberOfMessages: number;
      } = {
        QueueName: QueueName || '',
        QueueArn: response.Attributes?.QueueArn || '',
        ApproximateNumberOfMessages: parseInt(response.Attributes?.ApproximateNumberOfMessages || '0'),
      };
      return resposta;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`messagesOnQueue - ${error.message}`);
    }
  }

  static async deleteMessageFromQueue({ Record }: { Record: SQSRecord }) {
    try {
      // Get QueueUrl from QueueArn
      const queueName = Record.eventSourceARN.split(':').pop();
      const queueParams: GetQueueUrlRequest = {
        QueueName: queueName,
      };
      const queueAttributes = await sqs.getQueueUrl(queueParams);

      const deletParams: DeleteMessageCommandInput = {
        QueueUrl: queueAttributes.QueueUrl,
        ReceiptHandle: Record.receiptHandle,
      };
      try {
        await sqsClient.send(new DeleteMessageCommand(deletParams));
      } catch (error: any) {
        console.error(error.message);
      }
    } catch (error: any) {
      console.error(error.message);
    }
  }

  static async removeMessageFromQueue({ queueUrl, receiptHandle }: { queueUrl: string; receiptHandle: string }) {
    try {
      const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      };
      await sqs.deleteMessage(params);
      console.info(`Message deleted from the queue ${queueUrl}`);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`removeMessageFromQueue - ${error.message}`);
    }
  }

  static async getNumberOfMessages({ queueName }: { queueName: string }) {
    try {
      const queueParams: GetQueueUrlRequest = {
        QueueName: queueName,
      };
      const { QueueUrl } = await sqs.getQueueUrl(queueParams);

      // Get the approximate number of messages in the queue
      const queueAttributesParams: GetQueueAttributesRequest = {
        QueueUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      };
      const queueAttributes = await sqsClient.send(new GetQueueAttributesCommand(queueAttributesParams));
      const numberOfMessages = queueAttributes.Attributes?.ApproximateNumberOfMessages;

      return numberOfMessages;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getNumberOfMessages - ${error.message}`);
    }
  }

  static async sqsSendMessageNoFifo({
    queueName,
    messageBody,
    delaySeconds = 5,
  }: {
    queueName: string;
    messageBody: string;
    delaySeconds: number;
  }) {
    try {
      console.info(`Sending message to the queue no FIFO ${queueName}`);

      const queueParams: GetQueueUrlRequest = {
        QueueName: queueName,
      };
      const { QueueUrl } = await sqs.getQueueUrl(queueParams);

      const sendMessageParams: SendMessageRequest = {
        QueueUrl,
        MessageBody: messageBody,
        // DelaySeconds: delaySeconds,
      };
      return await sqsClient.send(new SendMessageCommand(sendMessageParams));
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`sqsSendMessageNoFifo - ${error.message}`);
    }
  }

  static async sqsSendMessageFifo({
    queueName,
    messageBody,
    messageGroupId = randomUUID(),
  }: {
    queueName: string;
    messageBody: string;
    messageGroupId?: string;
  }) {
    try {
      console.info(`Sending message to the queue FIFO ${queueName}`);
      const queueParams: GetQueueUrlRequest = {
        QueueName: queueName,
      };
      const { QueueUrl } = await sqs.getQueueUrl(queueParams);

      const sendMessageParams: SendMessageRequest = {
        QueueUrl,
        MessageBody: messageBody,
        MessageGroupId: randomUUID(),
      };
      const result: SendMessageCommandOutput = await sqsClient.send(new SendMessageCommand(sendMessageParams));

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Message sent to the queue ${queueName} - ${result.MessageId}`);

      return result;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`sqsSendMessageFifo - ${error.message}`);
    }
  }

  static async sqsSendMessageRouter({ pk }: { pk: string }) {
    try {
      const QueueName = `Everest${process.env.ENVIRONMENT}DemandaRouterSqs.fifo`;

      if (!pk) throw new Error('pk is required');

      await this.sqsSendMessageFifo({
        queueName: QueueName,
        messageBody: JSON.stringify({
          pk,
          lambda: process.env.LAMBDA_NAME as string,
          date: new Date().toISOString(),
          time: new Date().getTime(),
        }),
        messageGroupId: randomUUID(),
      });

      console.info(`pk ${pk} enviado para a fila ${QueueName}`);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`sqsSendMessageRouter - ${error.message}`);
    }
  }

  static async sqsSendMessageDemandaLogs({ pk, body }: { pk: string; body: string }) {
    try {
      const QueueName = `Everest${process.env.ENVIRONMENT}DemandaLogsSqs.fifo`;

      if (!pk) throw new Error('pk is required');
      if (!body) throw new Error('body is required');

      // Create a hash based on the body
      // const hash = createHash('sha256').update(body).digest('hex');

      await this.sqsSendMessageFifo({
        queueName: QueueName,
        messageBody: JSON.stringify({
          body,
          lambda: process.env.LAMBDA_NAME as string,
          date: new Date().toISOString(),
          time: new Date().getTime(),
        }),
        messageGroupId: randomUUID(),
      });

      console.info(`pk ${pk} enviado para a fila ${QueueName}`);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`sqsSendMessageDemandaLogs - ${error.message}`);
    }
  }

  static async getMessagesFromQueue(queueUrl: string) {
    try {
      const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10, // Adjust the number of messages to retrieve
        VisibilityTimeout: 20,
        WaitTimeSeconds: 0,
      };
      const response = await sqs.receiveMessage(params);
      return response.Messages || [];
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getMessagesFromQueue - ${error.message}`);
    }
  }
}
