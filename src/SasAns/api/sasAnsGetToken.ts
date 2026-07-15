import axios, { AxiosRequestConfig } from 'axios';
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as qs from 'qs';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

export const sasAnsGetToken = async ({ force_refresh }: { force_refresh?: boolean }): Promise<string> => {
  try {
    /* -------------------------------------------------------------------------- */
    /*               Obtem os parametros de autenticação do cliente               */
    /* -------------------------------------------------------------------------- */
    const apiParams = (await clienteService.getClienteApiParams()) as SasAnsApiParamsInterface;

    const tokenValido = apiParams.token;
    const expiration = apiParams.expiration_date;
    let expirada: Boolean = expiration > new Date().toISOString() ? false : true;
    /* -------------------------------------------------------------------------- */

    /* ---------- Checa se é foi solicitado um refresh forçado do token --------- */
    if (force_refresh) {
      const token = await requestToken(apiParams);
      return token;
    }
    /* -------------------------------------------------------------------------- */
    //
    //
    /* --------------- Se o token está expirado, força o refrsesh --------------- */
    /* ------------------ do contrário, retorna o token válido ------------------ */
    if (expirada) {
      // Obtem novo token
      const token = await requestToken(apiParams);
      return token;
    } else {
      return tokenValido;
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsGetToken - ${error.message}`);
  }
};
/* -------------------------------------------------------------------------- */

const requestToken = async (apiParams: SasAnsApiParamsInterface) => {
  try {
    let data = qs.stringify({
      grant_type: apiParams.grant_type,
      username: apiParams.username,
      password: apiParams.password,
    });

    const axiosRequest: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: apiParams.oauth_url,
      headers: {
        'tipo-usuario': 'P',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: apiParams.authorization_header,
        GRANT_TYPE: apiParams.grant_type,
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };

    const response = await axios(axiosRequest);

    const { token } = await updateToken(response.data);

    return token;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`requestToken - ${error.message}`);
  }
};

const updateToken = async (dados: any) => {
  try {
    const token = 'Bearer ' + dados.access_token;
    const expiration_date_time = new Date().getTime() + Math.round(dados.expires_in * 0.9) * 1000;
    const expiration_date = new Date(expiration_date_time).toISOString();
    const last_token_request = new Date().toISOString();

    const item = await clienteService.getCliente();

    item.api.token = token;
    item.api.expiration_date = expiration_date;
    item.api.last_token_request = last_token_request;

    const updateTokenParams: PutItemCommandInput = {
      TableName: `Tbl${process.env.ENVIRONMENT}AdmCliente`,
      Item: marshall(item, { removeUndefinedValues: true }),
    };

    await dynamoDBClient.send(new PutItemCommand(updateTokenParams));

    console.log('Token atualizado com sucesso');

    return { token };
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`updateToken - ${error.message}`);
  }
};
