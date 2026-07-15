import { Context } from 'aws-lambda';
import { Pool, QueryResult } from 'pg';
import { executaQueryItens } from '../../../PlataformaColeta/executaQueryItens';
import { GmailService } from '../../../libs/gmail.service';

const client = new Pool({
  host: 'plataforma-coleta-prod.caccybipsr5p.sa-east-1.rds.amazonaws.com',
  port: 4789,
  database: 'plataforma_coleta',
  user: 'plataforma_coleta',
  password: 'plataforma_coleta_123',
});

export const handler = async (event: string, context: Context) => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    return await executaQueryItens(event);
  } catch (error: any) {
    console.error('ERRO:');
    console.error(error.message);
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: `${error.message}`,
    });
    throw new Error(`${error.message}`);
  }
};

const atualizaCitacaoIntegrada = async ({
  cod_citacao_dado,
  ind_conferido_contencioso = true,
}: {
  cod_citacao_dado: string;
  ind_conferido_contencioso: boolean;
}): Promise<QueryResult> => {
  try {
    console.info(`Atualizando citacao integrada: ${cod_citacao_dado}`);
    const query = `update
	captadores.citacao_dado
set
	ind_conferido_contencioso = ${ind_conferido_contencioso}
where
	cod_citacao_dado = ${cod_citacao_dado}`;
    if (!query) throw new Error('query is required');
    const response: QueryResult = await client.query(query);
    console.info(`Citação atualizada`);
    return response;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`atualizaCitacaoIntegrada - ${error.message}`);
  }
};
