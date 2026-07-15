import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createApiAccessLog } from './createApiAccessLog';
import { sasAnsGetToken } from './sasAnsGetToken';
import { LambdaServices } from '../../libs/lambda.services';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsConsultaDocumentoBeneficiario = async ({
  documento,
  pk,
}: {
  documento: string;
  pk: string;
}): Promise<{ contaLocalizada: boolean; lst_conta: any[] }> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: false });

    const apiParams: SasAnsApiParamsInterface = (await clienteService.getClienteApiParams()) as any;

    const doc = await LambdaServices.invokeLambda({
      lambdaName: 'EverestApoioValidaCpfCnpj',
      payload: {
        documento: documento.toString(),
      },
    });

    if (doc.status === false) throw new Error('documento invalido');

    const documentoTipo = doc.type.toLowerCase();
    const documetoFormatado = doc.documentoFormatado;

    const data = '';

    request = {
      method: 'get',
      url: `${apiParams.url_base}/contas?${documentoTipo}=${documetoFormatado}`,
      headers: {
        Authorization: token,
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };
    let contaLocalizada: boolean = true;
    try {
      response = await axios(request);
      return { contaLocalizada, lst_conta: response?.data?.lst_conta };
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data?.error as string;
      contaLocalizada = false;
      console.log(`Conta ${documetoFormatado}: ${error}`);
      return { contaLocalizada, lst_conta: [] };
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsConsultaDocumentoBeneficiario - ${error.message}`);
  } finally {
    await createApiAccessLog({
      nome_atividade: 'api_consulta_documento_beneficiario',
      request: request! ?? null,
      response: response! ?? null,
      erro: erro! ?? null,
      pk,
      cliente: 'SasAns',
    });
  }
};
