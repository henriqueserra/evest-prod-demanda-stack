import { handler } from './index';
import { Context } from 'aws-lambda';

const event: string =
  'select cod_citacao_dado,cod_citacao_configuracao,dat_inclusao,dsc_nome_arquivo,dsc_path_arquivo,dsc_numero_processo,UPPER(tipo_documento) AS tipo_documento from captadores.citacao_dado cd where cod_citacao_configuracao in (select cod_citacao_configuracao from captadores.citacao_configuracao cc where cod_cliente = 100 and ind_status_registro = true) and ind_conferido_contencioso = false and ind_status_registro = true and cod_citacao_configuracao = 415 order by dat_inclusao asc;';

handler(event, {} as Context)
  .then((resultado) => {
    console.log(JSON.stringify(resultado));
  })
  .catch(console.error);
