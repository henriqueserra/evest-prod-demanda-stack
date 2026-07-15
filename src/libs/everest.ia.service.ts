import axios, { AxiosRequestConfig } from 'axios';

export class EverestIaService {
  constructor() {}

  public static getTextoDoPdf = async (payload: {
    s3Key: string;
    s3Bucket: string;
  }): Promise<string> => {
    try {
      const axiosRequestConfig: AxiosRequestConfig = {
        url: 'https://everest.oito.srv.br/everest/ai/v2/arquivo/extrairTexto',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          s3Key: payload.s3Key,
          s3Bucket: payload.s3Bucket,
        }),
      };
      const resposnse = await axios(axiosRequestConfig);
      if (!resposnse.data)
        throw new Error(
          'Erro ao extrair texto do pdf => ' +
            JSON.stringify({
              s3Key: payload.s3Key,
              s3Bucket: payload.s3Bucket,
            }),
        );
      return resposnse.data;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`${error.message}`);
    }
  };

  public static perguntaComContexto = async (payload: {
    contexto: string;
    pergunta: string;
  }): Promise<string> => {
    try {
      const axiosRequestConfig: AxiosRequestConfig = {
        url: 'https://everest.oito.srv.br/everest/ai/v2/apoio/perguntaComContexto',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          ...payload,
        }),
      };
      //
      const resposnse = await axios(axiosRequestConfig);
      //
      return resposnse.data;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`${error.message}`);
    }
  };
}
