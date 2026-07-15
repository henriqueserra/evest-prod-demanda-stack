import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { sasAnsGetToken } from './sasAnsGetToken';
import { LambdaServices } from '../../libs/lambda.services';

export const sasAnsCriaContaBeneficiario = async ({
  documento,
  primeiroNome,
  sobreNome,
  tratamento,
  sexo,
  telefone,
  data_nascimento,
  email,
}: {
  documento: string;
  primeiroNome: string;
  sobreNome: string;
  tratamento: string;
  sexo: string;
  telefone: string;
  data_nascimento: string;
  email: string;
}): Promise<any> => {
  try {
    const token = await sasAnsGetToken({ force_refresh: false });

    const doc = await LambdaServices.invokeLambda({
      lambdaName: 'EverestApoioValidaCpfCnpj',
      payload: {
        documento: documento.toString(),
      },
    });

    if (doc.status === false) throw new Error('documento invalido');

    const documentoTipo = doc.type.toLowerCase();
    const documetoFormatado = doc.documentoFormatado;

    const data = {
      documento: documetoFormatado,
      primeiro_nome: primeiroNome,
      sobrenome: sobreNome,
      tratamento: tratamento,
      sexo: sexo,
      telefone: telefone,
      data_nascimento: data_nascimento,
      email: email,
    };

    const config: AxiosRequestConfig = {
      method: 'post',
      url: `https://apisulamerica.sensedia.com/homolog/manifestacoes-protocolos/v2/contas`,
      headers: {
        Authorization: token,
        Realm: 'Parceiro',
        Cookie: 'CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1',
      },
      data: data,
    };
    let contaLocalizada: boolean = true;
    let response: AxiosResponse;
    try {
      response = await axios(config);
      return { contaLocalizada, lst_conta: response?.data?.lst_conta };
    } catch (e: any) {
      const error = e?.response?.data?.error as string;
      if (error.endsWith('Não foi possível localizar a conta pelo CPF informado')) contaLocalizada = false;
      console.log(`Conta ${documetoFormatado} não localizada`);
      return { contaLocalizada, lst_conta: [] };
    }
  } catch (error: any) {
    console.error(error.message);
    throw new Error(`sasAnsCriaContaBeneficiario - ${error.message}`);
  }
};
