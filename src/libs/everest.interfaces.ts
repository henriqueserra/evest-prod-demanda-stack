import { StatusInterface } from './everest.demanda.service';

export interface LambdaContextInterface {
  callbackWaitsForEmptyEventLoop: boolean;
  functionVersion: string;
  functionName: string;
  memoryLimitInMB: string;
  logGroupName: string;
  logStreamName: string;
  invokedFunctionArn: string;
  awsRequestId: string;
}

export interface SendGridSendEmailInterface {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from: EmailDataInterface;
  replyTo?: string;
  subject: string;
  text: string;
}

export interface SendGridSendEmailInterfaceWithAttachment extends SendGridSendEmailInterface {
  attachment: [SendGridAttachmentInterface];
}

export interface SendGridAttachmentInterface {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}

export interface EmailDataInterface {
  name?: string;
  email: string;
}

export interface FluxoEmailsInterface {
  template_id: string;
  emails: string[];
}

export interface TextoExtruturadoInterface {
  pk: string;
  sk: string;
  cliente: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  texto_extraido: string | null;
  s3Region?: string;
  s3Bucket?: string;
  s3Key?: string;
}

export interface CreateSkInterface {
  cliente: string;
  created_by: string;
  pk: string;
  sk: string;
  data_inclusao_registro?: string;
  [key: string]: any; // Permite outros atributos
}

export interface PayloadOriginalInterface {
  pk: string;
  sk: string;
  cliente: string;
  updated_by: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  data_inclusao_registro: string;
  num_demanda?: string;
  codigo_operadora?: string;
  natureza?: string;
  payload: any;
}

export interface EsteiraInterface {
  id: string;
  cliente: string;
  processo: string;
  identificacao: string;
  tipo: string;
  usuario_atuando: string;
  data_recebimento: string;
  due_date: string;
  prioridade: string;
  demanda: string;
  status: string;
  ultima_observacao?: string;
  status_anterior?: string;
  entrada_excecao?: string;
}

export interface UserInterface {
  pk: string;
  name: string;
  sub: string;
  AdminCliente?: string[] | [];
  AdminOito?: string[] | [];
  Consultas?: string[] | [];
  ExcecaoCliente?: string[] | [];
  ExcecaoOito?: string[] | [];
  OperadorCliente?: string[] | [];
  OperadorOito?: string[] | [];
  PortalUpload?: string[] | [];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
  EOC?: boolean;
  OperadorOitoMaster?: boolean;
  EscolheEsteiraOito?: boolean;
  [key: string]: any; // Permite outros atributos
}

export interface SesEnviaEmailInterface {
  corpoEmail: string;
  toAdresses: string[];
  bccAdresses?: string[];
  ccAdresses?: string[];
  subject: string;
}

export interface AnexoBufferInterface {
  filename: string;
  content: string; //base64
  mimeType: string;
}

export interface AnexoS3Interface {
  s3Key: string;
  s3Bucket: string;
}

export interface TemplateNotificaErroInterface {
  data: {
    errorMessage: string;
    event: string;
    context: string;
    url: string;
  };
}

export interface EnviaEmailAnexoBufferInterface {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
  replyTo?: string[];
  mime_type?: string;
  attachments?: AnexoBufferInterface[];
}

export interface EnviaEmailAnexoS3Interface {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
  replyTo?: string[];
  mime_type?: string;
  attachments?: AnexoS3Interface[];
}

export interface EnviaEmailTemplateNotificaErroInterface {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  replyTo?: string[];
  template: TemplateNotificaErroInterface;
  attachments?: AnexoBufferInterface[];
}

export interface TemplateConfirmacaoPortalUploadsInterface {
  data: {
    data_recebimento: string;
    file_name: string;
    pk: string;
  };
}

export interface EnviaConfirmacaoPortalUploadsInterface {
  data_recebimento: string;
  file_name: string;
  pk: string;
  created_by: string;
}

export interface TemplateSasAnsConfirmacaoDemandaRespondidaInterface {
  data: {
    data_recebimento: string;
    protocolo: string;
  };
}

export interface EnviaEmailTemplateSasAnsConfirmacaoDemandaRespondidaInterface {
  from: {
    email: string;
    name: string;
  };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  replyTo?: string[];
  template: TemplateSasAnsConfirmacaoDemandaRespondidaInterface;
}

export interface GetThreadIdByEnderecoEmailInterface {
  from: {
    email: string;
    name: string;
  };
  enderecoEmail: string;
}

export interface GetThreadIdByAssuntoParcialInterface {
  from: {
    email: string;
    name: string;
  };
  assuntoParcial: string;
}

export interface DeleteEmailByIdInterface {
  from: {
    email: string;
    name: string;
  };
  emailId: string;
}

export interface EmailResponseInterface {
  id: string;
  threadId: string;
  labelIds: string[];
}

export interface ArquivoInterface {
  pk: string;
  sk: string;
  cliente: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  mime_type: string;
  s3Bucket: string;
  s3Key: string;
  s3Region: string;
  size: number;
  integrado: boolean;
  tipo?: string;
}

export interface MetadataInterface {
  cliente: string;
  created_by: string;
  filename_original: string;
  hash_calculado: string;
  mimetype: string;
  prioridade: string;
  size: string;
  pk: string;
  tipo: string;
  data_carimbo: string;
  processo: string;
  identificacao: string;
  observacao: string;
  origem: string;
}

export interface SkEmailInterface {
  pk: string;
  sk: string;
  cliente: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  email: string;
}
