import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';
import { DynamoDBServices } from '../../../libs/dynamodb.services';
import { EverestApoioService } from '../../../libs/everest.apoio.service';
import { EverestPlataformaColetaService } from '../../../libs/everest.plataformacoleta.service';
import { Pool, QueryResult } from 'pg';

export const handler = async (event: {}, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));
    console.info('context:');
    console.info(JSON.stringify(context));

    const result = await executaQueryItens(query);

    const dadosBrutos = result.rows;

    let dadosFormatados: {
      codigo_rastreamento: string;
      sk?: string;
      uf: string;
      tribunal: string;
      comarca: string;
      foro: string;
      vara: string;
    }[] = [];

    for (const dado of dadosBrutos) {
      try {
        const sk = `${dado.dsc_uf_processo.toUpperCase()}::${dado.dsc_tribunal.toUpperCase()}::${dado.dsc_comarca.toUpperCase()}::${dado.dsc_foro.toUpperCase()}::${dado.dsc_vara.toUpperCase()}`;

        if (dado.substring.length !== 7) {
          continue;
        }

        if (sk.toUpperCase().includes('INDEFINIDO')) {
          continue;
        }
        dadosFormatados.push({
          codigo_rastreamento: dado.substring,
          sk,
          uf: dado.dsc_uf_processo ? dado.dsc_uf_processo.toUpperCase() : '',
          tribunal: dado.dsc_tribunal ? dado.dsc_tribunal.toUpperCase() : '',
          comarca: dado.dsc_comarca ? dado.dsc_comarca.toUpperCase() : '',
          foro: dado.dsc_foro ? dado.dsc_foro.toUpperCase() : '',
          vara: dado.dsc_vara ? dado.dsc_vara.toUpperCase() : '',
        });
      } catch (error: any) {
        continue;
      }
    }

    let total = dadosFormatados.length;
    for (const element of dadosFormatados) {
      await DynamoDBServices.putItem({
        tableName: `Tbl${process.env.ENVIRONMENT}RastreamentoNup`,
        item: {
          ...element,
        },
      });
      console.info(`Item ${element.codigo_rastreamento} inserido com sucesso! Faltam ${total--}`);
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

const query = `select
	distinct ( substring(dsc_numero_nup, 14) ,
	dsc_uf_processo ,
	dsc_tribunal ,
	dsc_comarca ,
	dsc_foro ,
	dsc_vara) as bruto,
	substring(dsc_numero_nup, 14) ,
	dsc_uf_processo ,
	dsc_tribunal ,
	dsc_comarca ,
	dsc_foro ,
	dsc_vara
from
	processo.nup n
where
	dsc_vara is not null
	and dsc_tribunal not like 'TRF%';`;

const client = new Pool({
  host: 'plataforma-coleta-prod.caccybipsr5p.sa-east-1.rds.amazonaws.com',
  port: 4789,
  database: 'plataforma_coleta',
  user: 'plataforma_coleta',
  password: 'plataforma_coleta_123',
});

const executaQueryItens = async (query: string): Promise<QueryResult> => {
  if (!query) throw new Error('query is required');
  const response: QueryResult = await client.query(query);
  return response;
};
