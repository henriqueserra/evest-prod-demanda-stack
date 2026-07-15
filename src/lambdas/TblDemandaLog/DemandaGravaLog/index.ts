import { Context, DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { EverestLogService } from '../../../libs/everest.log.service';
import { Everest2DemandaService } from '../../../libs/everest.demanda.service';
import { GmailService } from '../../../libs/gmail.service';
import { DynamoDBServices } from '../../../libs/dynamodb.services';
import { S3Service } from '../../../libs/s3.service';
import { SqsServices } from '../../../libs/sqs.services';

const logsService = new EverestLogService();

export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<any> => {
  console.info('event');
  console.info(JSON.stringify(event));
  console.info('context');
  console.info(JSON.stringify(context));
  let pk: string = event.Records[0].dynamodb?.Keys?.pk?.S || '';

  try {
    for (let Record of event.Records as DynamoDBRecord[]) {
      if (JSON.stringify(Record).length > 260000) {
        delete Record.dynamodb?.OldImage;
      }
      await SqsServices.sqsSendMessageFifo({
        queueName: `Everest${process.env.ENVIRONMENT}TblDemandaTriggerSqs.fifo`,
        messageBody: JSON.stringify(Record),
      });

      const eventName = Record.eventName;

      let newImage: any = {};
      let oldImage: any = {};
      let pkService: Everest2DemandaService;

      switch (eventName) {
        case 'INSERT':
          newImage = unmarshall(Record.dynamodb?.NewImage as Record<string, AttributeValue>);
          pkService = new Everest2DemandaService({ pk: newImage.pk });

          try {
            await pkService.getStatus();
          } catch (error) {
            break;
          }

          if (newImage.sk === 'status::') {
            const propriedadesAlvo = [
              'status_demanda',
              'perfil_demanda',
              'tipo_demanda',
              'id_cliente',
              'processo',
              'identificacao',
            ];

            for (const propriedade of propriedadesAlvo) {
              const valorNovo = newImage[propriedade] ?? undefined;
              console.log(`INSERT : ${propriedade}`);
              if (valorNovo) {
                await pkService.deleteDemandaDadoByCampo({ campo: propriedade });
                await pkService.createDemandaDado({
                  name: propriedade,
                  value: newImage[propriedade],
                  sk: `${propriedade}::${newImage[propriedade]}`,
                  created_by: newImage.updated_by,
                });
              }
            }
          }

          debugger;
          break;
        case 'MODIFY':
          newImage = unmarshall(Record.dynamodb?.NewImage as Record<string, AttributeValue>);
          oldImage = unmarshall(Record.dynamodb?.OldImage as Record<string, AttributeValue>);
          pkService = new Everest2DemandaService({ pk: newImage.pk });

          try {
            await pkService.getStatus();
          } catch (error) {
            break;
          }

          if (newImage.sk === 'status::') {
            const propriedadesAlvo = [
              'status_demanda',
              'perfil_demanda',
              'tipo_demanda',
              'id_cliente',
              'processo',
              'identificacao',
            ];

            for (const propriedade of propriedadesAlvo) {
              console.log(`MODIFY : ${propriedade}`);

              const valorNovo = newImage[propriedade] ?? undefined;
              const valorVelho = oldImage[propriedade] ?? undefined;
              if (valorNovo !== valorVelho && valorNovo) {
                await pkService.deleteDemandaDadoByCampo({ campo: propriedade });
                await pkService.createDemandaDado({
                  name: propriedade,
                  value: valorNovo,
                  sk: `${propriedade}::${valorNovo}`,
                  created_by: `${newImage.updated_by}_grava_log`,
                });
              }
            }

            // Obtém o último registro do histórico
            const historicoEsteiraOito = newImage.historico?.filter((item: any) =>
              item.mensagem.startsWith('EsteiraOito')
            );
            const ultimoHistorico = historicoEsteiraOito?.[historicoEsteiraOito.length - 1];

            console.log('Último registro do histórico:', ultimoHistorico);
            debugger;
          }
          debugger;
          break;
        case 'REMOVE':
          oldImage = unmarshall(Record.dynamodb?.OldImage as Record<string, AttributeValue>);

          if (oldImage.sk === 'status::') {
            const dadosBrutos1 = await DynamoDBServices.queryItems({
              tableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
              keyConditionExpression: 'pk = :pk',
              expressionAttributeValues: {
                ':pk': { S: pk },
              },
            });

            let arquivos = dadosBrutos1?.filter((item: any) => item.sk.startsWith('arquivo::'));
            for (const arquivo of arquivos) {
              try {
                await S3Service.s3DeleteObject({
                  s3Bucket: arquivo.s3Bucket as string,
                  s3Key: arquivo.s3Key,
                });
              } catch (error) {
                debugger;
                console.error(`Erro ao deletar arquivo ${arquivo.s3Key} do bucket ${arquivo.s3Bucket}`);
              }
            }

            for (const element of dadosBrutos1) {
              await DynamoDBServices.deleteItem({
                tableName: `Tbl${process.env.ENVIRONMENT}Demanda`,
                item: {
                  pk: element.pk,
                  sk: element.sk,
                },
              });
            }

            const dadosBrutos2 = await DynamoDBServices.queryItems({
              tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
              keyConditionExpression: 'pk = :pk',
              expressionAttributeValues: {
                ':pk': { S: pk },
              },
            });

            arquivos = dadosBrutos2?.filter((item: any) => item.sk.startsWith('arquivo::'));
            for (const arquivo of arquivos) {
              try {
                await S3Service.s3DeleteObject({
                  s3Bucket: arquivo?.value?.s3Bucket as string,
                  s3Key: arquivo?.value?.s3Key as string,
                });
              } catch (error) {
                debugger;
                console.error(`Erro ao deletar arquivo ${arquivo.s3Key} do bucket ${arquivo.s3Bucket}`);
              }
            }

            for (const element of dadosBrutos2) {
              await DynamoDBServices.deleteItem({
                tableName: `Tbl${process.env.ENVIRONMENT}DemandaDado`,
                item: {
                  pk: element.pk,
                  sk: element.sk,
                },
              });
            }

            const dadosPortalUploads = await DynamoDBServices.queryItems({
              tableName: `Tbl${process.env.ENVIRONMENT}PortalUploads`,
              keyConditionExpression: 'pk = :pk',
              expressionAttributeValues: {
                ':pk': { S: pk },
              },
            });
            for (const element of dadosPortalUploads) {
              debugger;
            }
          }
          break;
        default:
          debugger;
          break;
      }
    }

    return {};
  } catch (error: any) {
    console.error('Error Message: ', error.message);
    const pkService = new Everest2DemandaService({ pk: pk });
    await pkService.updateStatus({
      updated_by: `${process.env.LAMBDA_NAME}`,
      status_demanda: 'ExcecaoOito',
      nova_observacao: `${process.env.LAMBDA_NAME} - ${error.message}`,
    });
    await GmailService.notificaErro({
      lambda: process.env.LAMBDA_NAME as string,
      event,
      context,
      erro: `${process.env.LAMBDA_NAME} - ${error.message}`,
    });
  }
};
