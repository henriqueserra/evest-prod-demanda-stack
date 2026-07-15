import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sasAnsGetToken } from './sasAnsGetToken';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsAtualizaArquivoEmManifestacao = async (payload: any): Promise<Boolean> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: false });

    const apiParams: SasAnsApiParamsInterface = (await clienteService.getClienteApiParams()) as any;

    const data = JSON.stringify([payload]);

    request = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/manifestacoes`,
      headers: {
        Authorization: token,
        Origem: '8 Serviços Juridicos',
        'bypass-trigger': 'true',
        Realm: 'Parceiro',
        'somente-anexo': 'true',
        'Content-Type': 'application/json',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };

    try {
      response = await axios(request);
      return true;
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data;
      console.error(`${JSON.stringify(error)}`);
      throw new Error(`${JSON.stringify(error)}`);
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsAtualizaArquivoEmManifestacao - ${error.message}`);
  }
};
