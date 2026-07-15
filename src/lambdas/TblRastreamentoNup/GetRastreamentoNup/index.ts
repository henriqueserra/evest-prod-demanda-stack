import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';
import { z } from 'zod';
import { LambdaServices } from '../../../libs/lambda.services';
import { DynamoDBServices } from '../../../libs/dynamodb.services';

export const handler = async (event: {}, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));
    console.info('context:');
    console.info(JSON.stringify(context));

    const schema = z.object({
      nup: z.string().min(20).max(25),
    });

    let nup = schema.parse(event).nup;

    nup = nup.replace(/\D/g, '');

    const query = getQuery(nup);

    const resultadoBruto = await executeQuery(query);

    if (resultadoBruto.length !== 1) {
      // Busca na tabela TblRastreamentoNup
      const lastSevenChars = nup.slice(-7);
      const rastreamentoNupBruto = await getRastreamentoNup(lastSevenChars);
      const rastreamentoNup = rastreamentoNupBruto.map((item) => {
        return {
          uf: item.uf.replace(/\s{2,}/g, ' '),
          tribunal: item.tribunal.replace(/\s{2,}/g, ' '),
          comarca: item.comarca.replace(/\s{2,}/g, ' '),
          foro: item.foro.replace(/\s{2,}/g, ' '),
          vara: item.vara.replace(/\s{2,}/g, ' '),
        };
      });
      return { dados: rastreamentoNup };
    } else {
      return {
        dados: [
          {
            uf: resultadoBruto[0].dsc_uf_processo.replace(/\s{2,}/g, ' '),
            tribunal: resultadoBruto[0].dsc_tribunal.replace(/\s{2,}/g, ' '),
            comarca: resultadoBruto[0].dsc_comarca.replace(/\s{2,}/g, ' '),
            foro: resultadoBruto[0].dsc_foro.replace(/\s{2,}/g, ' '),
            vara: resultadoBruto[0].dsc_vara.replace(/\s{2,}/g, ' '),
          },
        ],
      };
    }

    return true;
  } catch (error: any) {
    console.error(error.message);
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: error.message,
    });
    throw new Error(`${error.message}`);
  }
};

const getQuery = (nup: string) => {
  return `select dsc_numero_nup,dsc_uf_processo,dsc_tribunal,dsc_comarca,dsc_foro,dsc_vara from processo.nup n where dsc_numero_nup = '${nup}'`;
};

const executeQuery = async (query: string) => {
  const queryResult = await LambdaServices.invokeLambda({
    lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery`,
    payload: query,
  });

  return queryResult.rows;
};

const getRastreamentoNup = async (lastSevenChars: string) => {
  return await DynamoDBServices.queryItems({
    tableName: `TblProdRastreamentoNup`,
    keyConditionExpression: 'codigo_rastreamento = :codigo_rastreamento',
    expressionAttributeValues: {
      ':codigo_rastreamento': { S: lastSevenChars },
    },
  });
};
