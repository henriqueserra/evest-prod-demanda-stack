import { Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput } from '@aws-sdk/client-eventbridge';
import { GmailService } from '../../../libs/gmail.service';

const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });

export const handler = async (
  event: {
    message: string;
    detailType: string;
    source: string;
  },
  context: Context
): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event, null, 2));
  console.info('context');
  console.info(JSON.stringify(context, null, 2));
  try {
    const putEventParams: PutEventsCommandInput = {
      Entries: [
        {
          Detail: JSON.stringify({
            message: event.message,
            created_at: new Date().toISOString(),
          }),
          DetailType: event.detailType,
          EventBusName: process.env.EVENTBUS_NAME as string,
          Source: event.source,
        },
      ],
    };
    console.info('putEventParams');
    console.info(JSON.stringify(putEventParams, null, 2));
    const putEventsCommand = new PutEventsCommand(putEventParams);

    const response = await eventBridgeClient.send(putEventsCommand);
    console.info('response');
    console.info(JSON.stringify(response, null, 2));

    return response;
  } catch (error: any) {
    console.error(error.message);

    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
      emailsAdicionais: [],
    });
    return true;
  }
};
