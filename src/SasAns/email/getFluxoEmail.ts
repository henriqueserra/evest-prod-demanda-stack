import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsClienteInterface, SasAnsFluxoEmailsInterface } from '../SasAns.Interface';

export const getFluxoEmail = async (): Promise<any> => {
  try {
    const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

    const cliente = (await clienteService.getCliente()) as SasAnsClienteInterface;

    return cliente.fluxo_emails as SasAnsFluxoEmailsInterface;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getFluxoEmail - ${error.message}`);
  }
};
