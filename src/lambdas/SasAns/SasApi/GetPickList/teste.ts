import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  dominio: 'ESPECIFICACAO_DA_CAUSA_RAIZ__c',
  dependente: 'Reembolso',
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
