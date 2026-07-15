import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  documento: '29877320827',
  pk: '1ae0230d-1818-4071-9ffb-db226df586df',
  cliente: 'SasAns',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
