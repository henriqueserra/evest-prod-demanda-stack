import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  version: '0',
  id: 'c8b4e43e-c4c6-bed8-3f72-eee80f922d16',
  'detail-type': 'NewArquivoMigrarBucketEvent',
  source: 'everest.dev.demanda',
  account: '028901343047',
  time: '2024-07-11T19:33:16Z',
  region: 'us-east-1',
  resources: [],
  detail: {
    message:
      '"{\\"pk\\":\\"60ae67ea-8f76-427d-93f3-1e22f7f81175\\",\\"sk\\":\\"arquivo::DocPeticaoInicial-130045181-Outros-documentos-HIPOS-1-.pdf\\"}"',
    created_at: '2024-07-11T19:31:07.025Z',
  },
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
