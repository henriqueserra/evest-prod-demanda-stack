import { PreSignUpAdminCreateUserTriggerEvent } from 'aws-lambda';
import { UserInterface } from './everest.interfaces';
import { EverestApoioDateTimeService } from './everest.apoio.dateTime.service';
import {
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
  AdminDisableUserCommand,
  AdminDisableUserCommandInput,
  AdminGetUserCommand,
  AdminGetUserCommandInput,
  AdminGetUserCommandOutput,
  CognitoIdentityProviderClient,
  DeliveryMediumType,
  GetUserCommand,
  GetUserCommandInput,
  GetUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBServices } from './dynamodb.services';
import { EverestLogService } from './everest.log.services';

// const region = process.env.AWSREGION;
// const accessKeyId = process.env.AWSACESSKEYID;
// const secretAccessKey = process.env.AWSSECRETACCESSKEY;

// if (!region || !accessKeyId || !secretAccessKey) {
//   throw new Error('AWS configuration environment variables are not set properly.');
// }

const cognitoClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
  // credentials: {
  //   accessKeyId,
  //   secretAccessKey,
  // },
});

const routeName = 'EverestUserService';

const logService = new EverestLogService();

export class EverestUserService {
  private user!: UserInterface;
  readonly userEmail: string;
  readonly tableName: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.tableName = `Tbl${process.env.ENVIRONMENT}Users`;
  }

  async init() {
    this.user = await this.getUser();
  }

  async getUser(): Promise<UserInterface> {
    try {
      const user = (await DynamoDBServices.getItemWithouSk({
        tableName: this.tableName,
        pk: this.userEmail,
      })) as UserInterface;

      let atualizarUser: boolean = false;

      if (!user?.OperadorOitoMaster) {
        user.OperadorOitoMaster = false;
        atualizarUser = true;
      }
      if (!user?.EOC) {
        user.EOC = false;
        atualizarUser = true;
      }
      if (!user?.EscolheEsteiraOito) {
        user.EscolheEsteiraOito = false;
        atualizarUser = true;
      }

      if (atualizarUser) {
        await this.updateUser(user);
      }

      this.user = user;
      return user;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  async getUserFromUserEmail({ user_email }: { user_email: string }) {
    try {
      if (!this.user) await this.init();

      const getUserParams: AdminGetUserCommandInput = {
        UserPoolId: process.env.USER_POOL_ID as string,
        Username: user_email,
      };

      const response: AdminGetUserCommandOutput = await cognitoClient.send(new AdminGetUserCommand(getUserParams));

      const userName = response.UserAttributes?.find((attr) => attr.Name === 'name')?.Value;

      const userEmail = response.UserAttributes?.find((attr) => attr.Name === 'email')?.Value;

      return {
        user_id: response.Username,
        user_name: userName,
        user_email: userEmail,
      };
    } catch (error: any) {
      return {};
    }
  }

  async getUserPermitions({ userEmail }: { userEmail: string }) {
    try {
      return (await DynamoDBServices.getItemWithouSk({
        tableName: this.tableName,
        pk: userEmail,
      })) as UserInterface;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getUserPermitions - ${error.message}`);
    }
  }

  async createUser(payload: PreSignUpAdminCreateUserTriggerEvent) {
    try {
      if (!this.user) await this.init();

      const newUser: UserInterface = {
        AdminCliente: [],
        AdminOito: [],
        OperadorCliente: [],
        OperadorOito: [],
        PortalUpload: [],
        pk: payload.request.userAttributes.email,
        sub: payload.userName,
        name: payload.request.userAttributes.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'Cognito',
        is_active: true,
        EOC: false,
        EscolheEsteiraOito: false,
        OperadorOitoMaster: false,
      };

      newUser.sub = payload.userName;
      newUser.updated_at = new Date().toISOString();
      newUser.updated_by = 'Cognito';

      return await DynamoDBServices.genericPutItem({
        tableName: this.tableName,
        item: newUser,
      });
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`createUser - ${error.message}`);
    }
  }

  async createCognitoLogsEntry({ userEmail, trigger_source }: { userEmail: string; trigger_source: string }) {
    try {
      return;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`createCognitoLogsEntry - ${error.message}`);
    }
  }

  async listAllUsers() {
    try {
      if (!this.user) await this.init();

      return await DynamoDBServices.scanItems({
        tableName: this.tableName,
        filterExpression: 'is_active = :is_active',
        expressionAttributeValues: {
          ':is_active': { BOOL: true },
        },
      });
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`listAllUsers - ${error.message}`);
    }
  }

  async getUserFromAccessToken({ accessToken }: { accessToken: string }) {
    try {
      const getUserParams: GetUserCommandInput = {
        AccessToken: accessToken,
      };

      const response: GetUserCommandOutput = await cognitoClient.send(new GetUserCommand(getUserParams));

      const userName = response.UserAttributes?.find((attr) => attr.Name === 'name')?.Value;

      const userEmail = response.UserAttributes?.find((attr) => attr.Name === 'email')?.Value;

      return {
        user_id: response.Username,
        user_name: userName,
        user_email: userEmail,
      };
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }

  async updateUser(payload: UserInterface) {
    try {
      return await DynamoDBServices.genericPutItem({
        tableName: this.tableName,
        item: payload,
      });
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`updateUser - ${error.message}`);
    }
  }

  async updateUserLoginOrRefresh() {
    try {
      const user = await this.getUser();

      const payload = {
        ...user,
        last_login: new Date().toISOString(),
      };

      return await DynamoDBServices.genericPutItem({
        tableName: this.tableName,
        item: payload,
      });
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`updateUserLoginOrRefresh - ${error.message}`);
    }
  }

  async createCognitoUser({ userEmail, userName }: { userEmail: string; userName: string }) {
    try {
      const newUser: any = {};

      // Extrair dados do payload

      if (!userEmail || !userName) {
        throw new Error('Email e nome são obrigatórios para criar um usuário');
      }

      // Configurar parâmetros para criação do usuário no Cognito
      const params: AdminCreateUserCommandInput = {
        UserPoolId: process.env.USER_POOL_ID || '',
        Username: userEmail,
        TemporaryPassword: '123@Mudar',
        UserAttributes: [
          {
            Name: 'email',
            Value: userEmail,
          },
          {
            Name: 'name',
            Value: userName,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        DesiredDeliveryMediums: [DeliveryMediumType.EMAIL],
      };

      // Criar usuário no Cognito
      const cognitoIdentityServiceProvider = new AdminCreateUserCommand(params);

      const response = await cognitoClient.send(cognitoIdentityServiceProvider);

      return response;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`createCognitoUser - ${error.message}`);
    }
  }

  async deleteCognitoUser() {
    const methodName = `${routeName}.deleteCognitoUser`;

    try {
      debugger;

      await this.getUser();

      const userEmail = this.user.pk;

      const disableUserParams: AdminDisableUserCommandInput = {
        UserPoolId: process.env.USER_POOL_ID || '',
        Username: this.user.sub,
      };

      const disableUserCommand = new AdminDisableUserCommand(disableUserParams);

      await cognitoClient.send(disableUserCommand);

      const deleteUserParams: AdminDeleteUserCommandInput = {
        UserPoolId: process.env.USER_POOL_ID || '',
        Username: this.user.sub,
      };

      const deleteUserCommand = new AdminDeleteUserCommand(deleteUserParams);

      await cognitoClient.send(deleteUserCommand);

      await DynamoDBServices.deleteItem({
        tableName: this.tableName,
        item: {
          pk: userEmail,
        },
      });

      logService.info({ message: `Finalizado ...`, method: methodName });
      return;
    } catch (error: any) {
      debugger;
      logService.error({ message: error.message, method: methodName });
      throw new Error(`${methodName} :: ${error.message}`);
    }
  }
}
