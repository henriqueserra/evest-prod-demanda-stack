import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sasAnsGetToken } from './sasAnsGetToken';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsGetLinkDownload = async ({
  arquivo,
}: {
  arquivo: string;
}): Promise<{ arquivo: string; link: any[] }> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: true });

    const apiParams: SasAnsApiParamsInterface = (await clienteService.getClienteApiParams()) as any;

    const data = {
      arquivos: [arquivo],
    };

    request = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/nips/links?unidade=s&tempo=300&tipo=download`,
      headers: {
        Authorization: token,
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };

    try {
      response = await axios(request);
      return {
        arquivo,
        link: response?.data?.result,
      };
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data?.error as string;

      console.log(`Manifestação ${arquivo}: ${error}`);
      return { arquivo, link: [] };
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsGetLinkDownload - ${error.message}`);
  }
};
