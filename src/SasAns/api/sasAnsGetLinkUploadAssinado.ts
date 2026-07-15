import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ResponseRequestLinkAssinadoUploadInterface, SasAnsApiParamsInterface } from '../SasAns.Interface';
import { sasAnsGetToken } from './sasAnsGetToken';
import { EverestClienteService } from '../../libs/everest.cliente.service';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsGetLinkUploadAssinado = async ({
  payload,
}: {
  payload: any;
}): Promise<ResponseRequestLinkAssinadoUploadInterface> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: true });

    const apiParams: SasAnsApiParamsInterface = (await clienteService.getClienteApiParams()) as any;

    const data = JSON.stringify(payload);

    request = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/nips/links?unidade=s&tempo=300&tipo=upload`,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };

    try {
      response = await axios(request);
      return {
        url_assinada: response?.data?.result[0].url_assinada as string,
      };
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data?.error as string;

      console.log(`Manifestação ${payload}: ${error}`);
      throw new Error(`Manifestação ${payload}: ${error}`);
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsGetLinkUploadAssinado - ${error.message}`);
  }
};
