import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  arquivos: ['12769001_1711397907809_NOTIFICACAO.pdf'],
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
