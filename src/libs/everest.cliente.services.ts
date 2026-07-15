import { DynamoDBServices } from './dynamodb.services';
import { ClienteInterface } from './everest.cliente.service';

const tableName = `Tbl${process.env.ENVIRONMENT}AdmCliente`;

export class EverestClienteServices {
  constructor() {}

  static async getClientes(): Promise<ClienteInterface[]> {
    const Items = await DynamoDBServices.scanItems({ tableName });
    if (!Items) throw new Error('Clientes não encontrados!');
    return Items as ClienteInterface[];
  }
}
