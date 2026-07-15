import { handler } from './index';
import { Context } from 'aws-lambda';

const event = { cod_citacao_dado: '595272', ind_conferido_contencioso: true };

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
