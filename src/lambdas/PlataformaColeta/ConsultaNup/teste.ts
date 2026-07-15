import { handler } from './index';
import { Context } from 'aws-lambda';

const event: {
  nup: string;
} = {
  nup: '50052455220248130607',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
