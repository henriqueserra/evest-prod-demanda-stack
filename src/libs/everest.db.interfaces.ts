export interface DemandaInterface {
  pk: string; // UUID
  cliente: string;
  created_at?: Date;
  updated_at?: Date;
  created_by: string;
  updated_by: string;
  due_date: Date;
  cod_nup?: string | null;
  data_carimbo: Date;
  is_active: boolean;
  perfil_demanda: string | null;
  prioridade: boolean;
  sla_horas: number;
  status_demanda?: string;
  usuario_atuando?: string | null;
  processo?: string | null;
  identificacao?: string | null;
  suit_id?: string | null;
  tipo_demanda: string;
  origem: string;
  id_cliente?: string | null;
  esteira_oito_usuario?: string | null;
  esteira_cliente_usuario?: string | null;
  tipificacao_oito_usuario?: string | null;
  auditoria_oito_usuario?: string | null;
}

export interface CreateDemandaInterface {
  pk: string; // UUID
  cliente: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  due_date: string;
  cod_nup: string | null;
  data_carimbo: string;
  is_active: boolean;
  perfil_demanda: string | null;
  prioridade: boolean;
  sla_horas: number;
  status_demanda: string;
  usuario_atuando: string | null;
  processo: string | null;
  identificacao: string | null;
  suit_id: string | null;
  tipo_demanda: string | null;
  origem: string | null;
  id_cliente: string | null;
  esteira_oito_usuario: string | null;
  esteira_cliente_usuario: string | null;
  tipificacao_oito_usuario: string | null;
  auditoria_oito_usuario: string | null;
}

export interface UserInterface {
  pk: string;
  name?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by: string;
  updated_by: string;
  eoc?: boolean;
  escolhe_esteira_oito?: boolean;
  is_active?: boolean;
  god_mode?: boolean;
  sub?: string;
  npc?: boolean;
}

export interface CreateDemandaDadoInterface {
  pk: string;
  tipo_dado: any;
  cliente: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  updated_by: string;
  value: any | null;
  ai_created: boolean;
  metadata: any;
}

export interface CreatePayloadInterface {
  pk: string; // UUID - NOT NULL
  tipo: string; // varchar - NOT NULL
  created_at?: string; // timestamp - opcional pois tem DEFAULT CURRENT_TIMESTAMP
  payload?: any; // jsonb - NULL
}

export interface PortalUploadsInterface {
  pk: string; // UUID
  cliente: string;
  created_at?: Date;
  updated_at?: Date;
  created_by: string;
  updated_by: string;
  data_carimbo: Date;
  filename_original: string;
  hash_calculado: string;
  identificacao?: string | null;
  migrado?: boolean | null;
  prioridade?: boolean | null;
  processo?: string | null;
  size?: number | null;
  tipo?: string | null;
  origem: string;
  s3key: string;
  s3bucket: string;
}

export interface CreatePortalUploadsInterface {
  pk: string; // UUID
  cliente: string;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  updated_by: string;
  data_carimbo: string;
  filename_original: string;
  hash_calculado: string;
  identificacao?: string | null;
  migrado?: boolean | null;
  prioridade?: boolean | null;
  processo?: string | null;
  size?: number | null;
  tipo?: string | null;
  origem: string;
  s3key: string;
  s3bucket: string;
}
