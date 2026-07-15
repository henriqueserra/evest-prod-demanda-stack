import { DynamoDBServices } from './dynamodb.services';
import { EverestApoioDateTimeService } from './everest.apoio.dateTime.service';
import { EverestApoioService } from './everest.apoio.service';
import { EverestClienteServices } from './everest.cliente.services';
import { DemandaInterface, Everest2DemandaService, StatusInterface } from './everest.demanda.service';
import { EsteiraInterface, SkEmailInterface, UserInterface } from './everest.interfaces';
import { EverestLogService } from './everest.log.services';
import { EverestUserService } from './everest.user.service';
import { LambdaServices } from './lambda.services';
import { S3Service } from './s3.service';

const tableName = `Tbl${process.env.ENVIRONMENT}Demanda`;
const logService = new EverestLogService();
const routeName = 'EverestDemandasService';

export class EverestDemandasService {
  constructor() {}

  static async getStatusByPerfilDemanda({
    status_demanda,
    perfil_demanda,
  }: {
    status_demanda: string;
    perfil_demanda: string;
  }): Promise<DemandaInterface[]> {
    try {
      if (!perfil_demanda) throw new Error('perfil_demanda não informado!');
      if (!status_demanda) throw new Error('status_demanda não informado!');

      const dados = (await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'status_demanda-perfil_demanda-index',
        keyConditionExpression: 'status_demanda = :status_demanda and perfil_demanda = :perfil_demanda',
        expressionAttributeValues: {
          ':status_demanda': { S: status_demanda },
          ':perfil_demanda': { S: perfil_demanda },
          ':sk': { S: 'status::' },
          ':is_active': { BOOL: true },
        },
        filterExpression: 'sk = :sk and is_active = :is_active',
      })) as DemandaInterface[];
      return dados;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getStatusByPerfilDemanda - ${error.message}`);
    }
  }

  static async getStatusByStatusDemanda({
    status_demanda,
    cliente,
  }: {
    status_demanda: string;
    cliente: string;
  }): Promise<DemandaInterface[]> {
    try {
      if (!cliente) throw new Error('cliente não informado!');
      if (!status_demanda) throw new Error('status_demanda não informado!');

      const dados = (await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-status_demanda-index',
        keyConditionExpression: 'status_demanda = :status_demanda and cliente = :cliente',
        expressionAttributeValues: {
          ':status_demanda': { S: status_demanda },
          ':cliente': { S: cliente },
          ':sk': { S: 'status::' },
          ':is_active': { BOOL: true },
        },
        filterExpression: 'sk = :sk and is_active = :is_active',
      })) as DemandaInterface[];
      return dados;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getStatusByStatusDemanda - ${error.message}`);
    }
  }

  static async getFilaEsteiraOito({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user.OperadorOito || user.OperadorOito.length === 0) return [];

      if (user.OperadorOito.length === 0) return [];

      let demandas: DemandaInterface[] = [];

      let demandasBrutasEsteiraOito: DemandaInterface[] = [];

      let dadosBrutos = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'status_demanda-perfil_demanda-index',
        keyConditionExpression: 'status_demanda = :status_demanda',
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':status_demanda': { S: 'EsteiraOito' },
          ':is_active': { BOOL: true },
        },
      });

      demandasBrutasEsteiraOito.push(...(dadosBrutos as DemandaInterface[]));

      dadosBrutos = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'status_demanda-perfil_demanda-index',
        keyConditionExpression: 'status_demanda = :status_demanda',
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':status_demanda': { S: 'TipificacaoOito' },
          ':is_active': { BOOL: true },
        },
      });

      demandasBrutasEsteiraOito.push(...(dadosBrutos as DemandaInterface[]));

      demandasBrutasEsteiraOito = EverestApoioService.ordenaArray(demandasBrutasEsteiraOito, 'due_date');

      if (user.OperadorOitoMaster) {
        return demandasBrutasEsteiraOito;
      } else {
        demandasBrutasEsteiraOito = demandasBrutasEsteiraOito.filter((demanda) => {
          return (user.OperadorOito as string[])?.includes(demanda?.perfil_demanda);
        });
        return demandasBrutasEsteiraOito;
      }
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaEsteiraCliente({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user.OperadorCliente || user.OperadorCliente.length === 0) return [];

      if (user.OperadorCliente.length === 0) return [];

      let relacaoClientesAdmin: string[] = [];
      if (user.OperadorCliente.length > 0) relacaoClientesAdmin.push(...(user.OperadorCliente as string[]));

      relacaoClientesAdmin = EverestApoioService.removeDuplicatesFromStringArray(relacaoClientesAdmin);

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoClientesAdmin) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'EsteiraCliente',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaAuditoriaOito({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user.AdminOito || user.AdminOito.length === 0) return [];

      if (user.AdminOito.length === 0) return [];

      let relacaoClientesAdmin: string[] = [];
      if (user.AdminOito.length > 0) relacaoClientesAdmin.push(...(user.AdminOito as string[]));

      relacaoClientesAdmin = EverestApoioService.removeDuplicatesFromStringArray(relacaoClientesAdmin);

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoClientesAdmin) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'AuditoriaOito',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaAuditoriaCliente({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user.AdminCliente || user.AdminCliente.length === 0) return [];

      if (user.AdminCliente.length === 0) return [];

      let relacaoClientesAdmin: string[] = [];
      if (user.AdminCliente.length > 0) relacaoClientesAdmin.push(...(user.AdminCliente as string[]));

      relacaoClientesAdmin = EverestApoioService.removeDuplicatesFromStringArray(relacaoClientesAdmin);

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoClientesAdmin) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'AuditoriaCliente',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaTipificacaoOito({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user.OperadorOito || user.OperadorOito.length === 0) return [];

      if (user.OperadorOito.length === 0) return [];

      let demandas: DemandaInterface[] = [];

      for (const perfil_demanda of user.OperadorOito) {
        let result = await this.getStatusByPerfilDemanda({
          perfil_demanda: perfil_demanda,
          status_demanda: 'TipificacaoOito',
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaExcecao({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user?.Excecoes || user.Excecoes?.ExcecaoCliente?.length === 0) return [];

      let relacaoClientesExcecao: string[] = user.Excecoes.ExcecaoCliente;

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoClientesExcecao) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'Excecao',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaExcecaoOito({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user?.Excecoes || user?.Excecoes?.ExcecaoOito?.length === 0) return [];

      let relacaoOitosExcecao: string[] = user.Excecoes.ExcecaoOito;

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoOitosExcecao) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'ExcecaoOito',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getFilaExcecaoSistemica({ userEmail }: { userEmail: string }): Promise<DemandaInterface[]> {
    try {
      const userService = new EverestUserService(userEmail);

      const user: UserInterface = await userService.getUser();

      if (!user?.Excecoes || user?.Excecoes?.ExcecaoOito?.length === 0) return [];

      let relacaoOitosExcecao: string[] = user.Excecoes.ExcecaoOito;

      let demandas: DemandaInterface[] = [];

      for (const cliente of relacaoOitosExcecao) {
        const result = await this.getStatusByStatusDemanda({
          status_demanda: 'ExcecaoSistemica',
          cliente: cliente,
        });
        demandas.push(...result);
      }

      return demandas;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getDemandaByProcesso({
    processo,
    cliente,
  }: {
    processo: string;
    cliente: string;
  }): Promise<StatusInterface[]> {
    try {
      if (processo.length < 5) return [];
      const results = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-processo-index',
        keyConditionExpression: 'cliente = :cliente and begins_with (processo,:processo)',
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':processo': { S: processo },
          ':is_active': { BOOL: true },
        },
      });
      return results as StatusInterface[];
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getDemandaByCodNup({
    codNup,
    cliente,
  }: {
    codNup: string;
    cliente: string;
  }): Promise<StatusInterface[]> {
    try {
      if (codNup.length < 4) return [];
      const results = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-cod_nup-index',
        keyConditionExpression: 'cliente = :cliente and cod_nup = :cod_nup',
        // filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':cod_nup': { S: codNup },
          // ':is_active': { BOOL: true },
        },
      });
      return results as StatusInterface[];
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getDemandaByIdCliente({
    idCliente,
    cliente,
  }: {
    idCliente: string;
    cliente: string;
  }): Promise<StatusInterface[]> {
    try {
      if (idCliente.length < 1) return [];
      const results = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-id_cliente-index',
        keyConditionExpression: 'cliente = :cliente and id_cliente = :id_cliente',
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':id_cliente': { S: idCliente },
          ':is_active': { BOOL: true },
        },
      });
      return results as StatusInterface[];
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getDemandaDadosByProcesso({ processo, cliente }: { processo: string; cliente: string }) {
    const methodName = 'getDemandaDadpsByProcesso';
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado` as string,
        indexName: 'cliente-sk-index',
        keyConditionExpression: 'cliente = :cliente and begins_with (sk,:sk)',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':sk': { S: `processo::${processo}` },
        },
      });
      if (!dados) return [];
      return dados?.map((item) => item.pk);
    } catch (error: any) {
      debugger;

      throw new Error(`EverestDemandasService.${methodName} :: ${error.message}`);
    }
  }

  static async getDemandaDadosByIdentificacao({ identificacao, cliente }: { identificacao: string; cliente: string }) {
    const methodName = 'getDemandaDadpsByIdentificacao';
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado` as string,
        indexName: 'cliente-sk-index',
        keyConditionExpression: 'cliente = :cliente and begins_with (sk,:sk)',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':sk': { S: `identificacao::${identificacao}` },
        },
      });
      if (!dados) return [];
      return dados?.map((item) => item.pk);
    } catch (error: any) {
      debugger;

      throw new Error(`EverestDemandasService.${methodName} :: ${error.message}`);
    }
  }

  static async getDemandaDadosByDataCarimbo({
    dataInicial,
    dataFinal,
    cliente,
  }: {
    dataInicial: string;
    dataFinal: string;
    cliente: string;
  }) {
    const methodName = 'getDemandaDadosByDataCarimbo';
    try {
      const dataCarimboInicial = `data_carimbo::${dataInicial}`;
      const dataCarimboFinal = `data_carimbo::${dataFinal}`;
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado` as string,
        indexName: 'cliente-sk-index',
        keyConditionExpression: 'cliente = :cliente and sk between :dataInicial and :dataFinal',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':dataInicial': { S: dataCarimboInicial },
          ':dataFinal': { S: dataCarimboFinal },
        },
      });
      if (!dados) return [];
      return dados?.map((item) => item.pk);
    } catch (error: any) {
      debugger;

      throw new Error(`EverestDemandasService.${methodName} :: ${error.message}`);
    }
  }

  static async getDemandaByIdentificacao({ identificacao, cliente }: { identificacao: string; cliente: string }) {
    try {
      if (identificacao.length < 5) return [];
      const results = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-identificacao-index',
        keyConditionExpression: 'cliente = :cliente and begins_with (identificacao,:identificacao)',
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':identificacao': { S: identificacao },
          ':is_active': { BOOL: true },
        },
      });
      return results as StatusInterface[];
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  static async getEstatisticasByStatusDemanda({
    cliente,
  }: {
    cliente: string;
  }): Promise<{ status_demanda: string; registros: number }[]> {
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda` as string,
        indexName: 'cliente-status_demanda-index',
        keyConditionExpression: 'cliente = :cliente',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':is_active': { BOOL: true },
        },
        filterExpression: 'is_active = :is_active',
        projectionExpression: 'status_demanda',
      });
      const status_demanda_unicos = Array.from(new Set(dados.map((item) => item.status_demanda)));
      let response: { status_demanda: string; registros: number }[] = [];
      for (const status_demanda of status_demanda_unicos) {
        const registros = dados.filter((item) => item.status_demanda === status_demanda).length;
        response.push({ status_demanda, registros });
      }
      return response;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getEstatisticasByStatusDemanda - ${error.message}`);
    }
  }

  static async getDemandasEstacionadasDetalhadas({
    cliente,
  }: {
    cliente: string;
  }): Promise<{ cliente: string; status_demanda: string; pk: string }[]> {
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda` as string,
        indexName: 'cliente-status_demanda-index',
        keyConditionExpression: 'cliente = :cliente',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':is_active': { BOOL: true },
        },
        filterExpression: 'is_active = :is_active',
      });

      const twoMinutesToNow = EverestApoioDateTimeService.addMinutesToDate({
        initialDate: new Date(),
        minutes: -2,
      });

      const statusLegitimos = [
        'EsteiraOito',
        'EsteiraCliente',
        'AuditoriaOito',
        'AuditoriaCliente',
        'TipificacaoOito',
        'Excecao',
        'ExcecaoOito',
        'EmailEnviado',
        'FinalizadoAutomatico',
        'Finalizado',
      ];

      let demandasEstacionadas = dados.filter((item) => new Date(item.updated_at) < twoMinutesToNow);
      demandasEstacionadas = demandasEstacionadas.filter((item) => !statusLegitimos.includes(item.status_demanda));

      const response = demandasEstacionadas.map((item) => {
        return {
          cliente: cliente,
          status_demanda: item.status_demanda,
          pk: item.pk,
        };
      });

      return response;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getEstatisticasByStatusDemanda - ${error.message}`);
    }
  }

  static async getDemandasEstacionadasConsolidadas({
    cliente,
  }: {
    cliente: string;
  }): Promise<{ cliente: string; status_demanda: string; registros: number }[]> {
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda` as string,
        indexName: 'cliente-status_demanda-index',
        keyConditionExpression: 'cliente = :cliente',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':is_active': { BOOL: true },
        },
        filterExpression: 'is_active = :is_active',
      });

      const twoMinutesToNow = EverestApoioDateTimeService.addMinutesToDate({
        initialDate: new Date(),
        minutes: -2,
      });

      const statusLegitimos = [
        'EsteiraOito',
        'EsteiraCliente',
        'AuditoriaOito',
        'AuditoriaCliente',
        'TipificacaoOito',
        'Excecao',
        'ExcecaoOito',
        'EmailEnviado',
        'FinalizadoAutomatico',
        'Finalizado',
      ];

      let demandasEstacionadas = dados.filter((item) => new Date(item.updated_at) < twoMinutesToNow);
      demandasEstacionadas = demandasEstacionadas.filter((item) => !statusLegitimos.includes(item.status_demanda));
      const status_demanda_unicos = Array.from(new Set(demandasEstacionadas.map((item) => item.status_demanda)));
      let response: {
        cliente: string;
        status_demanda: string;
        registros: number;
      }[] = [];

      for (const status_demanda of status_demanda_unicos) {
        const registros = dados.filter((item) => item.status_demanda === status_demanda).length;
        response.push({ cliente: cliente, status_demanda, registros });
      }

      return response;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getEstatisticasByStatusDemanda - ${error.message}`);
    }
  }

  static async getProximaDemanda({ userEmail }: { userEmail: string }): Promise<any> {
    try {
      if (!userEmail) throw new Error('userEmail não informado');

      let demandasBrutasEsteiraOito = await EverestDemandasService.getFilaEsteiraOito({ userEmail });

      let proximaDemanda = demandasBrutasEsteiraOito.find((demanda) => demanda.usuario_atuando === userEmail);

      if (proximaDemanda?.pk) return proximaDemanda.pk;
      //
      proximaDemanda = demandasBrutasEsteiraOito.find((demanda) => !demanda?.usuario_atuando);
      //
      if (!proximaDemanda?.pk) {
        return '';
      } else return proximaDemanda.pk;
      //
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getProximaDemanda - ${error.message}`);
    }
  }

  static async clearUsuarioAtuandoEsteiraOito(userEmail: string) {
    const methodName = `${routeName}.clearUsuarioAtuandoEsteiraOito`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const clientes = await EverestClienteServices.getClientes();
      // Esteira Oito
      for (const cliente of clientes) {
        const dados = await DynamoDBServices.queryItems({
          tableName: tableName as string,
          indexName: 'cliente-status_demanda-index',
          keyConditionExpression: 'cliente = :cliente and status_demanda = :status_demanda',
          expressionAttributeValues: {
            ':cliente': { S: cliente.cliente },
            ':status_demanda': { S: 'EsteiraOito' },
            ':usuario_atuando': { S: userEmail },
          },
          filterExpression: 'usuario_atuando = :usuario_atuando',
        });
        for (const item of dados) {
          const pkService = new Everest2DemandaService({ pk: item.pk });
          await pkService.updateStatus({
            updated_by: userEmail,
            usuario_atuando: '',
          });
        }
      }

      // Esteira Oito
      for (const cliente of clientes) {
        const dados = await DynamoDBServices.queryItems({
          tableName: tableName as string,
          indexName: 'cliente-status_demanda-index',
          keyConditionExpression: 'cliente = :cliente and status_demanda = :status_demanda',
          expressionAttributeValues: {
            ':cliente': { S: cliente.cliente },
            ':status_demanda': { S: 'TipificacaoOito' },
            ':usuario_atuando': { S: userEmail },
          },
          filterExpression: 'usuario_atuando = :usuario_atuando',
        });
        for (const item of dados) {
          const pkService = new Everest2DemandaService({ pk: item.pk });
          await pkService.updateStatus({
            updated_by: userEmail,
            usuario_atuando: '',
          });
        }
      }

      debugger;
      logService.info({ message: `Finalizado ...`, method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  static formataItensEsteira(itensTotais: any): EsteiraInterface[] {
    return itensTotais.map((item: any) => {
      const itemFormatado: EsteiraInterface = {
        id: item.pk,
        cliente: item.cliente,
        processo: item.processo || '',
        identificacao: item.identificacao || '',
        usuario_atuando: item.usuario_atuando || '',
        data_recebimento: item.data_carimbo,
        due_date: item.due_date,
        prioridade: item.prioridade,
        tipo: item.perfil_demanda || '',
        demanda: item.tipo_demanda || '',
        status: item.status_demanda || '',
      };
      return itemFormatado;
    });
  }

  static formataItensEsteiraExcecao(itensTotais: any): EsteiraInterface[] {
    return itensTotais.map((item: any) => {
      const itemFormatado: EsteiraInterface = {
        id: item.pk,
        cliente: item.cliente,
        processo: item.processo || '',
        identificacao: item.identificacao || '',
        usuario_atuando: item.usuario_atuando || '',
        data_recebimento: item.data_carimbo,
        due_date: item.due_date,
        prioridade: item.prioridade,
        tipo: item.status_demanda || '',
        demanda: item.tipo_demanda || '',
        status: item.status_demanda || '',
      };
      return itemFormatado;
    });
  }

  static async processoExiste({ processo, cliente }: { processo: string; cliente: string }): Promise<boolean> {
    const dados = await DynamoDBServices.queryItems({
      tableName: tableName as string,
      indexName: 'cliente-processo-index',
      keyConditionExpression: 'cliente = :cliente and processo = :processo',
      filterExpression: 'is_active = :is_active',
      expressionAttributeValues: {
        ':cliente': { S: cliente },
        ':processo': { S: processo },
        ':is_active': { BOOL: true },
      },
    });
    return dados.length > 0;
  }

  static async createStatus({ payload }: { payload: StatusInterface }) {
    const methodName = `${routeName}.createStatus`;
    try {
      const result = await DynamoDBServices.putItem({
        tableName: tableName as string,
        item: payload,
      });

      const payloadEvento = {
        pk: payload.pk,
        cliente: payload.cliente,
        created_by: payload.created_by,
        created_at: new Date().toISOString(),
        origem: payload.origem ?? `everest-${process.env.ENVIRONMENT}-demanda-stack.CreatePk`,
        sk: 'NovaDemanda',
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payloadEvento,
      });
      logService.info({ message: `Status ${payload.pk} criado com sucesso`, method: methodName });
      return result;
    } catch (error: any) {
      debugger;
      throw error;
    }
  }

  static async getDadosDeCapaPlataformaColeta({ codNup }: { codNup: string }) {
    const methodName = `${routeName}.getDadosDeCapaPlataformaColeta`;
    try {
      const query = `select * from processo.nup where cod_nup = ${codNup};`;

      const response = await LambdaServices.invokeLambda({
        lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
        payload: query as string,
      });

      logService.info({ message: `Finalizado ...`, method: methodName });
      return response?.rows[0] ?? {};
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  static async getPartes({ codNup }: { codNup: string }) {
    const query = `select * from processo.nup_parte where cod_nup = ${codNup}`;
    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (!response.rows.length) return [];

    return response.rows;
  }

  static async getReu({ codNup }: { codNup: string }) {
    const query = `select * from processo.nup_reu where cod_nup = ${codNup}`;
    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (!response.rows.length) return [];

    return response.rows;
  }

  static async updatePlataformaColetaDistribuidos({
    cod_nup,
    ind_importado_everest,
  }: {
    cod_nup: string;
    ind_importado_everest: boolean;
  }) {
    const query = `UPDATE processo.nup SET ind_importado_everest = ${ind_importado_everest} WHERE cod_nup = ${cod_nup} ;`;

    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (response?.rowCount > 0) {
      logService.info({
        message: `Registro cod_nup ${cod_nup} atualizado com sucesso`,
        method: 'updatePlataformaColeta',
      });
      return true;
    }

    return false;
  }

  static async updatePlataformaColetaDJe({
    cod_citacao_dado,
    ind_conferido_contencioso,
  }: {
    cod_citacao_dado: string;
    ind_conferido_contencioso: boolean;
  }) {
    const query = `UPDATE captadores.citacao_dado SET ind_conferido_contencioso = ${ind_conferido_contencioso} WHERE cod_citacao_dado = ${cod_citacao_dado} ;`;

    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (response?.rowCount > 0) {
      logService.info({
        message: `Registro cod_nup ${cod_citacao_dado} atualizado com sucesso`,
        method: 'updatePlataformaColeta',
      });
      return true;
    }

    return false;
  }

  static async inativaPlataformaColetaDJe({
    cod_citacao_dado,
    ind_status_registro,
  }: {
    cod_citacao_dado: string;
    ind_status_registro: boolean;
  }) {
    const query = `UPDATE captadores.citacao_dado SET ind_status_registro = ${ind_status_registro} WHERE cod_citacao_dado = ${cod_citacao_dado} ;`;

    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (response?.rowCount > 0) {
      logService.info({
        message: `Registro cod_nup ${cod_citacao_dado} desabilitado com sucesso`,
        method: 'updatePlataformaColeta',
      });
      return true;
    }

    return false;
  }

  static async updatePlataformaColetaProcon({
    cod_regulatorio_dado,
    ind_conferido_contencioso,
  }: {
    cod_regulatorio_dado: string;
    ind_conferido_contencioso: boolean;
  }) {
    const query = `UPDATE captadores.regulatorio_dado SET ind_conferido_contencioso = ${ind_conferido_contencioso} WHERE cod_regulatorio_dado = ${cod_regulatorio_dado} ;`;

    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (response?.rowCount > 0) {
      logService.info({
        message: `Registro cod_regulatorio_dado ${cod_regulatorio_dado} atualizado com sucesso`,
        method: 'updatePlataformaColeta',
      });
      return true;
    }

    return false;
  }
  // captadores.proconsumidor_dado

  static async updatePlataformaColetaProconsumidor({
    cod_proconsumidor_dado,
    ind_conferido_plataforma,
  }: {
    cod_proconsumidor_dado: string;
    ind_conferido_plataforma: boolean;
  }) {
    const query = `UPDATE captadores.proconsumidor_dado SET ind_conferido_plataforma = ${ind_conferido_plataforma} WHERE cod_proconsumidor_dado = ${cod_proconsumidor_dado} ;`;

    const response = await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery` as string,
      payload: query as string,
    });

    if (response?.rowCount > 0) {
      logService.info({
        message: `Registro cod_proconsumidor_dado ${cod_proconsumidor_dado} atualizado com sucesso`,
        method: 'updatePlataformaColeta',
      });
      return true;
    }

    return false;
  }

  static async getDemandasPorUsuarioAtuando({
    userEmail,
    statusDemanda,
  }: {
    userEmail: string;
    statusDemanda: string;
  }) {
    const methodName = `${routeName}.getDemandasPorUsuarioAtuando`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const dadosBrutos = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda` as string,
        indexName: 'status_demanda-perfil_demanda-index',
        keyConditionExpression: 'status_demanda = :status_demanda',
        expressionAttributeValues: {
          ':status_demanda': { S: statusDemanda },
        },
      });

      const dadosFiltrados = dadosBrutos.filter((item) => item.usuario_atuando === userEmail);

      return dadosFiltrados;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(error.message);
    }
  }

  static async getProcessoDuplicado({ processo, cliente }: { processo: string; cliente: string }) {
    const methodName = `${routeName}.getProcessoDuplicado`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const dados = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda` as string,
        indexName: 'cliente-processo-index',
        keyConditionExpression: 'cliente = :cliente and processo = :processo',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':processo': { S: processo },
        },
      });

      if (dados.length > 1) {
        return true;
      }

      // debugger;
      logService.info({ message: `Finalizado ...`, method: methodName });
      return false;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  static async concatenaDemandas({ demandaMaior, demandaMenor }: { demandaMaior: string; demandaMenor: string }) {
    const methodName = `${routeName}.concatenaDemandas`;
    logService.info({ message: `Iniciado ...`, method: methodName });
    try {
      const pkServiceMaior = new Everest2DemandaService({ pk: demandaMaior });
      const pkServiceMenor = new Everest2DemandaService({ pk: demandaMenor });

      await pkServiceMaior.getStatus();
      await pkServiceMenor.getStatus();
      const arquivosMenor = await pkServiceMenor.getDemandaDadoArquivos();

      for (const arquivo of arquivosMenor) {
        let buffer = await S3Service.s3GetObject({
          s3Key: arquivo.value.s3Key,
          s3Bucket: arquivo.value.s3Bucket,
        });

        let file_name = arquivo.value.file_name;
        let s3Bucket = arquivo.value.s3Bucket;
        let s3Key = `Booking/${demandaMaior}/${file_name}`;

        await S3Service.s3PutObject({
          s3Key,
          s3Bucket,
          buffer,
        });

        await pkServiceMaior.createDemandaDadoArquivo({
          created_by: arquivo.created_by,
          value: {
            s3Bucket,
            s3Key,
            file_name,
          },
        });
      }
      await pkServiceMenor.deleteDemanda();

      logService.info({ message: `Finalizado ...`, method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  static async getDemandaByEmail({ email, cliente }: { email: string; cliente: string }): Promise<SkEmailInterface[]> {
    try {
      const results = await DynamoDBServices.queryItems({
        tableName: tableName,
        indexName: 'cliente-sk-index',
        keyConditionExpression: 'cliente = :cliente and sk = :sk',
        expressionAttributeValues: {
          ':cliente': { S: cliente },
          ':sk': { S: `email::${email}` },
        },
      });
      return results as SkEmailInterface[];
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`${error.message}`);
    }
  }
}
