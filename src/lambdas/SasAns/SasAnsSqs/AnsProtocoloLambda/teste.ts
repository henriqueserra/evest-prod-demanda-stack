import { Context, SQSEvent } from 'aws-lambda';
import { handler } from '.';

const event: SQSEvent = {
  Records: [
    {
      messageId: '3ed2d9a2-f2c4-4c66-b633-09c3b1fb9ffc',
      receiptHandle:
        'AQEBrJ3ojy0B70hFj8/zuD5LLYGli80WMjeByiQLS0pHOFzyg1N3/QshqY2m72Amcak5HxOEB9nEE2IOhNy3/D5y1mO1wl2IPOjEOzCghOKA8id63ZFrjhbpFVVnGAd/uTbuMnzRCVectbEJVhgPT0LKmzuFLcNSbvUEEiYPfQFPS/OLXxFizHCcD/QlG0bRHHC0QF7iqEJngEE4e1YaNwTUAP3ajTqaY/5xoqK7c55N4QrZUIjk3BkeX6oyTEYtwDNF346D6PVd97SjYSKBBn7khjt58cjZDR964y1eNUa3hqWCAG6K5M8GV5/M8MEQlPlpADUNyn6OB53GLCxgZB49Se5Xoi/pQDt8f9dKq1lYybUzZQTsXVdL94/4puvrEzu4EWbxROSy0+IABsZrtfypzA==',
      body: '{"sucesso":true,"mensagemErro":null,"arquivosGerados":[{"path":"resposta-ans/13301704/comprovante.pdf","tipo":"protocolo"},{"path":"resposta-ans/13301704/ScreenRecording 2025-02-12 at 08.38.10.avi","tipo":"video"}],"payload":{"operadora":"006246","protocolo":"00624620250130033141","nip":"13301704","bucket":"everest.prod.sasansresposta","region":"us-east-1","arquivos":[{"path":"13301704/DOC_1739359607888.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359903962.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359784097.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359776509.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359534375.pdf","tipo":"Proposta de adesão assinada ou documento equivalente"},{"path":"13301704/DOC_1739359558785.pdf","tipo":"Comprovante de contato com o beneficiário ou interlocutor"},{"path":"13301704/DOC_1739359642641.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359541658.pdf","tipo":"Proposta de adesão assinada ou documento equivalente"},{"path":"13301704/DOC_1739359549750.pdf","tipo":"Contrato, aditivos, anexos e termo de adaptação contratual, se houver"},{"path":"13301704/DOC_1739360028760.pdf","tipo":"Outros"},{"path":"13301704/DOC_1739359988173.pdf","tipo":"Outros"},{"path":"13301704/DOC_1739359872870.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359677967.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359849546.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359748181.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359894789.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359977354.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359996819.pdf","tipo":"Outros"},{"path":"13301704/DOC_1739359933129.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359670251.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359756573.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359699511.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359950003.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739360018667.pdf","tipo":"Outros"},{"path":"13301704/DOC_1739360009604.pdf","tipo":"Outros"},{"path":"13301704/DOC_1739359661231.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359923447.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359829786.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359887728.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359567954.pdf","tipo":"Comprovante de contato com o beneficiário ou interlocutor"},{"path":"13301704/DOC_1739359586489.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359594736.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359601376.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359614695.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359621087.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359633456.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359719886.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359731262.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359685425.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359711187.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359740030.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359769028.pdf","tipo":"Documentação apresentada para solicitação de reembolso"},{"path":"13301704/DOC_1739359965327.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359840806.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359857145.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359865264.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359880398.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359915845.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359942138.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739359958338.pdf","tipo":"Comprovante de efetivação do reembolso"},{"path":"13301704/DOC_1739360038251.pdf","tipo":"Comprovante de contato com o beneficiário ou interlocutor"},{"path":"13301704/RESPOSTA NIP DM 13301704 LITIS DM 13131945 ERIC JOSE DOS SANTOS_1739360049278.pdf","tipo":"Outros"}]}}',
      attributes: {
        ApproximateReceiveCount: '2',
        SentTimestamp: '1739360542564',
        SenderId: 'AIDAQNOVHP5DXDSMCZISI',
        ApproximateFirstReceiveTimestamp: '1739360543564',
      },
      messageAttributes: {
        JavaType: {
          stringValue: 'br.srv.oito.crawler.resposta.ans.service.RespostaAnsResponse',
          stringListValues: [],
          binaryListValues: [],
          dataType: 'String',
        },
        contentType: {
          stringValue: 'application/json',
          stringListValues: [],
          binaryListValues: [],
          dataType: 'String',
        },
      },
      md5OfMessageAttributes: '056711723d90f5e2023429593426050d',
      md5OfBody: '0086f6e6dc74be544389befede7f9e19',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:028901343047:EverestProdAnsProtocolo',
      awsRegion: 'us-east-1',
    },
  ],
};

const teste = async () => {
  const result = await handler(event as SQSEvent, {} as Context);
  console.log(JSON.stringify(result));
};

teste();
