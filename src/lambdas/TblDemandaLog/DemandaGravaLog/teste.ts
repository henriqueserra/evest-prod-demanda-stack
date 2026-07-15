import { handler } from './index';

const event = {
  Records: [
    {
      eventID: '494ae421189f9c212aac02bb419c2b4c',
      eventName: 'MODIFY',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1753963941,
        Keys: {
          sk: {
            S: 'status::',
          },
          pk: {
            S: '211af149-35cb-42cf-af1d-83007ed3acf4',
          },
        },
        NewImage: {
          cod_nup: {
            S: '43678824',
          },
          id_cliente: {
            S: '0',
          },
          is_active: {
            BOOL: true,
          },
          identificacao: {
            S: 'n/a',
          },
          sla_horas: {
            N: '9',
          },
          data_carimbo: {
            S: '2025-07-30T14:04:13.317Z',
          },
          due_date: {
            S: '2025-07-31T14:04:13.317Z',
          },
          historico: {
            L: [
              {
                M: {
                  criado_em: {
                    S: '2025-07-30T14:04:14.820Z',
                  },
                  criado_por: {
                    S: 'cadastraDistribuidos',
                  },
                  mensagem: {
                    S: 'StatusCriado => EsteiraOito',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2025-07-31T12:12:21.299Z',
                  },
                  criado_por: {
                    S: 'sara.correia@oito.srv.br',
                  },
                  mensagem: {
                    S: 'EsteiraOito => AuditoriaOito',
                  },
                },
              },
            ],
          },
          origem: {
            S: 'Distribuídos',
          },
          created_at: {
            S: '2025-07-30T14:04:13.318Z',
          },
          esteira_oito_usuario: {
            S: 'sara.correia@oito.srv.br',
          },
          status_demanda: {
            S: 'AuditoriaOito',
          },
          created_by: {
            S: 'getDistribuidos@oito.srv.br',
          },
          cliente: {
            S: 'ReturnCadastro',
          },
          usuario_atuando: {
            NULL: true,
          },
          prioridade: {
            BOOL: false,
          },
          tipo_demanda: {
            S: 'Cadastro Jurídico',
          },
          updated_at: {
            S: '2025-07-31T12:12:21.332Z',
          },
          processo: {
            S: '00029311620258172470',
          },
          sk: {
            S: 'status::',
          },
          updated_by: {
            S: 'sara.correia@oito.srv.br',
          },
          perfil_demanda: {
            S: 'Cadastro Jurídico',
          },
          pk: {
            S: '211af149-35cb-42cf-af1d-83007ed3acf4',
          },
          suit_id: {
            S: '0',
          },
        },
        OldImage: {
          cod_nup: {
            S: '43678824',
          },
          id_cliente: {
            S: '0',
          },
          is_active: {
            BOOL: true,
          },
          identificacao: {
            S: 'n/a',
          },
          sla_horas: {
            N: '9',
          },
          data_carimbo: {
            S: '2025-07-30T14:04:13.317Z',
          },
          due_date: {
            S: '2025-07-31T14:04:13.317Z',
          },
          historico: {
            L: [
              {
                M: {
                  criado_em: {
                    S: '2025-07-30T14:04:14.820Z',
                  },
                  criado_por: {
                    S: 'cadastraDistribuidos',
                  },
                  mensagem: {
                    S: 'StatusCriado => EsteiraOito',
                  },
                },
              },
            ],
          },
          origem: {
            S: 'Distribuídos',
          },
          created_at: {
            S: '2025-07-30T14:04:13.318Z',
          },
          status_demanda: {
            S: 'EsteiraOito',
          },
          created_by: {
            S: 'getDistribuidos@oito.srv.br',
          },
          cliente: {
            S: 'ReturnCadastro',
          },
          usuario_atuando: {
            S: 'sara.correia@oito.srv.br',
          },
          prioridade: {
            BOOL: false,
          },
          tipo_demanda: {
            S: 'Cadastro Jurídico',
          },
          updated_at: {
            S: '2025-07-31T12:10:21.541Z',
          },
          processo: {
            S: '00029311620258172470',
          },
          sk: {
            S: 'status::',
          },
          updated_by: {
            S: 'sara.correia@oito.srv.br',
          },
          perfil_demanda: {
            S: 'Cadastro Jurídico',
          },
          pk: {
            S: '211af149-35cb-42cf-af1d-83007ed3acf4',
          },
          suit_id: {
            S: '0',
          },
        },
        SequenceNumber: '1428695200001289376060508665',
        SizeBytes: 1477,
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
      eventSourceARN: 'arn:aws:dynamodb:us-east-1:028901343047:table/TblProdDemanda/stream/2024-10-26T23:45:49.997',
    },
  ],
};

const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'ReturnDevProcessosGravaLog',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/ReturnDevProcessosGravaLog',
  logStreamName: '2023/12/13/[$LATEST]c30e5dbda75f41a4a6eab5d61b4e7f8a',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:028901343047:function:ReturnDevProcessosGravaLog',
  awsRequestId: '288a85ea-966d-4f42-878e-a58e29ea4cab',
};

handler(event as any, context as any);
