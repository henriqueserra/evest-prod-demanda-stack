import { EverestClienteService } from '../libs/everest.cliente.service';

export const getTipificacaoAns = async (): Promise<string[]> => {
  try {
    const clienteService = new EverestClienteService({ clienteName: 'SasAns' });
    const cliente = await clienteService.getCliente();
    return cliente?.tipificacao_ans || [];
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getTipificacaoAns - ${error.message}`);
  }
};
