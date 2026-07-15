import { handler } from './index';
import { Context } from 'aws-lambda';

const event: {
  message: string;
  detailType: string;
  source: string;
} = {
  message: '{"message":"\\"teste\\"","created_at":"2024-07-12T12:04:09.189Z"}',
  detailType: 'NewArquivoMigrarBucketEvent',
  source: 'everest.dev.demanda',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
