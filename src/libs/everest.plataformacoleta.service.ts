import { LambdaServices } from './lambda.services';

export class EverestPlataformaColetaService {
  public static async atualizaCitacaoIntegrada({
    cod_citacao_dado,
    ind_conferido_contencioso,
  }: {
    cod_citacao_dado: string;
    ind_conferido_contencioso: boolean;
  }) {
    try {
      return LambdaServices.invokeLambda({
        lambdaName: `Everest${process.env.ENVIRONMENT}AtualizaCitacaoIntegrada`,
        payload: {
          cod_citacao_dado,
          ind_conferido_contencioso,
        },
      });
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`${error.message}`);
    }
  }

  public static async consultaNup({ nup }: { nup: string }) {
    return LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ConsultaNup`,
      payload: {
        nup,
      },
    });
  }

  public static async executaQuery({ query }: { query: string }) {
    return await LambdaServices.invokeLambda({
      lambdaName: `Everest${process.env.ENVIRONMENT}ExecutaQuery`,
      payload: query,
    });
  }
}
