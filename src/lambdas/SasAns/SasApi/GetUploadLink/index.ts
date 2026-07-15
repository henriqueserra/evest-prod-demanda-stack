import { Context } from 'aws-lambda';
import axios, { AxiosRequestConfig } from 'axios';
import { LambdaServices } from '../../../../libs/lambda.services';

export const handler = async (event: any, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  try {
    if (!event.arquivos) throw new Error('O campo arquivos é obrigatório');

    const { token } = await LambdaServices.invokeLambda({ lambdaName: 'EverestDevAnsGetToken', payload: {} });

    let data = JSON.stringify(event);

    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://apisulamerica.sensedia.com/homolog/manifestacoes-protocolos/v2/nips/links?unidade=s&tempo=300&tipo=upload',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };

    const response = await axios(axiosRequestConfig);

    return response.data.result[0].url_assinada;
  } catch (error: any) {
    console.error('ERRO:');
    console.error(error.message);
    throw new Error(`SasApi/GetToken - ${error.message}`);
  }
};
