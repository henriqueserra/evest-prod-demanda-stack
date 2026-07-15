import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AccountRecovery,
  FeaturePlan,
  StandardThreatProtectionMode,
  UserPool,
  UserPoolClient,
  UserPoolEmail,
} from 'aws-cdk-lib/aws-cognito';
import { StackProps, Tags } from 'aws-cdk-lib';

export class Cognito extends cdk.Stack {
  readonly userPool: UserPool;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const name = `Everest${props.tags?.Environment}UserPool`;

    let url = 'https://everest2.oito.srv.br/everest/portal/auth/login';
    if (props.tags?.Environment === 'Dev') {
      url = 'https://everestdev.oito.srv.br/everest/portal/auth/login';
    }
    const userPool: UserPool = new UserPool(this, name, {
      userPoolName: name,
      signInCaseSensitive: false,
      selfSignUpEnabled: false,
      userInvitation: {
        emailSubject: '[Everest] - Sign in - Senha temporária',
        emailBody: `Olá !
          
          Você foi cadastrado na plataforma Everest da Oito Tecnologia S.A.
          
          Seu usuário para o é {username} e sua senha temporária é {####}.
          
          Faça seu login em: ${url} utilizando a senha temporária e em seguida, você será solicitado a criar uma nova senha.
          
          Atenciosamente,
          
          Equipe Everest - Oito Tecnologia S.A.`,
      },
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      email: UserPoolEmail.withCognito('henrique.serra@oito.srv.br'),
      lambdaTriggers: {},
      standardThreatProtectionMode: StandardThreatProtectionMode.AUDIT_ONLY,
      featurePlan: FeaturePlan.PLUS,
    });

    const userPoolClient: UserPoolClient = new UserPoolClient(this, `${name}Client`, {
      userPool: userPool,
      generateSecret: false, // Set to true if you need a secret for the client
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
    });

    // Log the User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
      value: userPoolClient.userPoolClientId,
      description: 'The Client ID of the User Pool',
    });

    Tags.of(userPool).add('Description', `${props?.tags?.Description}`);
    Tags.of(userPool).add('Project', `${props?.tags?.Project}`);
    Tags.of(userPool).add('Environment', `${props?.tags?.Environment}`);
  }
}
