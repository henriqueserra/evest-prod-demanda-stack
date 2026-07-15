import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sasAnsGetToken } from './sasAnsGetToken';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsConsultaManifestacao = async ({
  manifestacao,
}: {
  manifestacao: string;
}): Promise<{ manifestacao: any[] }> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: false });

    const apiParams: SasAnsApiParamsInterface = (await clienteService.getClienteApiParams()) as any;

    const data = '';

    request = {
      method: 'get',
      url: `${apiParams.url_base}/manifestacoes?protocolo=${manifestacao}&_limit=10&offset=1`,
      headers: {
        Authorization: token,
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };
    try {
      response = await axios(request);

      return {
        manifestacao: response?.data?.lista_manifestacoes_response,
      };
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data?.error as string;
      console.log(`Manifestação ${manifestacao}: ${error}`);
      return { manifestacao: [] };
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsConsultaManifestacao - ${error.message}`);
  }
};
