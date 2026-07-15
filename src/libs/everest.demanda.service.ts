import { EverestClienteService } from './everest.cliente.service';
import { S3Service } from './s3.service';
import { DynamoDBServices } from './dynamodb.services';
import { ArquivoInterface, PayloadOriginalInterface } from './everest.interfaces';

import { GmailService } from './gmail.service';

import { EverestApoioService } from './everest.apoio.service';
import { z } from 'zod';
import { EverestLogService } from './everest.log.services';
import { EverestUserService } from './everest.user.service';
import { SqsServices } from './sqs.services';
import { EverestSesServices } from './everest.ses.service';

const routeName = 'Everest2DemandaService';
const logService = new EverestLogService();

export class Everest2DemandaService {
  private readonly tableName: string;
  public status!: StatusInterface;
  public pk: string;
  constructor({ pk }: { pk: string }) {
    this.pk = pk;
    this.tableName = `Tbl${process.env.ENVIRONMENT}Demanda`;
  }

  async getStatus(): Promise<StatusInterface> {
    try {
      const status = await DynamoDBServices.getItem({
        pk: this.pk,
        sk: 'status::',
        tableName: this.tableName,
      });
      if (!status.pk) throw new Error('Demanda não encontrada');
      // if (!status?.is_active) throw new Error('Status inativo');
      this.status = status as StatusInterface;
      return status as StatusInterface;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(error.message);
    }
  }

  async getPayloadOriginal(): Promise<PayloadOriginalInterface> {
    try {
      // await this.getStatus();

      const itens = await DynamoDBServices.queryItems({
        tableName: this.tableName,
        keyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        expressionAttributeValues: {
          ':pk': { S: this.pk },
          ':sk': { S: 'payload_original::' },
        },
      });
      if (!itens) throw new Error('Payload não encontrado');
      return itens[0] as PayloadOriginalInterface;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(error.message);
    }
  }

  async updateStatus(payload: UpdateStatusInterface) {
    try {
      await this.getStatus();

      const oldStatus = { ...this.status };

      if (!payload.updated_by) payload.updated_by = 'Everest2DemandaService.updateStatus';

      if (payload.status_demanda && payload.status_demanda !== this.status.status_demanda) {
        console.info(
          `${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - Atualizando status_demanda de ${
            this.status.status_demanda
          } para ${payload.status_demanda}`
        );
      }

      if (payload.nova_observacao) {
        const observacao = {
          mensagem: payload.nova_observacao,
          criada_em: new Date().toISOString(),
          criada_por: payload.updated_by,
        };
        if (!this.status.observacao) this.status.observacao = [];
        this.status.observacao.push({ ...observacao });
      }

      if (payload.novo_historico) {
        const historico = {
          mensagem: payload.novo_historico,
          criado_em: new Date().toISOString(),
          criado_por: payload.updated_by,
        };
        if (!this.status.historico) this.status.historico = [];
        this.status.historico.push(historico);
      }

      delete payload.nova_observacao;
      delete payload.novo_historico;
      /* -------------------------------------------------------------------------- */

      let novoStatus = {
        ...this.status,
        ...payload,
        updated_at: new Date().toISOString(),
      } as StatusInterface;

      if (oldStatus.status_demanda !== novoStatus.status_demanda) {
        novoStatus.historico = this.atualizaHistorico({
          oldStatus,
          newStatus: novoStatus,
        });

        // novoStatus.status_demanda_anterior = this.atualizaStatusAnterior({
        //   oldStatus,
        //   newStatus: novoStatus,
        // });
      }

      const diff = await EverestApoioService.jsonDiff({
        oldJson: oldStatus,
        newJson: novoStatus,
      });
      // se diff.newToOld só possuir 1 atributo e se o atributo for updated_at
      if (Object.keys(diff.newToOld).length === 1 && Object.keys(diff.newToOld)[0] === 'updated_at') {
        return novoStatus as StatusInterface;
      }

      await DynamoDBServices.putItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
        item: novoStatus,
      });

      await this.getStatus();

      return novoStatus as StatusInterface;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(error.message);
    }
  }

  async sendToPosIntegracao() {
    await this.getStatus();
    await this.updateStatus({
      updated_by: 'Everest2DemandaService.sendToPosIntegracao',
      status_demanda: 'PosIntegracao',
    });
  }

  async createPayloadOriginal(payload: { origem: string; created_by: string; payload: any; [key: string]: any }) {
    await this.getStatus();

    return await DynamoDBServices.putItem({
      tableName: this.tableName,
      item: {
        ...payload,
        sk: `payload_original::${payload.origem}`,
        pk: this.pk,
        cliente: this.status.cliente,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: payload.created_by,
      },
    });
  }

  async getClienteService() {
    await this.getStatus();
    return new EverestClienteService({ clienteName: this.status.cliente });
  }

  async inativaDemanda(payload: { updated_by: string; nova_observacao: string; [key: string]: any }) {
    await this.getStatus();
    if (!payload.updated_by) throw new Error('updated_by não informado');
    if (!payload.nova_observacao) throw new Error('nova_observacao não informado');

    await this.updateStatus({
      status_demanda: 'Inativo',
      is_active: false,
      updated_by: payload.updated_by,
      nova_observacao: payload.nova_observacao,
    });
    console.info(`Demanda ${this.pk} inativada com sucesso`);
    return await this.getStatus();
  }

  async deleteDemanda() {
    await this.getStatus();

    const arquivosDados = await this.getDemandaDadoByCampo({
      campo: 'arquivo',
    });
    for (const arquivoDado of arquivosDados) {
      await S3Service.s3DeleteObject({
        s3Bucket: arquivoDado.value.s3Bucket,
        s3Key: arquivoDado.value.s3Key,
      });
    }

    let dados = await DynamoDBServices.queryItems({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
      },
    });

    for (const dado of dados) {
      await DynamoDBServices.deleteItem({
        tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
        item: { pk: this.pk, sk: dado.sk },
      });
    }

    const arquivos: DemandaDadoArquivoInterface[] = await this.getDemandaDadoArquivos();

    await arquivos.map(async (arquivo) => {
      try {
        await S3Service.s3DeleteObject({
          s3Bucket: arquivo.value.s3Bucket,
          s3Key: arquivo.value.s3Key,
        });
        console.info(`Arquivo ${arquivo.value.s3Key} deletado com sucesso`);
      } catch (error: any) {
        console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      }
    });

    dados = await DynamoDBServices.queryItems({
      tableName: this.tableName,
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
      },
    });

    for (const dado of dados) {
      await DynamoDBServices.deleteItem({
        tableName: this.tableName,
        item: { pk: this.pk, sk: dado.sk },
      });
    }

    console.info(`Demanda ${this.pk} deletada com sucesso`);
    return;
  }

  async deleteArquivo({ sk }: { sk: string }) {
    await this.getStatus();
    if (!sk) throw new Error('sk não informado');
    const arquivo = await this.getDemandaDadoArquivo({ sk });
    await S3Service.s3DeleteObject({
      s3Bucket: arquivo.value.s3Bucket,
      s3Key: arquivo.value.s3Key,
    });

    const fileName = arquivo.value.file_name;

    await DynamoDBServices.deleteItem({
      tableName: this.tableName,
      item: { pk: this.pk, sk: sk },
    });

    await DynamoDBServices.deleteItem({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      item: { pk: this.pk, sk: `arquivo::${fileName}` },
    });

    console.info(`Arquivo ${sk} deletado com sucesso`);
  }

  async createSk(payload: { sk: string; created_by: string; [key: string]: any }) {
    await this.getStatus();
    if (!payload.sk) throw new Error('sk não informado');
    return await DynamoDBServices.putItem({
      tableName: this.tableName,
      item: {
        ...payload,
        pk: this.pk,
        cliente: this.status.cliente,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: payload.created_by,
        updated_by: payload.created_by,
      },
    });
  }

  async getDadosCompletos() {
    await this.getStatus();
    const itens = await DynamoDBServices.queryItems({
      tableName: this.tableName,
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
      },
    });
    return itens as any[];
  }

  async createDemandaDado(payload: DemandaDadoInterface): Promise<void> {
    const methodName = `${routeName}.createDemandaDado`;

    await this.getStatus();
    payload.pk = this.pk;
    payload.cliente = this.status.cliente;
    payload.created_at = payload.created_at || new Date().toISOString();
    payload.audited = payload.audited || false;
    await DynamoDBServices.putItem({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      item: payload,
    });

    logService.info({ message: `DemandaDado ${payload.pk} => ${payload.sk} criado com sucesso`, method: methodName });
  }

  async createClearDemandaDado(payload: DemandaDadoInterface): Promise<void> {
    await this.getStatus();
    const oldDemandaDados = await this.getDemandaDadoBySk({ sk: payload.sk });
    // Remover de oldDemandaDados os atributos created_at e Updated_at
    delete oldDemandaDados.created_at;
    delete oldDemandaDados.updated_at;
    delete oldDemandaDados.audited;

    payload.pk = this.pk;
    payload.cliente = this.status.cliente;

    const newDemandaDados = { ...payload };
    delete newDemandaDados.created_at;
    delete newDemandaDados.updated_at;

    const diff = await EverestApoioService.jsonDiff({
      oldJson: oldDemandaDados,
      newJson: newDemandaDados,
    });
    if (Object.keys(diff.newToOld).length === 0) return;

    payload.created_at = payload.created_at || new Date().toISOString();
    payload.audited = payload.audited || false;
    await this.deleteDemandaDadoByCampo({ campo: payload.name });

    await DynamoDBServices.putItem({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      item: payload,
    });
    console.info(`DemandaDado ${payload.pk} => ${payload.sk} criado com sucesso`);
  }

  private atualizaHistorico({ oldStatus, newStatus }: { oldStatus: StatusInterface; newStatus: StatusInterface }):
    | {
        mensagem: string;
        criado_em: string;
        criado_por: string;
      }[]
    | [] {
    try {
      const oldStatusDemanda = oldStatus.status_demanda;
      const newStatusDemanda = newStatus.status_demanda;

      if (oldStatusDemanda === newStatusDemanda) return newStatus.historico || [];

      const newHistorico = {
        mensagem: `${oldStatusDemanda} => ${newStatusDemanda}`,
        criado_em: new Date().toISOString(),
        criado_por: newStatus.updated_by,
      };

      if (!newStatus.historico) newStatus.historico = [];

      newStatus.historico.push(newHistorico);

      return newStatus.historico;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`atualizaHistorico - ${error.message}`);
    }
  }

  async getDadosParaConsulta(): Promise<any> {
    let response: any = {};
    // await this.getStatus();
    const itens = await DynamoDBServices.queryItems({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
      },
    });

    for (const element of itens) {
      if (element.sk.includes('api_')) continue;
      if (element.sk.includes('arquivo::')) continue;
      if (element.sk.includes('emails::')) continue;
      if (element.sk.includes('partes::')) continue;
      if (element.sk.includes('contrato::')) continue;
      if (element.sk.includes('portfolio::')) continue;
      if (element.sk.includes('exequente::')) continue;
      if (element.sk.includes('exequentes::')) continue;
      if (element.sk.includes('lista_autores::')) continue;
      if (element.sk.includes('lista_pedidos::')) continue;
      if (element.sk.includes('lista_reus::')) continue;
      process.env.ENVIRONMENT === 'Dev' &&
        console.info(
          `${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${this.pk} hidrated ${
            element.name
          }`
        );
      response[element.name] = element.value;
    }

    const interacoesApi = itens.filter((item) => item.sk.includes('api_'));

    let tiposInteracoesApi = interacoesApi.map((item) => item.name);

    tiposInteracoesApi = EverestApoioService.removeDuplicatesFromStringArray(tiposInteracoesApi);
    let interacoesUnicas: any = {};
    for (const element of tiposInteracoesApi) {
      let interacoesTemp = interacoesApi.filter((item) => item.name === element);
      interacoesTemp = EverestApoioService.ordenaArray(interacoesTemp, 'created_at');
      interacoesUnicas[element] = interacoesTemp[interacoesTemp.length - 1];
    }

    if (interacoesUnicas) response.api = interacoesUnicas;

    const arquivos = await this.getDemandaDadoByCampo({ campo: 'arquivo' });

    if (arquivos.length > 0) {
      response.arquivos = arquivos.map((arquivo) => {
        return {
          sk: arquivo.sk,
          s3key: arquivo.value.s3Key,
          file_name: arquivo.value.file_name,
          s3Bucket: arquivo.value.s3Bucket,
          file_size: arquivo.value.file_size,
          tipo: arquivo?.value?.tipo || '',
        };
      });
    }

    const emails = await this.getDemandaDadoByCampo({ campo: 'emails' });

    if (emails && emails.length > 0) {
      response.emails = emails.map((email) => {
        return email.value;
      });
    }

    const partes = await this.getDemandaDadoByCampo({ campo: 'partes' });

    if (partes && partes.length > 0) {
      response.partes = partes.map((parte) => {
        return parte.value;
      });
    }

    const contrato = await this.getDemandaDadoByCampo({ campo: 'contrato' });

    if (contrato && contrato.length > 0) {
      response.contrato = contrato.map((parte) => {
        return parte.value;
      });
    }

    const portfolio = await this.getDemandaDadoByCampo({ campo: 'portfolio' });

    if (portfolio && portfolio.length > 0) {
      response.portfolio = portfolio.map((parte) => {
        return parte.value;
      });
    }

    const exequente = await this.getDemandaDadoByCampo({ campo: 'exequente' });

    if (exequente && exequente.length > 0) {
      response.exequente = exequente.map((parte) => {
        return parte.value;
      });
    }

    const exequentes = await this.getDemandaDadoByCampo({ campo: 'exequentes' });

    if (exequentes && exequentes.length > 0) {
      response.exequentes = exequentes.map((parte) => {
        return parte.value;
      });
    }

    const listaAutores = await this.getDemandaDadoByCampo({ campo: 'lista_autores' });

    if (listaAutores && listaAutores.length > 0) {
      response.lista_autores = listaAutores.map((parte) => {
        return parte.value;
      });
    }

    const listaPedidos = await this.getDemandaDadoByCampo({ campo: 'lista_pedidos' });

    if (listaPedidos && listaPedidos.length > 0) {
      response.lista_pedidos = listaPedidos.map((parte) => {
        return parte.value;
      });
    }

    const listaReus = await this.getDemandaDadoByCampo({ campo: 'lista_reus' });

    if (listaReus && listaReus.length > 0) {
      response.lista_reus = listaReus.map((parte) => {
        return parte.value;
      });
    }
    response.pk = this.status.pk;
    response.created_at = this.status.created_at;
    response.updated_at = this.status.updated_at;
    response.updated_by = this.status.updated_by;
    response.created_by = this.status.created_by;
    response.cliente = this.status.cliente;
    response.status_demanda = this.status.status_demanda;
    response.data_carimbo = this.status.data_carimbo;
    response.due_date = this.status.due_date;
    response.id_cliente = this.status.id_cliente;
    response.identificacao = this.status.identificacao;
    response.processo = EverestApoioService.apenasNumeros(this.status.processo || '') || '';
    response.usuario_atuando = this.status.usuario_atuando;
    response.tipo_demanda = this.status.tipo_demanda || '';
    response.observacao = this.status.observacao;
    response.historico = this.status.historico;
    response.perfil_demanda = this.status.perfil_demanda || '';

    return response;
  }

  async getDemandaDados(): Promise<{
    status: StatusInterface;
    dados: DemandaDadoInterface[];
  }> {
    // await this.getStatus();
    const itens = await DynamoDBServices.queryItems({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      keyConditionExpression: 'pk = :pk',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
      },
    });

    let dados: any = {};
    dados = itens.map((item) => {
      return { name: item.name, value: item.value };
    });
    return { status: this.status, dados: dados };
  }

  async getDemandaDadoByCampo({ campo }: { campo: string }): Promise<DemandaDadoInterface[]> {
    // await this.getStatus();
    const itens = (await DynamoDBServices.queryItems({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      keyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
        ':sk': { S: `${campo}::` },
      },
    })) as DemandaDadoInterface[];

    // let dados: any = {};
    // dados = itens.map((item) => {
    //   return { name: item.name, value: item.value };
    // });
    return itens;
  }

  async getDemandaDadoBySk({ sk }: { sk: string }): Promise<DemandaDadoInterface> {
    // await this.getStatus();
    const item = (await DynamoDBServices.getItemKey({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      key: { pk: this.pk, sk: sk },
    })) as DemandaDadoInterface;
    return item;
  }

  async getDemandaDadoByCampoSimples({ campo }: { campo: string }): Promise<DemandaDadoInterface> {
    try {
      const dados = await this.getDemandaDadoByCampo({ campo });
      if (dados.length === 0) return {} as DemandaDadoInterface;
      return dados[0];
    } catch (error: any) {
      debugger;
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getDemandaDadoByCampoSimples - ${error.message}`);
    }
  }

  async deleteDemandaDadoByCampo({ campo }: { campo: string }) {
    const registros = await this.getDemandaDadoByCampo({ campo });
    for (const registro of registros) {
      await this.deleteDemandaDadoBySk({ sk: registro.sk });
    }
  }

  async deleteDemandaDadoBySk({ sk }: { sk: string }) {
    await DynamoDBServices.deleteItem({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      item: { pk: this.pk, sk: sk },
    });
    console.info(`DemandaDado ${this.pk} => ${sk} deletado com sucesso`);
  }

  async createDemandaDadoArquivo({ created_by, value }: CreateDemandaDadoArquivoInterface) {
    const methodName = `${routeName}.createDemandaDadoArquivo`;

    const payload = createDemandaDadoArquivoSchema.parse({ created_by, value });

    await this.getStatus();

    const fileAttributes = (await S3Service.s3GetObjectAttributes({
      s3Bucket: value?.s3Bucket ?? 'undefined',
      s3Key: value?.s3Key ?? 'undefined',
    })) as any;

    const payloadArquivo: DemandaDadoArquivoInterface = {
      sk: `arquivo::${value?.file_name || fileAttributes.fileName}`,
      cliente: this.status.cliente,
      created_at: new Date().toISOString(),
      created_by: created_by ?? 'undefined',
      name: 'arquivo',
      audited: false,
      value: {
        s3Bucket: value.s3Bucket,
        s3Key: value.s3Key,
        file_name: value?.file_name || fileAttributes.fileName,
        file_size: fileAttributes.fileSizeMB,
        mime_type: fileAttributes.mimeType,
        tipo: value?.tipo || '',
      },
    };
    await this.createDemandaDado(payloadArquivo as DemandaDadoInterface);
    return payloadArquivo;
  }

  async getDemandaDadoLastOfPartialSk({ partialSk }: { partialSk: string }) {
    const dados = await DynamoDBServices.queryItems({
      tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
      keyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      expressionAttributeValues: {
        ':pk': { S: this.pk },
        ':sk': { S: partialSk },
      },
    });
    if (dados.length === 0) return {};
    const ordenados = EverestApoioService.ordenaArray(dados, 'created_at');
    return ordenados[ordenados.length - 1];
    // return dados;
  }

  async getDemandaDadoArquivo({ sk }: { sk: string }): Promise<DemandaDadoArquivoInterface> {
    const arquivo = await this.getDemandaDadoBySk({ sk });
    return arquivo as DemandaDadoArquivoInterface;
  }

  async getDemandaDadoArquivos(): Promise<DemandaDadoArquivoInterface[]> {
    const arquivos = await this.getDemandaDadoByCampo({ campo: 'arquivo' });
    return arquivos as DemandaDadoArquivoInterface[];
  }

  async isUsuarioAtuandoAuthorized({
    userEmail,
    statusDemandasExpected,
  }: {
    userEmail: string;
    statusDemandasExpected: string[];
  }) {
    await this.getStatus();

    if (this.status.usuario_atuando && this.status.usuario_atuando !== userEmail)
      throw new Error(`Demanda em atuação por outra pessoa! ${this.status.usuario_atuando}`);

    if (!EverestApoioService.isAnyOfArray1InArray2([this.status.status_demanda], statusDemandasExpected))
      throw new Error('Demanda não está na etapa correta!');

    const everestUserService = new EverestUserService(userEmail);

    const user = await everestUserService.getUser();

    let authorized = false;
    for (const statusDemanda of statusDemandasExpected) {
      if (statusDemanda === 'AuditoriaOito') {
        if (EverestApoioService.isAnyOfArray1InArray2([this.status.cliente], [...(user?.AdminOito ?? [])]))
          authorized = true;
      } else if (statusDemanda === 'AuditoriaCliente') {
        if (EverestApoioService.isAnyOfArray1InArray2([this.status.cliente], [...(user?.AdminCliente ?? [])]))
          authorized = true;
      }
    }

    if (!authorized) throw new Error('Usuário não autorizado a atuar com esta demanda nesta etapa!');

    console.info(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} - Authorized for ${userEmail} to act on ${this.pk} - ${this.status.status_demanda}`
    );

    return authorized;
  }

  async updateUsuarioAtuando({ userEmail }: { userEmail: string }) {
    await this.updateStatus({
      usuario_atuando: userEmail,
      updated_by: userEmail,
    });

    console.info(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} - User ${userEmail} took ${this.pk} - ${this.status.status_demanda}`
    );

    await this.getStatus();
  }

  async clearUsuarioAtuando({ userEmail }: { userEmail: string }) {
    const methodName = `${routeName}.clearUsuarioAtuando`;

    const payload = {
      pk: this.pk,
      sk: 'DemandaDesbloqueada',
      cliente: this.status.cliente,
      created_by: methodName,
      created_at: new Date().toISOString(),
      operador: this.status.usuario_atuando,
    };

    await DynamoDBServices.genericPutItem({
      tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
      item: payload,
    });

    await this.updateStatus({
      usuario_atuando: '',
      updated_by: userEmail,
    });

    console.info(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} - Usuário atuando liberado da demanda ${this.pk}`
    );
  }

  async sendDemandaToSqsPosAuditoriaOito({ userEmail, requisitante }: { userEmail: string; requisitante: string }) {
    try {
      const queueName = `Everest${process.env.ENVIRONMENT}PosAuditoriaOitoSqs.fifo`;
      await this.getStatus();
      await SqsServices.sqsSendMessageFifo({
        queueName: queueName,
        messageBody: JSON.stringify({ pk: this.pk, requisitante }),
      });

      await this.updateStatus({
        updated_by: userEmail,
        status_demanda: 'PosAuditoriaOito',
      });

      await this.clearUsuarioAtuando({ userEmail });

      console.info(
        `${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${
          this.pk
        } sent to Queue ${queueName}`
      );

      return true;
    } catch (error: any) {
      await EverestSesServices.notificaErro({
        metodo: 'sendDemandaToSqsPosAuditoriaOito',
        payload: this.status,
        errorMessage: error.message,
      });
    }
    throw new Error('Erro ao enviar mensagem para fila SQS PosAuditoriaOito');
  }

  async sendDemandaToSqsEmailAutomatico({ userEmail }: { userEmail: string }) {
    try {
      const queueName = `Everest${process.env.ENVIRONMENT}EmailAutomaticoSqs.fifo`;
      await this.getStatus();
      await SqsServices.sqsSendMessageFifo({
        queueName: queueName,
        messageBody: JSON.stringify({ pk: this.pk }),
      });

      await this.updateStatus({
        updated_by: userEmail,
        status_demanda: 'EmailAutomatico',
      });

      await this.clearUsuarioAtuando({ userEmail });

      console.info(
        `${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${
          this.pk
        } sent to Queue ${queueName}`
      );

      return true;
    } catch (error: any) {
      await EverestSesServices.notificaErro({
        metodo: 'sendDemandaToSqsEmailAutomatico',
        payload: this.status,
        errorMessage: error.message,
      });
    }
    throw new Error('Erro ao enviar mensagem para fila SQS EmailAutomatico');
  }

  async getUltimaObservacao() {
    const methodName = `${routeName}.ultimaObservacao`;

    try {
      if (!this.status.observacao || this.status.observacao.length === 0) return '';
      const ultimaObservacao =
        this?.status?.observacao?.length > 0 ? this.status.observacao[this.status.observacao.length - 1] : null;

      return ultimaObservacao?.mensagem ?? '';
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async deleteDemandaDadoByPartialSk({ sk }: { sk: string }): Promise<void> {
    // await this.getStatus();
    try {
      const itens = await DynamoDBServices.queryItems({
        tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
        keyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        expressionAttributeValues: {
          ':pk': { S: this.pk },
          ':sk': { S: sk },
        },
      });
      for (const item of itens) {
        await this.deleteDemandaDadoBySk({ sk: item.sk });
      }
      return;
    } catch (error) {
      throw error;
    }
  }

  async createEventoSubmeteTipificacao({ operador }: { operador: string }) {
    const methodName = `${routeName}.createEventoSubmeteTipificacao`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SubmeteTipificacao',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoSubmeteEsteiraOito({ operador }: { operador: string }) {
    const methodName = `${routeName}.createEventoSubmeteEsteiraOito`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SubmeteEsteiraOito',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoSubmeteEsteiraCliente({ operador }: { operador: string }) {
    const methodName = `${routeName}.createEventoSubmeteEsteiraCliente`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SubmeteEsteiraCliente',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoSubmeteExcecaoOito({ operador, observacao }: { operador: string; observacao: string }) {
    const methodName = `${routeName}.createEventoSubmeteExcecaoOito`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SubmeteExcecaoOito',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
        observacao: observacao,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoSubmeteExcecaoCliente({ operador, observacao }: { operador: string; observacao: string }) {
    const methodName = `${routeName}.createEventoSubmeteExcecaoCliente`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SubmeteExcecaoCliente',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
        observacao: observacao,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoAuditoriaReprovada({
    operador,
    observacao,
    auditor,
  }: {
    operador: string;
    observacao: string;
    auditor: string;
  }) {
    const methodName = `${routeName}.createEventoAuditoriaReprovada`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'AuditoriaReprovada',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
        observacao: observacao,
        auditor: auditor,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoEntradaEsteiraOito() {
    const methodName = `${routeName}.createEventoEntradaEsteiraOito`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'EntradaEsteiraOito',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: this.status.usuario_atuando,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoSalvaDemanda({ operador }: { operador: string }) {
    const methodName = `${routeName}.createEventoSalvaDemanda`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'SalvaDemanda',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: operador,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoEntradaTipificacaoOito() {
    const methodName = `${routeName}.createEventoEntradaTipificacaoOito`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'EntradaTipificacaoOito',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: this.status.usuario_atuando,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }

  async createEventoEntradaEsteiraCliente() {
    const methodName = `${routeName}.createEventoEntradaEsteiraCliente`;
    try {
      const payload = {
        pk: this.pk,
        sk: 'EntradaEsteiraCliente',
        cliente: this.status.cliente,
        created_by: methodName,
        created_at: new Date().toISOString(),
        operador: this.status.usuario_atuando,
      };

      await DynamoDBServices.genericPutItem({
        tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
        item: payload,
      });

      logService.info({ message: JSON.stringify(payload), method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
}

export const statusInterfaceSchema = z.object({
  pk: z.string().uuid(),
  sk: z.string().default('status::'),
  cliente: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  due_date: z.string().datetime().optional(),
  cod_nup: z.string().optional(),
  data_carimbo: z.string().datetime(),
  is_active: z.boolean().default(true),
  perfil_demanda: z.string().default('SemPerfil'),
  produto: z.string().default(''),
  prioridade: z.boolean().default(false),
  status_demanda_anterior: z.string().default('StatusCriado'),
  sla_horas: z.number().default(9),
  status_demanda: z.string().default('StatusCriado'),
  usuario_atuando: z.string().default(''),
  esteira_oito_usuario: z.string().default('').optional(),
  esteira_cliente_usuario: z.string().default('').optional(),
  tipificacao_oito_usuario: z.string().default('').optional(),
  auditoria_oito_usuario: z.string().default('').optional(),
  integrado_at: z.string().datetime().optional(),
  processo: z.string().default('n/a').optional(),
  identificacao: z.string().default('n/a').optional(),
  suit_id: z.string().optional(),
  tipo_demanda: z.string().default(''),
  observacao: z
    .array(
      z.object({
        mensagem: z.string(),
        criada_em: z.string(),
        criada_por: z.string(),
      })
    )
    .optional(),
  historico: z
    .array(
      z.object({
        mensagem: z.string(),
        criado_em: z.string(),
        criado_por: z.string(),
      })
    )
    .optional(),
  origem: z.string().default('Verificar'),
  id_cliente: z.string().optional(),
  migrado_demanda_dado: z.boolean().default(false),
});

export interface StatusInterface {
  pk: string; // UUID format
  sk: string;
  cliente: string;
  created_by: string;
  updated_by: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  due_date?: string; // Optional ISO datetime string
  cod_nup?: string; // Optional string
  data_carimbo: string; // ISO datetime string
  is_active: boolean; // Default: false
  perfil_demanda: string; // Default: 'undefined'
  produto?: string; // Default: 'undefined'
  prioridade: boolean; // Default: false
  status_demanda_anterior?: string; // Default: 'undefined'
  sla_horas: number; // Default: 9
  status_demanda: string; // Default: 'undefined'
  usuario_atuando: string; // Default: ''
  processo?: string; // Optional, sanitized to remove non-digit characters
  identificacao?: string; // Optional string
  suit_id?: string; // Optional string
  tipo_demanda: string; // Default: ''
  observacao?: {
    mensagem: string;
    criada_em: string;
    criada_por: string;
  }[]; // Optional array of objects
  historico?: {
    mensagem: string;
    criado_em: string;
    criado_por: string;
  }[]; // Optional array of objects
  origem: string; // Default: 'undefined'
  id_cliente?: string; // Optional string
  migrado_demanda_dado?: boolean; // Default: false
  esteira_oito_usuario?: string; // Default: ''
  esteira_cliente_usuario?: string; // Default: ''
  tipificacao_oito_usuario?: string; // Default: ''
  auditoria_oito_usuario?: string; // Default: ''
}

export const demandaSchema = z.object({
  pk: z.string().uuid(),
  sk: z.string(),
  cliente: z.string(),
  cod_nup: z.string().optional(),
  usuario_atuando: z.string(),
  identificacao: z.string().optional(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_by: z.string(),
  updated_at: z.string().datetime(),
  data_carimbo: z.string().datetime(),
  due_date: z.string().datetime(),
  status_demanda: z.string(),
  status_demanda_anterior: z.string().default(''),
  id_cliente: z.string().optional(),
  perfil_demanda: z.string().default('undefined'),
  prioridade: z.boolean().default(false),
  is_active: z.boolean().default(false),
  processo: z
    .string()
    .length(21)
    .transform((value) => value.replace(/\D/g, ''))
    .optional(),
});

export type DemandaInterface = z.infer<typeof demandaSchema>;

export const createStatusSchema = statusInterfaceSchema.partial().extend({
  cliente: z.string(),
  created_by: z.string(),
  data_carimbo: z.string().datetime(),
  is_active: z.boolean().default(false),
  perfil_demanda: z.string().default('undefined'),
  sla_horas: z.number().default(9),
});

// Generate the TypeScript type from the Zod schema
export type CreateStatusInterface = z.infer<typeof createStatusSchema>;

export const updateStatusSchema = statusInterfaceSchema.partial().extend({
  nova_observacao: z.string().optional(),
  novo_historico: z.string().optional(),
  updated_by: z.string(),
});

// Generate the TypeScript type from the Zod schema
export type UpdateStatusInterface = z.infer<typeof updateStatusSchema>;

export const demandaDadoSchema = z.object({
  pk: z.string().uuid().optional(),
  sk: z.string(),
  cliente: z.string().optional(),
  created_at: z.string().datetime().optional(),
  created_by: z.string(),
  updated_at: z.string().datetime().optional(),
  updated_by: z.string().optional(),
  audited_at: z.string().datetime().optional(),
  audited_by: z.string().optional(),
  audited: z.boolean().optional(),
  value: z.any(), // Allowing any type for the `value` field
  name: z.string(),
});

// Generate the TypeScript type from the Zod schema
export type DemandaDadoInterface = {
  pk?: string;
  sk: string;
  cliente?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  audited_at?: string;
  audited_by?: string;
  audited?: boolean;
  value: any;
  name: string;
};

export const demandaDadoArquivoSchema = demandaDadoSchema.extend({
  value: z.object({
    file_name: z.string(),
    s3Bucket: z.string(),
    s3Key: z.string(),
    file_size: z.number(),
    tipo: z.string().optional(),
    mime_type: z.string().default('application/octet-stream'),
  }),
});

export type DemandaDadoArquivoInterface = z.infer<typeof demandaDadoArquivoSchema>;

export const createDemandaDadoArquivoSchema = z.object({
  created_by: z.string(),
  value: z.object({
    file_name: z.string().optional(),
    s3Bucket: z.string(),
    s3Key: z.string(),
    tipo: z.string().optional(),
  }),
});

export type CreateDemandaDadoArquivoInterface = z.infer<typeof createDemandaDadoArquivoSchema>;
