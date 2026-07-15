import { handler } from './index';
import { Context } from 'aws-lambda';

const event = {
  version: '0',
  id: '41477f05-fc51-59cc-e273-f1e295191406',
  'detail-type': 'NovaDemanda',
  source: 'everest.prod.sasans',
  account: '028901343047',
  time: '2024-07-04T22:45:58Z',
  region: 'us-east-1',
  resources: [],
  detail: {
    message:
      '{\n "num_protocolo": "00624620240625006285",\n "num_manifestacao": "98310808",\n "lstAnexos": [\n {\n "tipificacao": "Comprovante de contato com o beneficiário ou interlocutor",\n "nome_anexo": "DOC_1720101960343.pdf"\n },\n {\n "tipificacao": "Outros",\n "nome_anexo": "DOC_1720101952867.pdf"\n },\n {\n "tipificacao": "Proposta de adesão assinada ou documento equivalente",\n "nome_anexo": "DOC_1720101861042.pdf"\n },\n {\n "tipificacao": "Outros",\n "nome_anexo": "resposta NIP_Demanda 12932265_SABRINA GONZAGA TEIXEIRA MENDES_1720101846054.pdf"\n },\n {\n "tipificacao": "Proposta de adesão assinada ou documento equivalente",\n "nome_anexo": "DOC_1720101872411.pdf"\n },\n {\n "tipificacao": "Contrato, aditivos, anexos e termo de adaptação contratual, se houver",\n "nome_anexo": "DOC_1720101881477.pdf"\n },\n {\n "tipificacao": "Documentação apresentada para solicitação de reembolso",\n "nome_anexo": "DOC_1720101941337.pdf"\n }\n ],\n "codigo_ans": "000043"\n}',
    created_at: '2024-07-04T22:45:58.623Z',
  },
};

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
