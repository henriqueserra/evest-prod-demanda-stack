import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { sasAnsGetToken } from './sasAnsGetToken';

export const sasAnsUploadArquivoLinkAssinado = async ({
  url_assinada,
  data,
}: {
  url_assinada: string;
  data: Buffer;
}): Promise<any> => {
  let request: AxiosRequestConfig;
  let response: AxiosResponse;
  let erro: AxiosError;
  try {
    const token = await sasAnsGetToken({ force_refresh: false });

    request = {
      method: 'put',
      maxBodyLength: Infinity,
      url: url_assinada,
      headers: {
        'Content-Type': 'application/pdf',
      },
      data: data,
    };

    try {
      response = await axios(request);
      return response?.data;
    } catch (e: any) {
      erro = e;
      const error = e?.response?.data;
      throw new Error(`${error}`);
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsUploadArquivoLinkAssinado - ${error.message}`);
  }
};
