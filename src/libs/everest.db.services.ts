import { Pool, PoolClient } from 'pg';
import { EverestLogService } from './everest.log.services';
import {
  CreateDemandaDadoInterface,
  CreateDemandaInterface,
  CreatePayloadInterface,
  CreatePortalUploadsInterface,
  DemandaInterface,
  UserInterface,
} from './everest.db.interfaces';
import { Everest2DemandaService } from './everest.demanda.service';
import { EverestApoioDateTimeService } from './everest.apoio.dateTime.service';

const routeName = 'EverestDBServices';
const logService = new EverestLogService();
export class EverestDBServices {
  private readonly pool: Pool;
  constructor() {
    this.pool = new Pool({
      host: 'everest.c46mwg0c7idf.us-east-1.rds.amazonaws.com',
      port: 5432,
      user: 'everest',
      password: 'r2GFtjRvsbV33b26fkWmT',
      database: process.env.ENVIRONMENT?.toLowerCase() === 'dev' ? 'dev' : 'prod',
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async getConnection() {
    try {
      // Verifica se existe uma conexão aberta
      let connection = await this.pool.connect();
      try {
        await connection.query('SELECT 1');
        return connection;
      } catch {
        // Se não existir, cria uma nova conexão
        connection = await this.pool.connect();
        return connection;
      }
      return connection;
    } catch (error: any) {
      debugger;
      throw new Error(`${routeName} :: ${error.message}`);
    }
  }

  async closeConnection(connection: PoolClient) {
    await connection.release();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Demanda                                  */
  /* -------------------------------------------------------------------------- */
  async getDemandaByPk(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.getDemandaByPk`;
    try {
      const result = await connection.query('SELECT * FROM demanda.demandas WHERE pk = $1', [pk]);
      return result.rows[0];
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${pk} :: ${error.message}`);
    }
  }
  async isDemandaByPkExists(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.isDemandaByPkExists`;
    try {
      const result = await connection.query('SELECT * FROM demanda.demandas WHERE pk = $1', [pk]);
      if (result?.rows[0]?.pk) {
        return true;
      }
      return false;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${pk} :: ${error.message}`);
    }
  }
  async updateDemanda(demanda: DemandaInterface, connection: PoolClient) {
    const methodName = `${routeName}.updateDemanda`;
    try {
      demanda.auditoria_oito_usuario =
        demanda.auditoria_oito_usuario === 'Automatico' ? null : demanda.auditoria_oito_usuario;

      const result = await connection.query(
        `UPDATE demanda.demandas SET 
          cliente = $1, 
          updated_by = $2, 
          due_date = $3, 
          cod_nup = $4, 
          data_carimbo = $5, 
          is_active = $6, 
          perfil_demanda = $7, 
          prioridade = $8, 
          sla_horas = $9, 
          tipo_demanda = $10, 
          origem = $11, 
          id_cliente = $12, 
          esteira_oito_usuario = $13, 
          esteira_cliente_usuario = $14, 
          tipificacao_oito_usuario = $15, 
          auditoria_oito_usuario = $16, 
          processo = $17, 
          identificacao = $18, 
          status_demanda = $19,
          updated_at = NOW()
        WHERE pk = $20`,
        [
          demanda.cliente,
          demanda.updated_by,
          demanda.due_date || new Date().toISOString(),
          demanda.cod_nup,
          demanda.data_carimbo,
          demanda.is_active,
          demanda.perfil_demanda,
          demanda.prioridade,
          demanda.sla_horas || 9,
          demanda.tipo_demanda || 'TBD',
          demanda.origem,
          demanda.id_cliente,
          demanda.esteira_oito_usuario,
          demanda.esteira_cliente_usuario,
          demanda.tipificacao_oito_usuario,
          demanda.auditoria_oito_usuario,
          demanda.processo,
          demanda.identificacao,
          demanda.status_demanda,
          demanda.pk,
        ]
      );
      logService.info({ message: `${demanda.pk} Atualizado com sucesso`, method: methodName });
      return result;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${demanda.pk} :: ${error.message}`);
    }
  }
  async createDemanda(demanda: CreateDemandaInterface, connection: PoolClient) {
    const methodName = `${routeName}.createDemanda`;
    // logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const result = await connection.query(
        `INSERT INTO demanda.demandas (
          pk, cliente, created_at, updated_at, created_by, updated_by, due_date, 
          cod_nup, data_carimbo, is_active, perfil_demanda, prioridade, sla_horas, 
          tipo_demanda, origem, id_cliente, esteira_oito_usuario, esteira_cliente_usuario, 
          tipificacao_oito_usuario, auditoria_oito_usuario, processo, identificacao, 
          status_demanda, usuario_atuando, suit_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        ON CONFLICT (pk) DO UPDATE SET
          cliente = EXCLUDED.cliente,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          due_date = EXCLUDED.due_date,
          cod_nup = EXCLUDED.cod_nup,
          data_carimbo = EXCLUDED.data_carimbo,
          is_active = EXCLUDED.is_active,
          perfil_demanda = EXCLUDED.perfil_demanda,
          prioridade = EXCLUDED.prioridade,
          sla_horas = EXCLUDED.sla_horas,
          tipo_demanda = EXCLUDED.tipo_demanda,
          origem = EXCLUDED.origem,
          id_cliente = EXCLUDED.id_cliente,
          esteira_oito_usuario = EXCLUDED.esteira_oito_usuario,
          esteira_cliente_usuario = EXCLUDED.esteira_cliente_usuario,
          tipificacao_oito_usuario = EXCLUDED.tipificacao_oito_usuario,
          auditoria_oito_usuario = EXCLUDED.auditoria_oito_usuario,
          processo = EXCLUDED.processo,
          identificacao = EXCLUDED.identificacao,
          status_demanda = EXCLUDED.status_demanda,
          usuario_atuando = EXCLUDED.usuario_atuando,
          suit_id = EXCLUDED.suit_id
        RETURNING *`,
        [
          demanda.pk,
          demanda.cliente,
          demanda.created_at,
          demanda.updated_at,
          demanda.created_by,
          demanda.updated_by,
          demanda.due_date,
          demanda.cod_nup,
          demanda.data_carimbo,
          demanda.is_active,
          demanda.perfil_demanda,
          demanda.prioridade,
          demanda.sla_horas,
          demanda.tipo_demanda || 'TBD',
          demanda.origem,
          demanda.id_cliente || null,
          demanda.esteira_oito_usuario || null,
          demanda.esteira_cliente_usuario || null,
          demanda.tipificacao_oito_usuario || null,
          demanda.auditoria_oito_usuario || null,
          demanda.processo || null,
          demanda.identificacao || null,
          demanda.status_demanda,
          demanda.usuario_atuando || null,
          demanda.suit_id || null,
        ]
      );
      logService.info({
        message: `${demanda.cliente}/${demanda.pk} Processada com sucesso (insert/update) ...`,
        method: methodName,
      });
      return result.rows[0];
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${demanda.pk} :: ${error.message}`);
    }
  }

  static async createDemandaStatic(demanda: CreateDemandaInterface) {
    const methodName = `${routeName}.createDemandaStatic`;
    try {
      const everestDBService = new EverestDBServices();
      const connection = await everestDBService.getConnection();
      await everestDBService.createDemanda(demanda, connection);
      await everestDBService.closeConnection(connection);
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${demanda.pk} :: ${error.message}`);
    }
  }
  async deleteDemandaByPk(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.deleteDemandaByPk`;
    try {
      const result = await connection.query('DELETE FROM demanda.demandas WHERE pk = $1', [pk]);
      return result;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${pk} :: ${error.message}`);
    }
  }
  async inativaDemanda(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.inativaDemanda`;
    try {
      const result = await connection.query('UPDATE demanda.demandas SET is_active = false WHERE pk = $1', [pk]);
      return result;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${pk} :: ${error.message}`);
    }
  }
  async getVwDemandasComExtracaoPendente() {
    const connection = await this.getConnection();
    const methodName = `${routeName}.getVwDemandasComExtracaoPendente`;
    try {
      const result = await connection.query('SELECT * FROM demanda.vw_demandas_com_extracao_pendente;');
      await this.closeConnection(connection);
      return result.rows;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  async getPksByCliente(cliente: string, connection: PoolClient) {
    const methodName = `${routeName}.getPksByCliente`;
    try {
      const result = await connection.query('SELECT pk FROM demanda.demandas WHERE cliente = $1', [cliente]);
      return result.rows;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  async migraAtualizaDynamoPostgres(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.migraNovaDemanda`;
    try {
      // 1 - Consulta o status da demanda no Dynamo
      // 2 - Consulta o status da demanda no Postgres
      // 3 - Compara os status
      // 4 - Se os status forem diferentes, atualiza o status no Postgres
      // 5 - Se os status forem iguais, não faz nada

      /* ------------------------ Obtem demanda no DynamoDB ----------------------- */
      const pkService = new Everest2DemandaService({ pk });
      try {
        await pkService.getStatus();
        if (!pkService?.status?.data_carimbo) {
          const dueDate = await EverestApoioDateTimeService.getDueDate(
            pkService.status.created_at,
            pkService?.status?.sla_horas || 9
          );
          await pkService.updateStatus({
            data_carimbo: pkService.status.created_at,
            due_date: dueDate.data_do_carimbo,
            updated_by: pkService.status.updated_by,
          });
          await pkService.getStatus();
        }
        if (!pkService?.status?.due_date) {
          const dueDate = await EverestApoioDateTimeService.getDueDate(
            pkService.status.data_carimbo,
            pkService?.status?.sla_horas || 9
          );
          await pkService.updateStatus({
            due_date: dueDate.data_do_carimbo,
            updated_by: pkService.status.updated_by,
          });
          await pkService.getStatus();
        }
      } catch (error: any) {
        logService.error({ message: error.message, method: methodName });
        return;
      }
      /* -------------------------------------------------------------------------- */

      /* ------------------------------- Create Item ------------------------------ */
      const payload: CreateDemandaInterface = {
        pk,
        cod_nup: pkService.status.cod_nup || null,
        cliente: pkService.status.cliente,
        created_by: pkService.status.created_by,
        updated_by: pkService.status.updated_by,
        updated_at: pkService.status.updated_at,
        created_at: pkService.status.created_at,
        data_carimbo: pkService.status.data_carimbo,
        due_date: pkService.status.due_date || '',
        is_active: pkService.status.is_active || true,
        perfil_demanda: pkService.status.perfil_demanda,
        prioridade: pkService.status.prioridade,
        sla_horas: pkService.status.sla_horas,
        tipo_demanda: pkService.status.tipo_demanda || null,
        origem: pkService.status.origem || null,
        id_cliente: pkService.status.id_cliente || null,
        esteira_oito_usuario: pkService.status.esteira_oito_usuario || null,
        esteira_cliente_usuario: pkService.status.esteira_cliente_usuario || null,
        tipificacao_oito_usuario: pkService.status.tipificacao_oito_usuario || null,
        auditoria_oito_usuario: pkService.status.auditoria_oito_usuario || null,
        processo: pkService.status.processo || null,
        identificacao: pkService.status.identificacao || null,
        suit_id: pkService.status.suit_id || null,
        status_demanda: pkService.status.status_demanda,
        usuario_atuando: pkService?.status?.usuario_atuando || null,
      };
      await EverestDBServices.createDemandaStatic(payload);
      logService.info({ message: `Demanda ${pk} criada com sucesso`, method: methodName });
      // const demandaDynamo: CreateDemandaInterface = {
      //   pk,
      //   cod_nup: pkService.status.cod_nup || null,
      //   cliente: pkService.status.cliente,
      //   created_by: pkService.status.created_by,
      //   updated_by: pkService.status.updated_by,
      //   updated_at: pkService.status.updated_at,
      //   created_at: pkService.status.created_at,
      //   data_carimbo: pkService.status.data_carimbo,
      //   due_date: pkService.status.due_date || '',
      //   is_active: pkService.status.is_active || true,
      //   perfil_demanda: pkService.status.perfil_demanda,
      //   prioridade: pkService.status.prioridade,
      //   sla_horas: pkService.status.sla_horas,
      //   tipo_demanda: pkService.status.tipo_demanda,
      //   origem: pkService.status.origem,
      //   id_cliente: pkService.status.id_cliente || null,
      //   esteira_oito_usuario: pkService.status.esteira_oito_usuario || null,
      //   esteira_cliente_usuario: pkService.status.esteira_cliente_usuario || null,
      //   tipificacao_oito_usuario: pkService.status.tipificacao_oito_usuario || null,
      //   auditoria_oito_usuario: pkService.status.auditoria_oito_usuario || null,
      //   processo: pkService.status.processo || null,
      //   identificacao: pkService.status.identificacao || null,
      //   suit_id: pkService.status.suit_id || null,
      //   status_demanda: pkService.status.status_demanda,
      //   usuario_atuando: pkService?.status?.usuario_atuando || null,
      // };
      // /* ------------------------ Obtem demanda no Postgres ----------------------- */
      // const demandaPostgres = await this.getDemandaByPk(pk, connection);
      // /* -------------------------------------------------------------------------- */

      // if (demandaPostgres) {
      //   logService.info({
      //     message: `Demanda ${pk} encontrada`,
      //     method: methodName,
      //   });
      //   /* ------------------------ Compara os status ------------------------------ */

      //   /* -------------------------------------------------------------------------- */

      //   // Extract the differences between demandaPostgres and demandaDynamo
      //   const differences: Partial<CreateDemandaInterface> = {};
      //   demandaPostgres.created_at = demandaPostgres.created_at.toISOString();
      //   demandaPostgres.updated_at = demandaPostgres.updated_at.toISOString();
      //   demandaPostgres.data_carimbo = demandaPostgres.data_carimbo.toISOString();
      //   demandaPostgres.due_date = demandaPostgres.due_date.toISOString();

      //   // Compara cada campo entre demandaPostgres e demandaDynamo
      //   if (demandaPostgres) {
      //     // Campos que podem ter diferenças
      //     const fieldsToCompare: (keyof CreateDemandaInterface)[] = [
      //       'cod_nup',
      //       'cliente',
      //       'updated_by',
      //       'updated_at',
      //       'data_carimbo',
      //       'due_date',
      //       'is_active',
      //       'perfil_demanda',
      //       'prioridade',
      //       'sla_horas',
      //       'tipo_demanda',
      //       'origem',
      //       'id_cliente',
      //       'esteira_oito_usuario',
      //       'esteira_cliente_usuario',
      //       'tipificacao_oito_usuario',
      //       'auditoria_oito_usuario',
      //       'processo',
      //       'identificacao',
      //       'suit_id',
      //       'status_demanda',
      //       'usuario_atuando',
      //     ];

      //     for (const field of fieldsToCompare) {
      //       const postgresValue = demandaPostgres[field];
      //       const dynamoValue = demandaDynamo[field];

      //       if (postgresValue !== dynamoValue) {
      //         differences[field] = dynamoValue as any;
      //       }
      //     }
      //   }

      //   // Se em diferrences houver apenas um atributo e este atributo for updated_at, return
      //   if (Object.keys(differences).length === 1 && Object.keys(differences)[0] === 'updated_at') {
      //     return;
      //   }

      //   // Se há diferenças, atualiza no Postgres
      //   if (Object.keys(differences).length > 0) {
      //     logService.info({
      //       message: `Diferenças encontradas para demanda ${pk}: ${JSON.stringify(differences)}`,
      //       method: methodName,
      //     });

      //     // Atualiza apenas os campos que mudaram
      //     const updateFields = Object.keys(differences).map((field, index) => `${field} = $${index + 2}`);
      //     const updateValues = Object.values(differences);

      //     // debugger;

      //     const query = `
      //     INSERT INTO demanda.demandas (pk, ${Object.keys(differences).join(', ')})
      //     VALUES ($1, ${Object.keys(differences)
      //       .map((_, index) => `$${index + 2}`)
      //       .join(', ')})
      //     ON CONFLICT (pk) DO UPDATE SET
      //     ${Object.keys(differences)
      //       .map((field, index) => `${field} = EXCLUDED.${field}`)
      //       .join(', ')}
      //   `;

      //     await connection.query(query, [pk, ...updateValues]);
      //     logService.info({
      //       message: `${demandaDynamo.cliente} Demanda ${pk} atualizada com sucesso`,
      //       method: methodName,
      //     });
      //   }
      // } else {
      //   await this.createDemanda(demandaDynamo, connection);
      // }

      return;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                Demanda Dado                                */
  /* -------------------------------------------------------------------------- */
  async migraAtualizaDemandaDadoDynamoPostgres(pk: string, sk: string, connection: PoolClient) {
    const methodName = `${routeName}.migraAtualizaDemandaDadoDynamoPostgres`;
    return;
    try {
      // debugger;
      const pkService = new Everest2DemandaService({ pk: pk });
      await pkService.getStatus();
      const demandaDadoDynamo = await pkService.getDemandaDadoBySk({ sk });
      const demandaDadoPostgres = await this.getDemandaDadoByPkSk(pk, sk, connection);

      if (demandaDadoPostgres?.pk_demandas) {
        /* -------------------------- Atualiza Demanda Dado ------------------------- */
        debugger;
      } else {
        /* ---------------------------- Cria Demanda Dado --------------------------- */
        // debugger;
        const demandaDado: CreateDemandaDadoInterface = {
          pk: pk,
          cliente: pkService.status.cliente,
          tipo_dado: demandaDadoDynamo.name,
          value: demandaDadoDynamo?.value || '',
          created_at: demandaDadoDynamo.created_at,
          updated_at: demandaDadoDynamo.updated_at,
          created_by: demandaDadoDynamo.created_by || 'everest_generico@oito.com.br',
          updated_by: demandaDadoDynamo.updated_by || 'everest_generico@oito.com.br',
          is_active: true,
          ai_created: false,
          metadata: {},
        };
        // debugger;
        await this.createDemandaDado(demandaDado, connection);
      }
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createDemandaDado(demandaDado: CreateDemandaDadoInterface, connection: PoolClient) {
    const methodName = `${routeName}.createDemandaDado`;
    try {
      if (!demandaDado?.tipo_dado) {
        // debugger;
        return;
      }
      if (demandaDado.tipo_dado === 'inicio_esteira_oito::') {
        return;
      }
      const tipoDado = await this.getAllTipoDados(connection);
      if (!tipoDado.find((t) => t.tipo_dado === demandaDado.tipo_dado)) {
        await this.createTipoDado(demandaDado.tipo_dado, connection);
      }
      const query = `
        INSERT INTO demanda.demanda_dados (
          pk, cliente, is_active, created_at, updated_at, 
          created_by, updated_by, tipo_dado, value, ai_created, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (pk, tipo_dado) 
        DO UPDATE SET
          cliente = EXCLUDED.cliente,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          value = EXCLUDED.value,
          ai_created = EXCLUDED.ai_created,
          metadata = EXCLUDED.metadata
        RETURNING *
      `;

      const result = await connection.query(query, [
        demandaDado.pk,
        demandaDado.cliente,
        demandaDado.is_active,
        demandaDado?.created_at || new Date().toISOString(),
        demandaDado?.updated_at || new Date().toISOString(),
        demandaDado.created_by,
        demandaDado.updated_by,
        demandaDado.tipo_dado,
        demandaDado.value,
        demandaDado.ai_created,
        demandaDado.metadata,
      ]);
      return;
    } catch (error: any) {
      logService.error({ message: `${error.message} :: ${JSON.stringify(demandaDado)}`, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async getDemandaDadoByPkSk(pk: string, sk: string, connection: PoolClient) {
    const methodName = `${routeName}.getDemandaDadoByPk`;
    try {
      const result = await connection.query('SELECT * FROM demanda.demanda_dados WHERE pk_demandas = $1 AND sk = $2', [
        pk,
        sk,
      ]);
      return result.rows[0];
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  async inativaDemandaDado(pk: string, sk: string, connection: PoolClient) {
    const methodName = `${routeName}.inativaDemandaDado`;
    try {
      const result = await connection.query(
        'UPDATE demanda.demanda_dados SET is_active = false WHERE pk_demandas = $1 AND sk = $2',
        [pk, sk]
      );
      return result;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                    Users                                   */
  /* -------------------------------------------------------------------------- */
  async getAllUsers(connection: PoolClient) {
    const methodName = `${routeName}.getAllUsers`;
    try {
      const result = await connection.query('SELECT * FROM public.users where is_active = true order by pk asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  async getUserByPk(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.getUserByPk`;
    // logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const result = await connection.query('SELECT * FROM public.users WHERE pk = $1', [pk]);
      return result.rows[0];
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  async createUser(user: UserInterface, connection: PoolClient) {
    const methodName = `${routeName}.createUser`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const result = await connection.query(
        'INSERT INTO public.users (pk, name, created_by, updated_by) VALUES ($1, $2, $3, $4)',
        [user.pk, user.name, user.created_by, user.updated_by]
      );
      logService.info({ message: `Finalizado ...`, method: methodName });
      return result;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      debugger;
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                   Origem                                   */
  /* -------------------------------------------------------------------------- */
  async getAllOrigems(connection: PoolClient) {
    const methodName = `${routeName}.getAllOrigems`;
    try {
      const result = await connection.query('SELECT * FROM public.origems order by origem asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                               Perfil Demanda                               */
  /* -------------------------------------------------------------------------- */
  async getAllPerfilDemandas(connection: PoolClient) {
    const methodName = `${routeName}.getAllPerfilDemandas`;
    try {
      const result = await connection.query('SELECT * FROM public.perfil_demandas order by perfil_demanda asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                               Status Demanda                               */
  /* -------------------------------------------------------------------------- */
  async getAllStatusDemandas(connection: PoolClient) {
    const methodName = `${routeName}.getAllStatusDemandas`;
    try {
      const result = await connection.query('SELECT * FROM public.status_demandas order by status_demanda asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                Tipo Demanda                                */
  /* -------------------------------------------------------------------------- */
  async getAllTipoDemandas(connection: PoolClient) {
    const methodName = `${routeName}.getAllTipoDemandas`;
    try {
      const result = await connection.query('SELECT * FROM public.tipo_demandas order by tipo_demanda asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                  Clientes                                  */
  /* -------------------------------------------------------------------------- */
  async getAllClientes(connection: PoolClient) {
    const methodName = `${routeName}.getAllClientes`;
    try {
      const result = await connection.query(
        'SELECT * FROM public.clientes where is_active = true order by cliente asc;'
      );
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                               Dados Extraidos                              */
  /* -------------------------------------------------------------------------- */
  async getDadosExtraidosByPk(pk: string, connection: PoolClient) {
    const methodName = `${routeName}.getDadosExtraidosByPk`;
    try {
      const result = await connection.query('SELECT * FROM demanda.dados_extraidos WHERE pk = $1', [pk]);
      return result.rows[0];
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                               Query genérica                               */
  /* -------------------------------------------------------------------------- */
  static async queryGenericaStatic(query: string) {
    const methodName = `${routeName}.queryGenerica`;
    const everestDBService = new EverestDBServices();
    const connection = await everestDBService.pool.connect();
    try {
      const result = await connection.query(query);
      return result?.rows ?? [];
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      return [];
    } finally {
      await everestDBService.closeConnection(connection);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Tipo Dado                                 */
  /* -------------------------------------------------------------------------- */
  async createTipoDado(tipo_dado: string, connection: PoolClient) {
    const methodName = `${routeName}.createTipoDado`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const query = `INSERT INTO public.tipo_dados (tipo_dado, updated_by) VALUES ($1, $2);`;
      const result = await connection.query(query, [tipo_dado, 'everest_generico@oito.com.br']);
      logService.info({ message: `Finalizado ...`, method: methodName });
      return result;
    } catch (error: any) {
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async getAllTipoDados(connection: PoolClient) {
    const methodName = `${routeName}.getAllTipoDados`;
    try {
      const result = await connection.query('SELECT * FROM public.tipo_dados order by tipo_dado asc;');
      return result.rows;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                  Payloads                                  */
  /* -------------------------------------------------------------------------- */
  async createPayload(payload: CreatePayloadInterface, connection: PoolClient) {
    const methodName = `${routeName}.createPayload`;
    try {
      const result = await connection.query(
        `INSERT INTO log.payloads (pk, tipo, created_at, payload) 
         VALUES ($1, $2, $3, $4)`,
        [payload.pk, payload.tipo, payload.created_at || new Date().toISOString(), payload.payload]
      );
      return result;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  /**
   * @param pk - Chave primária da demanda
   * @param tipo - Nome completo do método que está sendo executado
   * @param created_at - Data e hora atual
   * @param payload - Dados do payload
   * @example
   * await EverestDBServices.createPayloadStatic({
   *   pk: '123e4567-e89b-12d3-a456-426614174000',
   *   tipo: 'SumUpPosAuditoriaOito.processaProcessoNotificacaoExtrajudicial',
   *   created_at: new Date().toISOString(),
   *   payload: payloadData
   * });
   */
  static async createPayloadStatic(payload: CreatePayloadInterface) {
    const methodName = `${routeName}.MethodName`;
    const everestDBService = new EverestDBServices();
    const connection = await everestDBService.pool.connect();
    try {
      await everestDBService.createPayload(payload, connection);
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
    } finally {
      await everestDBService.closeConnection(connection);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Portal Uploads                               */
  /* -------------------------------------------------------------------------- */
  /**
   * @param portalUploads - Dados do portal uploads
   * @example
   * await EverestDBServices.createPortalUploads({
   *   pk: '123e4567-e89b-12d3-a456-426614174000',
   *   cliente: '123e4567-e89b-12d3-a456-426614174000',
   *   created_at: new Date().toISOString(),
   *   updated_at: new Date().toISOString(),
   *   created_by: 'everest_generico@oito.com.br',
   *   updated_by: 'everest_generico@oito.com.br',
   *   data_carimbo: new Date().toISOString(),
   *   filename_original: 'teste.pdf',
   *   hash_calculado: '123e4567-e89b-12d3-a456-426614174000',
   *   identificacao: '123e4567-e89b-12d3-a456-426614174000',
   *   migrado: false,
   *   prioridade: false,
   *   processo: '123e4567-e89b-12d3-a456-426614174000',
   *   size: 100,
   *   tipo: 'pdf',
   *   origem: 'teste',
   *   s3key: '123e4567-e89b-12d3-a456-426614174000',
   *   s3bucket: 'teste',
   * });
   */
  static async createPortalUploads(portalUploads: CreatePortalUploadsInterface) {
    const methodName = `${routeName}.createPortalUploads`;
    const everestDBService = new EverestDBServices();
    const connection = await everestDBService.getConnection();
    try {
      const result = await connection.query(
        `INSERT INTO demanda.portal_uploads (
          pk, cliente, created_at, updated_at, created_by, updated_by, 
          data_carimbo, filename_original, hash_calculado, identificacao, 
          migrado, prioridade, processo, size, tipo, origem, s3key, s3bucket
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (pk) DO UPDATE SET
          cliente = EXCLUDED.cliente,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          data_carimbo = EXCLUDED.data_carimbo,
          filename_original = EXCLUDED.filename_original,
          hash_calculado = EXCLUDED.hash_calculado,
          identificacao = EXCLUDED.identificacao,
          migrado = EXCLUDED.migrado,
          prioridade = EXCLUDED.prioridade,
          processo = EXCLUDED.processo,
          size = EXCLUDED.size,
          tipo = EXCLUDED.tipo,
          origem = EXCLUDED.origem,
          s3key = EXCLUDED.s3key,
          s3bucket = EXCLUDED.s3bucket`,
        [
          portalUploads.pk,
          portalUploads.cliente,
          portalUploads.created_at,
          portalUploads.updated_at,
          portalUploads.created_by,
          portalUploads.updated_by,
          portalUploads.data_carimbo,
          portalUploads.filename_original,
          portalUploads.hash_calculado,
          portalUploads.identificacao,
          portalUploads.migrado,
          portalUploads.prioridade,
          portalUploads.processo,
          portalUploads.size,
          portalUploads.tipo,
          portalUploads.origem,
          portalUploads.s3key,
          portalUploads.s3bucket,
        ]
      );
      return result;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    } finally {
      await everestDBService.closeConnection(connection);
    }
  }
}
