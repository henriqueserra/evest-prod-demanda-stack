import { z } from 'zod';
import { DynamoDBServices } from './dynamodb.services';

export class EverestClienteService {
  private readonly tableName: string;
  public clienteName: string;
  public cliente!: ClienteInterface;
  constructor({ clienteName }: { clienteName: string }) {
    this.clienteName = clienteName;
    this.tableName = `Tbl${process.env.ENVIRONMENT}AdmCliente`;
  }

  async getCliente(): Promise<ClienteInterface> {
    try {
      const Item = await DynamoDBServices.getItemKey({
        tableName: this.tableName,
        key: { cliente: this.clienteName },
      });
      if (!Item) throw new Error('Cliente não encontrado!');
      this.cliente = Item as ClienteInterface;
      return this.cliente;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getCliente - ${error.message}`);
    }
  }

  async updateApiData({
    token,
    dataConsulta,
    expirationDate,
  }: {
    token: string;
    dataConsulta: string;
    expirationDate: string;
  }): Promise<ClienteInterface> {
    await this.getCliente();
    const base64Payload = token.split('.')[1];

    const payload = JSON.parse(atob(base64Payload));

    const exp = payload.exp;

    const newExpirationDate = expirationDate ? expirationDate : new Date(exp * 1000).toISOString();
    let cliente = await this.getCliente();
    cliente.api.token = token;
    cliente.api.expirationDate = newExpirationDate;
    cliente.api.dataConsulta = dataConsulta;
    cliente.updated_at = new Date().toISOString();
    cliente.updated_by = 'EverestClienteService.updateApiData';

    await DynamoDBServices.putItem({
      tableName: this.tableName,
      item: cliente,
    });
    console.info('Credenciais da API atualizadas com sucesso!');
    await this.getCliente();
    return this.cliente;
  }

  async getClienteApiParams(): Promise<ClienteApiParamsInterface> {
    try {
      const dados = await this.getCliente();
      return dados.api as ClienteApiParamsInterface;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getClienteApiParams - ${error.message}`);
    }
  }
}

// ClienteApiParamsInterface Zod schema
export const clienteApiParamsSchema = z.object({
  expiration_date: z.string(),
  last_token_request: z.string().optional(),
  token: z.string(),
  oauth_url: z.string().optional(),
  url_base: z.string().optional(),
  grant_type: z.string().optional(),
  password: z.string(),
  username: z.string().optional(),
  authorization_header: z.string().optional(),
  urls: z.any().optional(),
  Username: z.string().optional(),
  Password: z.string().optional(),
  personId: z.number().optional(),
  idMotivoOcorrenciaCivel: z.number().optional(),
  idDistribuidoMotivoOcorrenciaCivel: z.number().optional(),
  idMotivoOcorrenciaTrabalhista: z.number().optional(),
  idDistribuidoMotivoOcorrenciaTrabalhista: z.number().optional(),
  agentsid: z.string().optional(),
  base_url: z.string().optional(),
  dataConsulta: z.string(),
  expirationDate: z.string(),
  user_name: z.string().optional(),
});

// ClientePortalUploadInterface Zod schema
export const clientePortalUploadSchema = z.object({
  tipo: z.array(z.string()),
});

// ClienteTimeOutInterface Zod schema
export const clienteTimeOutSchema = z.record(z.string(), z.string());

// ClienteInterface Zod schema
export const clienteSchema = z.object({
  cliente: z.string(),
  api: clienteApiParamsSchema,
  created_by: z.string(),
  observacao: z.string(),
  PortalUpload: clientePortalUploadSchema,
  produto: z.string(),
  sla_horas: z.number(),
  time_out: clienteTimeOutSchema,
  tipo_demanda: z.array(z.string()),
  updated_at: z.string(),
  updated_by: z.string(),
  tipificacao_ans: z.array(z.string()).optional(),
  filas: z
    .array(
      z.object({
        sufixo: z.string(),
        enabled: z.boolean(),
      })
    )
    .optional(),
});

// TypeScript types inferred from the Zod schemas
export type ClienteApiParamsType = z.infer<typeof clienteApiParamsSchema>;
export type ClientePortalUploadType = z.infer<typeof clientePortalUploadSchema>;
export type ClienteTimeOutType = z.infer<typeof clienteTimeOutSchema>;
export type ClienteType = z.infer<typeof clienteSchema>;

export interface ClienteInterface {
  cliente: string;
  api: ClienteApiParamsInterface;
  created_by: string;
  observacao: string;
  PortalUpload: ClientePortalUploadInterface;
  produto: string;
  sla_horas: number;
  time_out: ClienteTimeOutInterface;
  tipo_demanda: string[];
  updated_at: string;
  updated_by: string;
  tipificacao_ans?: string[];
}

interface ClientePortalUploadInterface {
  tipo: string[];
}

export interface ClienteApiParamsInterface {
  expiration_date: string;
  last_token_request?: string;
  token: string;
  oauth_url?: string;
  url_base?: string;
  grant_type?: string;
  password: string;
  username?: string;
  authorization_header?: string;
  urls?: any;
  Username?: string;
  Password?: string;
  personId?: number;
  idMotivoOcorrenciaCivel?: number;
  idDistribuidoMotivoOcorrenciaCivel?: number;
  idMotivoOcorrenciaTrabalhista?: number;
  idDistribuidoMotivoOcorrenciaTrabalhista?: number;
  agentsid?: string;
  base_url?: string;
  dataConsulta: string;
  expirationDate: string;
  user_name?: string;
}

interface ClienteTimeOutInterface {
  Atualizacao: number;
  'Notificação extrajudicial': number;
  Procon: number;
}
