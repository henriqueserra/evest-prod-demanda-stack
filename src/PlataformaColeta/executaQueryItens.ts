import { Pool, QueryResult } from 'pg';

const client = new Pool({
  host: 'plataforma-coleta-prod.caccybipsr5p.sa-east-1.rds.amazonaws.com',
  port: 4789,
  database: 'plataforma_coleta',
  user: 'plataforma_coleta',
  password: 'plataforma_coleta_123',
});

export const executaQueryItens = async (
  query: string,
): Promise<QueryResult> => {
  try {
    if (!query) throw new Error('query is required');
    const response: QueryResult = await client.query(query);
    return response;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`${error.message}`);
  }
};
