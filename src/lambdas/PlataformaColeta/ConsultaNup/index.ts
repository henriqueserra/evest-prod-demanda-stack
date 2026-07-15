import { Context } from 'aws-lambda';
import { GmailService } from '../../../libs/gmail.service';
import { Pool, QueryResult } from 'pg';
import { EverestApoioService } from '../../../libs/everest.apoio.service';

const client = new Pool({
  host: 'plataforma-coleta-prod.caccybipsr5p.sa-east-1.rds.amazonaws.com',
  port: 4789,
  database: 'plataforma_coleta',
  user: 'plataforma_coleta',
  password: 'plataforma_coleta_123',
});

export const handler = async (event: any, context: Context) => {
  try {
    console.info('event:');
    console.info(JSON.stringify(event));

    if (!event.nup) throw new Error('nup não informado!');

    let nup = event.nup.replace(/[^0-9]/g, '');

    nup = nup.replace(' ', '');

    if (nup.length !== 20) throw new Error('nup inválido!');

    const dados = await consultaPlataformaDeColeta(nup);

    return { dados };
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

const consultaPlataformaDeColeta = async (
  nup: string
): Promise<{ uf: string; tribunal: string; comarca: string; foro: string; vara: string }[]> => {
  const lastSevenChars = nup.slice(-7);

  const query = buildQuery(lastSevenChars);

  const result = await executaQueryItens(query);

  let rows = result.rows;

  rows = rows.map((row) => `${row.uf};${row.tribunal};${row.comarca};${row.foro};${row.vara}`);

  rows = EverestApoioService.removeDuplicatesFromStringArray(rows);

  if (rows.length === 0) return [{ uf: '', tribunal: '', comarca: '', foro: '', vara: '' }];

  let dados: { uf: string; tribunal: string; comarca: string; foro: string; vara: string }[] = [];

  rows.forEach((row) => {
    const [uf, tribunal, comarca, foro, vara] = row.split(';');
    dados.push({ uf, tribunal, comarca, foro, vara });
  });

  return dados;
};

const buildQuery = (lastSevenChars: string): string => {
  return `select
	UPPER(dsc_uf_processo) as UF ,
	UPPER(dsc_tribunal) as Tribunal ,
	UPPER(dsc_comarca) as Comarca ,
	UPPER(dsc_foro) as Foro ,
	UPPER(dsc_vara) as Vara
from
	processo.nup n
where
	substring(dsc_numero_nup, 14) = '${lastSevenChars}'
	and dsc_vara is not null
	and dsc_tribunal not like 'TRF%';`;
};

const executaQueryItens = async (query: string): Promise<QueryResult> => {
  try {
    if (!query) throw new Error('query is required');
    const response: QueryResult = await client.query(query);
    return response;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`${error.message}`);
  }
};
