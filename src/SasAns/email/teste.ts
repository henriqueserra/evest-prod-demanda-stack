import { EverestSendGridService } from '../../libs/everest.sendgrid.service';
import { S3Service } from '../../libs/s3.service';
import { sendEmailConfirmacaoDemandaRespondida, sendEmailConfirmacaoRecebimentoDemandaResposta } from './sasAnsSendEmails';

const event = {
  num_protocolo: '00624620240524039694',
  num_manifestacao: '97036893',
  lstAnexos: [
    {
      tipificacao: 'Comprovante de efetivação do reembolso',
      nome_anexo:
        'DOC_09_Comprovante de efetivação do reembolso_CALCULO JUROS E MULTA_97036893_1717795688412.pdf',
    },
    {
      tipificacao: 'Comprovante de efetivação do reembolso',
      nome_anexo:
        'DOC_08_Comprovante de efetivação do reembolso_DEMONSTRATIVO DE REEMBOLSO - SR 3176161399 e SR 3171352951_1717795681640.pdf',
    },
    {
      tipificacao: 'Outros',
      nome_anexo:
        'DOC_05_Tabela de refeNOVA TABELA REEMBOLSO 2024 - PÓS LEI - INSTRUÇÕES GERAIS + TABELA SERV 500 - DEZEMBRO 2023 - 10º CARTÓRIO_1717795644092.pdf',
    },
    {
      tipificacao: 'Outros',
      nome_anexo:
        'DOC_06_OUTROS_AVERBAÇÃO DA NOVA TABELA REEMBOLSO_10º CARTÓRIO_1717795649728.pdf',
    },
    {
      tipificacao: 'Comprovante de efetivação do reembolso',
      nome_anexo:
        'DOC_10_Comprovante de efetivação do reembolso_CALCULO_Juros Complementar_97036893_1717795694414.pdf',
    },
    {
      tipificacao: 'Outros',
      nome_anexo:
        'DOC_04_Tabela de referência para a cobertura_TABELA REEMBOLSO_TUSS POS-LEI_1717795631805.pdf',
    },
    {
      tipificacao: 'Comprovante de contato com o beneficiário ou interlocutor',
      nome_anexo:
        'DOC_13_Comprovante de contato com o beneficiário ou interlocutor_COMPLEMENTAR_1717795726649.pdf',
    },
    {
      tipificacao: 'Outros',
      nome_anexo:
        'resposta NIP_DEMANDA12877730_GABRIELA DONATA VICENTE NUNES_1717795595331.pdf',
    },
    {
      tipificacao: 'Proposta de adesão assinada ou documento equivalente',
      nome_anexo:
        'DOC_01_ Proposta de adesão assinada ou documento equivalente_CARTA PERMANENCIA_1717795607893.pdf',
    },
    {
      tipificacao: 'Proposta de adesão assinada ou documento equivalente',
      nome_anexo:
        'DOC_02_ Proposta de adesão assinada ou documento equivalente_PROPOSTA DO SEGURO_1717795616842.pdf',
    },
    {
      tipificacao: 'Contrato, aditivos e anexos',
      nome_anexo:
        'DOC_03_Contrato, aditivos e anexos_CONDICOES GERAIS_1717795622973.pdf',
    },
    {
      tipificacao: 'Comprovante de efetivação do reembolso',
      nome_anexo:
        'DOC_07_Comprovante de efetivação do reembolso_DEMONSTRATIVO DE REEMBOLSO - SR 3176161399_1717795655212.pdf',
    },
    {
      tipificacao:
        'Documentos ou informações pertinentes para a elucidação dos fatos',
      nome_anexo:
        'DOC_11_Documentos ou informações pertinentes para a elucidação dos fatos_VALORES SERVICOS_1717795700494.pdf',
    },
    {
      tipificacao: 'Comprovante de contato com o beneficiário ou interlocutor',
      nome_anexo:
        'DOC_12_Comprovante de contato com o beneficiário ou interlocutor_1717795712570.pdf',
    },
  ],
  codigo_ans: '006246',
};

async function inicio() {
  console.log('inicio');

  await sendEmailConfirmacaoRecebimentoDemandaResposta({ protocolo: '00624620260424024870' });

  // await sendEmailConfirmacaoDemandaRespondida({
  //   protocolo: '00624620260424024870',
  //   arquivo_protocolo: { s3Key: 'resposta-ans/12861892/comprovante.pdf', s3Bucket: 'everest.dev.sasansresposta' },
  //   arquivo_video: { s3Key: 'resposta-ans/12861892/ScreenRecording 2024-05-29 at 18.07.40.avi', s3Bucket: 'everest.dev.sasansresposta' },
  // });
}

inicio();

// const inicio = async () => {
//   try {
//     const content = await S3Service.s3GetObject({
//       s3Key: 'resposta-ans/12854491/comprovante.pdf',
//       s3Bucket: 'everest.dev.sasansresposta',
//     });
//     //   conver Buffer to Base64
//     const contentBase64 = content.toString('base64');
//     const attachment = {
//       content: contentBase64,
//       filename: 'comprovante.pdf',
//       type: 'application/pdf',
//       disposition: 'attachment',
//     };

//     await EverestSendGridService.sendGridSenEmailTemplate({
//       to: 'hserra1@gmail.com',
//       from: {
//         email: 'SasAnsEverest@oito.srv.br',
//         name: 'SasAns Everest',
//       },
//       replyTo: 'hserra1@gmail.com',
//       templateId: 'd-1818ae3f6f2645d7b4e5f1ac4c2f7991',
//       dynamicTemplateData: {
//         protocolo: 'Henrique',
//         data_recebimento: '10/10/2022',
//         excecao: JSON.stringify(event, null, 2),
//       },
//       attachments: [attachment],
//     });
//   } catch (error: any) {
//     console.error(error.message);
//     throw new Error(`inicio - ${error.message}`);
//   }
// };

// inicio();
