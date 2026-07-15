import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  version: '0',
  id: '55149eed-0335-10e9-a8a2-cf082d70a63f',
  'detail-type': 'NovaDemanda',
  source: 'everest.prod.sasans',
  account: '028901343047',
  time: '2025-10-23T13:45:58Z',
  region: 'us-east-1',
  resources: [],
  detail: {
    message:
      '{\n "num_protocolo": "00624620251009028762",\n "num_manifestacao": "120357448",\n "lstAnexos": [\n {\n "tipificacao": "Outros",\n "nome_anexo": "Resposta 13652394- Luciano Ramos de Oliveira_1761170300889.pdf"\n },\n {\n "tipificacao": "Proposta de adesão assinada ou documento equivalente",\n "nome_anexo": "DOC_1761170312154.pdf"\n },\n {\n "tipificacao": "Outros",\n "nome_anexo": "DOC_1761170319940.pdf"\n },\n {\n "tipificacao": "Outros",\n "nome_anexo": "DOC_1761170330238.pdf"\n },\n {\n "tipificacao": "Contrato, aditivos, anexos e termo de adaptação contratual, se houver",\n "nome_anexo": "DOC_1761170336938.pdf"\n },\n {\n "tipificacao": "Pedido médico/odontológico",\n "nome_anexo": "DOC_1761170344146.pdf"\n },\n {\n "tipificacao": "Comprovante de contato com o beneficiário ou interlocutor",\n "nome_anexo": "DOC_1761170356042.pdf"\n }\n ],\n "codigo_ans": "006246"\n}',
    created_at: '2025-10-23T13:45:58.672Z',
  },
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
