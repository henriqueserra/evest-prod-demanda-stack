import {
  GetFunctionCommand,
  GetFunctionCommandInput,
  InvocationType,
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({
  region: 'us-east-1',
});

export class LambdaServices {
  static getFunctionInfo = async (lambdaName: string) => {
    try {
      const params: GetFunctionCommandInput = {
        FunctionName: lambdaName,
      };
      const command = new GetFunctionCommand(params);
      await lambdaClient.send(command);
      return true;
    } catch (error) {
      console.error(lambdaName);
      return false;
    }
  };

  public static invokeLambda = async ({ lambdaName, payload }: { lambdaName: string; payload: any }) => {
    try {
      if (!lambdaName) throw new Error('Nome da lambda não informado');
      if (!(await this.getFunctionInfo(lambdaName))) {
        throw new Error(`Lambda ${lambdaName} não encontrada`);
      }
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(JSON.stringify(payload));
      const params: InvokeCommandInput = {
        FunctionName: lambdaName,
        Payload: payloadBytes,
        InvocationType: InvocationType.RequestResponse,
      };
      const command = new InvokeCommand(params);
      const response = await lambdaClient.send(command);
      const dados = JSON.parse(Buffer.from(response.Payload as Uint8Array).toString());
      if (dados.errorMessage) {
        throw new Error(`Erro ao invocar o lambda ${lambdaName}: ${dados.errorMessage}`);
      }
      return dados;
    } catch (error: any) {
      throw new Error(`invokeLambda - ${error.message} - stack => ${error.stack}`);
    }
  };

  public static invokeLambdaAsync = async ({ lambdaName, payload }: { lambdaName: string; payload: any }) => {
    try {
      if (!lambdaName) throw new Error('Nome da lambda não informado');
      if (!(await this.getFunctionInfo(lambdaName))) {
        throw new Error(`Lambda ${lambdaName} não encontrada`);
      }
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(JSON.stringify(payload));
      const params: InvokeCommandInput = {
        FunctionName: lambdaName,
        Payload: payloadBytes,
        InvocationType: InvocationType.Event,
      };
      const command = new InvokeCommand(params);
      const response = await lambdaClient.send(command);
      if (response.StatusCode !== 202) {
        throw new Error(`Erro ao invocar o lambda ${lambdaName}: ${response.StatusCode}`);
      }

      return true;
    } catch (error: any) {
      throw new Error(`invokeLambdaAsync - ${error.message} - stack => ${error.stack}`);
    }
  };
}
