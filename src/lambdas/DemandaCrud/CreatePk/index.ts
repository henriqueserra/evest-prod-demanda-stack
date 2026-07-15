import { Context } from 'aws-lambda';
import { EverestClienteService } from '../../../libs/everest.cliente.service';
import { EverestApoioDateTimeService } from '../../../libs/everest.apoio.dateTime.service';
import { randomUUID } from 'crypto';
import { GmailService } from '../../../libs/gmail.service';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { StatusInterface } from '../../../libs/everest.demanda.service';
import { DynamoDBServices } from '../../../libs/dynamodb.services';

export const handler = async (event: any, context: Context) => {
  console.info('event:');
  console.info(JSON.stringify(event));
  try {
    debugger;
    if (!event.cliente) throw new Error('cliente não informado!');
    if (!event.created_by) throw new Error('created_by não informado!');

    if (!event.processo || event.processo === '') event.processo = 'n/a';
    if (!event.identificacao || event.identificacao === '') event.identificacao = 'n/a';

    const clienteService = new EverestClienteService({ clienteName: event.cliente });

    const dadosCliente = await clienteService.getCliente();

    const dueDateBruto = await EverestApoioDateTimeService.getDueDate(
      event.created_at ?? new Date().toISOString(),
      dadosCliente.sla_horas || 9
    );

    const novoStatus: StatusInterface = {
      pk: event.pk ?? randomUUID(),
      cliente: event.cliente,
      created_by: event.created_by,
      sk: 'status::',
      created_at: event.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: event.created_by,
      sla_horas: dadosCliente.sla_horas,
      produto: dadosCliente.produto,
      data_carimbo: dueDateBruto.data_do_carimbo,
      due_date: event.due_date ?? dueDateBruto.due_date,
      historico: [
        {
          mensagem: 'StatusCriado',
          criado_em: new Date().toISOString(),
          criado_por: event.created_by,
        },
      ],
      status_demanda: 'StatusCriado',
      prioridade: event.prioridade === true ? true : false,
      is_active: true,
      perfil_demanda: event.perfil_demanda ?? 'SemPerfil',
      usuario_atuando: '',
      cod_nup: event.cod_nup ?? '0',
      tipo_demanda: event.tipo_demanda ?? 'TBD',
      origem: event.origem ?? 'Verificar',
    };

    delete event.updated_at;
    delete event.updated_by;
    delete event.produto;
    delete event.status_demanda;
    delete event.prioridade;
    delete event.is_active;
    delete event.perfil_demanda;
    delete event.proxima_etapa;
    delete event.usuario_atuando;

    const status = { ...novoStatus, ...event };

    const axiosRequest: AxiosRequestConfig = {
      method: 'POST',
      url: 'https://everest.oito.srv.br/dev/backend/v1/demanda/create_pk',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `123deoliveira4`,
      },
      data: status,
    };

    // const axiosResponse: AxiosResponse = await axios(axiosRequest);

    await DynamoDBServices.putItem({
      tableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
      item: { ...status },
    });

    // console.log(`Status criado com sucesso: ${JSON.stringify(axiosResponse?.data?.status)}`);

    const payload = {
      pk: status.pk,
      cliente: status.cliente,
      created_by: status.created_by,
      created_at: new Date().toISOString(),
      origem: status.origem ?? `everest-${process.env.ENVIRONMENT}-demanda-stack.CreatePk`,
      sk: 'NovaDemanda',
    };

    await DynamoDBServices.genericPutItem({
      tableName: `Tbl${process.env.ENVIRONMENT}Evento`,
      item: payload,
    });

    console.log(`Evento criado com sucesso: ${JSON.stringify(payload)}`);

    // return axiosResponse?.data?.status as StatusInterface;
    return status;
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
