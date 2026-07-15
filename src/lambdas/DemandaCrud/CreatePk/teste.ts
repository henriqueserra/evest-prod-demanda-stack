import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  cliente: 'Neon',
  created_by: 'henrique.serra@oito.srv.br',
  processo: '',
  identificacao: '415.047.806-63',
  tipoDemanda: 'Notificação extrajudicial',
  origem: 'Portal Uploads',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
