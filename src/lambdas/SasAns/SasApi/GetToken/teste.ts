import { handler } from './index';
import { Context } from 'aws-lambda';

const event = { force: true };

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
