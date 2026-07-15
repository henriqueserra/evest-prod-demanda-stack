import { handler } from './index';

const event = {
  Records: [
    {
      eventID: 'bcb4a66c3b1ad9b3bca84c531f08255d',
      eventName: 'REMOVE',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1741367002,
        Keys: {
          sk: {
            S: 'status::',
          },
          pk: {
            S: 'f3db0422-5d14-4c86-a06a-fde83ca1d070',
          },
        },
        NewImage: {},
        OldImage: {
          created_at: {
            S: '2024-12-02T17:05:51.951Z',
          },
          demanda_dado_convertido: {
            BOOL: true,
          },
          usuario_atuando: {
            S: '',
          },
          prioridade: {
            BOOL: false,
          },
          updated_at: {
            S: '2025-02-05T20:27:56.025Z',
          },
          sk: {
            S: 'status::',
          },
          status_demanda_anterior: {
            S: 'EmailEnviado',
          },
          cod_nup: {
            S: '0',
          },
          proxima_etapa: {
            S: '01',
          },
          is_active: {
            BOOL: true,
          },
          identificacao: {
            S: 'Não informado',
          },
          sla_horas: {
            N: '9',
          },
          data_carimbo: {
            S: '2024-12-02T17:05:51.978Z',
          },
          due_date: {
            S: '2024-12-03T17:05:51.978Z',
          },
          historico: {
            L: [
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:51.951Z',
                  },
                  criado_por: {
                    S: 'andrezza.cardoso@neon.com.br',
                  },
                  mensagem: {
                    S: 'StatusCriado',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.239Z',
                  },
                  criado_por: {
                    S: 'andrezza.cardoso@neon.com.br',
                  },
                  mensagem: {
                    S: 'StatusCriado => DemandaIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.373Z',
                  },
                  criado_por: {
                    S: 'NeonProdTipificacaoAutomatica',
                  },
                  mensagem: {
                    S: 'DemandaIniciada => TipificacaoAutomaticaIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.385Z',
                  },
                  criado_por: {
                    S: 'NeonProdTipificacaoAutomatica',
                  },
                  mensagem: {
                    S: 'TipificacaoAutomaticaIniciada => TipificacaoAutomaticaFinalizada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.539Z',
                  },
                  criado_por: {
                    S: 'NeonProdTipificacaoManual',
                  },
                  mensagem: {
                    S: 'TipificacaoAutomaticaFinalizada => TipificacaoManualIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.551Z',
                  },
                  criado_por: {
                    S: 'NeonProdTipificacaoManual',
                  },
                  mensagem: {
                    S: 'TipificacaoManualIniciada => TipificacaoManualFinalizada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:52.661Z',
                  },
                  criado_por: {
                    S: 'NeonProdExtracaoAutomatica',
                  },
                  mensagem: {
                    S: 'TipificacaoManualFinalizada => ExtracaoAutomaticaIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:54.449Z',
                  },
                  criado_por: {
                    S: 'NeonProdExtracaoAutomatica',
                  },
                  mensagem: {
                    S: 'ExtracaoAutomaticaIniciada => ExtracaoAutomaticaFinalizada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:54.575Z',
                  },
                  criado_por: {
                    S: 'NeonProdExtracaoManual',
                  },
                  mensagem: {
                    S: 'ExtracaoAutomaticaFinalizada => ExtracaoManualIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:54.597Z',
                  },
                  criado_por: {
                    S: 'NeonProdExtracaoManual',
                  },
                  mensagem: {
                    S: 'ExtracaoManualIniciada => ExtracaoManualFinalizada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:54.751Z',
                  },
                  criado_por: {
                    S: 'NeonProdPreEgOito',
                  },
                  mensagem: {
                    S: 'ExtracaoManualFinalizada => PreEgOitoIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-02T17:05:54.784Z',
                  },
                  criado_por: {
                    S: 'NeonProdPreEgOito',
                  },
                  mensagem: {
                    S: 'PreEgOitoIniciada => EsteiraOito',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-03T22:03:08.153Z',
                  },
                  criado_por: {
                    S: 'sara.correia@oito.srv.br',
                  },
                  mensagem: {
                    S: 'EsteiraOito => PosEGOitoIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-03T22:03:09.039Z',
                  },
                  criado_por: {
                    S: 'sara.correia@oito.srv.br',
                  },
                  mensagem: {
                    S: 'PosEGOitoIniciada => PosEGOitoFinalizada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-03T22:03:09.272Z',
                  },
                  criado_por: {
                    S: 'NeonProdPosEgOito',
                  },
                  mensagem: {
                    S: 'PosEGOitoFinalizada => AuditoriaOito',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-04T15:11:37.734Z',
                  },
                  criado_por: {
                    S: 'ana.dalmolin@oito.srv.br',
                  },
                  mensagem: {
                    S: 'AuditoriaOito => PosAuditoriaOito',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-04T15:11:37.849Z',
                  },
                  criado_por: {
                    S: 'NeonProdPosAuditoriaOito',
                  },
                  mensagem: {
                    S: 'PosAuditoriaOito => PosAuditoriaOitoIniciada',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-04T15:11:38.787Z',
                  },
                  criado_por: {
                    S: 'NeonProdEmailAutomatico',
                  },
                  mensagem: {
                    S: 'PosAuditoriaOitoIniciada => EmailAutomaticoIniciado',
                  },
                },
              },
              {
                M: {
                  criado_em: {
                    S: '2024-12-04T15:11:39.967Z',
                  },
                  criado_por: {
                    S: 'NeonProdEmailAutomatico',
                  },
                  mensagem: {
                    S: 'EmailAutomaticoIniciado => EmailEnviado',
                  },
                },
              },
            ],
          },
          status_demanda: {
            S: 'EmailEnviado',
          },
          created_by: {
            S: 'andrezza.cardoso@neon.com.br',
          },
          cliente: {
            S: 'Neon',
          },
          migrado_demanda_dado: {
            BOOL: true,
          },
          produto: {
            S: 'Oficio',
          },
          tipo_demanda: {
            S: 'Cadastro Ofício',
          },
          processo: {
            S: '0000620-04.2019.5.09.0088',
          },
          updated_by: {
            S: 'NeonProdEmailAutomatico',
          },
          perfil_demanda: {
            S: 'Operador3',
          },
          pk: {
            S: '34ca5e56-f268-4f9f-92be-759e1bc3a966',
          },
        },
        SequenceNumber: '667715900003319745155936685',
        SizeBytes: 6107,
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
