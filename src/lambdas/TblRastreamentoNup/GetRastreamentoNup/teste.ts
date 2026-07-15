import { handler } from './index';
import { Context } from 'aws-lambda';

// const event = { nup: '50052455220248130607' };
const event = { nup: '0026164-33.2024.8.26.0005' };

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
