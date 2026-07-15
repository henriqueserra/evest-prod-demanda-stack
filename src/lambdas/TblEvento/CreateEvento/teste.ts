import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  pk: '07757111320228040001',
  cliente: 'ReturnCadastro',
  created_at: '2022-08-04T00:00:00Z',
  evento: 'UploadRecebido',
  created_by: 'Teste',
  origem: 'Portal Uploads',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
