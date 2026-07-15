import { ClienteInterface } from '../libs/everest.cliente.service';

export interface SasAnsLstContaInterface {
  vigencia: string;
  beneficiario: string;
  codigo_estipulante: string | null;
  contrato: string | null;
  nome_conta: string;
  nome_empresa: string | null;
  plano: string | null;
}

export interface RequestLinkAssinadoUploadInterface {
  arquivos: string[];
}

export interface ResponseRequestLinkAssinadoUploadInterface {
  url_assinada: string;
}

export interface RequestEnviaArquivoParaLinkAssinadoInterface {
  url_assinada: string;
  data: Buffer;
}

export interface RequestAtualizaArquivoEmManifestacaoInterface {
  protocolo: string;
  lista_anexos_link_assinado: [
    {
      nome_anexo: string;
      formato_anexo: string;
    }
  ];
}

export interface SasAnsClienteInterface extends ClienteInterface {
  fluxo_emails: SasAnsFluxoEmailsInterface;
}

export interface SasAnsApiParamsInterface {
  expiration_date: string;
  last_token_request: string;
  token: string;
  oauth_url: string;
  url_base: string;
  grant_type: string;
  password: string;
  username: string;
  authorization_header: string;
  urls?: any;
  Username?: string;
  Password?: string;
  personId?: number;
  idMotivoOcorrenciaCivel?: number;
  idMotivoOcorrenciaTrabalhista?: number;
}

export interface SasAnsFluxoEmailsInterface {
  notifica_excecao: {
    payload_resposta_invalido: SasAnsFluxoEmailsInterface;
    site_ans: SasAnsFluxoEmailsInterface;
  };
  notifica_sucesso: {
    recebimento_resposta: SasAnsFluxoEmailsInterface;
    resposta_protocolada: SasAnsFluxoEmailsInterface;
  };
}

export interface SasAnsFluxoEmailsInterface {
  template_id: string;
  emails: string[];
}
