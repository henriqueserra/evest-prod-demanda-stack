import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import axios, { AxiosRequestConfig } from 'axios';
import { marshall } from '@aws-sdk/util-dynamodb';
import { sasAnsGetToken } from './sasAnsGetToken';
import { EverestClienteService } from '../../libs/everest.cliente.service';
import { SasAnsApiParamsInterface } from '../SasAns.Interface';

const clienteService = new EverestClienteService({ clienteName: 'SasAns' });

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
});

export const sasAnsUpdateAllPickLists = async (): Promise<any> => {
  try {
    const token = await sasAnsGetToken({ force_refresh: true });

    const apiParams: SasAnsApiParamsInterface =
      (await clienteService.getClienteApiParams()) as SasAnsApiParamsInterface;

    //
    const areaDeNegocio = await getAreaDeNegocio(token, apiParams);

    const cidadeDoOrgao = await getDominioNaoDependente('CIDADE_DO_ORGAO__c', token, apiParams);

    const orgao = await getDominioDependente('ORGAO__c', areaDeNegocio, token, apiParams);

    const tipoDeDocumento = await getDominioDependente('TIPO_DE_DOCUMENTO__c', orgao, token, apiParams);

    const ciaConstanteNaDemanda = await getDominioDependente(
      'CIA_CONSTANTE_NA_DEMANDA__c',
      areaDeNegocio,
      token,
      apiParams
    );

    const tipoDeDemandante = await getDominioNaoDependente('Tipo_de_Demandantes__c', token, apiParams);

    const causaRaiz = await getDominioDependente('CAUSA_RAIZ__c', areaDeNegocio, token, apiParams);

    const epecificacaoCausaRaiz = await getDominioDependente(
      'ESPECIFICACAO_DA_CAUSA_RAIZ__c',
      causaRaiz,
      token,
      apiParams
    );

    const categoria = await getDominioDependente('CATEGORIA__c', areaDeNegocio, token, apiParams);

    return true;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsUpdateAllPickLists - ${error.message}`);
  }
};

const getAreaDeNegocio = async (token: string, apiParams: SasAnsApiParamsInterface) => {
  try {
    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/manifestacoes/dominios`,
      headers: {
        Authorization: token,
        Canal: 'Ouvidoria',
        Dominio: 'Type',
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
    };

    const response = await axios(axiosRequestConfig);

    const valores = response.data.valores_do_campo.map((valor: any) => {
      return valor.valor;
    });

    for (const iterator of ['Odonto', 'Saúde']) {
      const putParams: PutItemCommandInput = {
        TableName: `Tbl${process.env.ENVIRONMENT}AnsPickLists`,
        Item: marshall(
          {
            dominio: 'Type',
            valor: iterator,
            created_at: new Date().toISOString(),
          },
          { removeUndefinedValues: true }
        ),
      };
      await dynamoDBClient.send(new PutItemCommand(putParams));
    }

    return ['Odonto', 'Saúde'];
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getAreaDeNegocio - ${error.message}`);
  }
};

const getDominioNaoDependente = async (dominio: string, token: string, apiParams: SasAnsApiParamsInterface) => {
  try {
    console.log(`Obtendo valores para o dominio ${dominio}`);

    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/manifestacoes/dominios`,
      headers: {
        Authorization: token,
        Canal: 'Ouvidoria',
        Dominio: dominio,
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
    };

    const response = await axios(axiosRequestConfig);

    const valores = response.data.valores_do_campo.map((valor: any) => {
      return valor.valor;
    });

    for (const iterator of valores) {
      const putParams: PutItemCommandInput = {
        TableName: `Tbl${process.env.ENVIRONMENT}AnsPickLists`,
        Item: marshall(
          {
            dominio: dominio,
            valor: iterator,
            created_at: new Date().toISOString(),
          },
          { removeUndefinedValues: true }
        ),
      };
      await dynamoDBClient.send(new PutItemCommand(putParams));
    }

    return valores;
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getAreaDeNegocio - ${error.message}`);
  }
};

const getDominioDependente = async (
  dominio: string,
  dependente: string[],
  token: string,
  apiParams: SasAnsApiParamsInterface
) => {
  try {
    console.log(`Obtendo valores para o dominio ${dominio}`);
    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${apiParams.url_base}/manifestacoes/dominios`,
      headers: {
        Authorization: token,
        Canal: 'Ouvidoria',
        Dominio: dominio,
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
    };

    const response = await axios(axiosRequestConfig);
    let valores: any = [];

    response.data.valores_do_campo.map((valor: any) => {
      if (verificaValores(dependente, valor.valores_validos_para)) {
        valores.push({
          valor: valor.valor,
          dominio: dominio,
          valores_validos_para: valor.valores_validos_para,
        });
      }
    });

    for (const iterator of valores) {
      const putParams: PutItemCommandInput = {
        TableName: `Tbl${process.env.ENVIRONMENT}AnsPickLists`,
        Item: marshall(
          {
            ...iterator,
            created_at: new Date().toISOString(),
          },
          { removeUndefinedValues: true }
        ),
      };
      await dynamoDBClient.send(new PutItemCommand(putParams));
    }
    return valores.map((valor: any) => valor.valor);
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`getDominioDependente - ${error.message}`);
  }
};

function verificaValores(array1: string[], array2: string[]): boolean {
  for (let valor of array1) {
    if (array2.includes(valor)) {
      return true;
    }
  }
  return false;
}
