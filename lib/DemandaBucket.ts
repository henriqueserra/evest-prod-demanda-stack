import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EverestBucketConstructor } from './cdkLibs/everest.bucket.constructor';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DemandaBucket extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    EverestBucketConstructor.createBucketWithoutExpiration({
      scope: this,
      props: props,
      bucketName: `Demanda`,
    });
    /* -------------------------------------------------------------------------- */

    EverestBucketConstructor.createBucketWithoutExpiration({
      scope: this,
      props: props,
      bucketName: `DemandaLogs`,
    });
    /* -------------------------------------------------------------------------- */

    EverestBucketConstructor.createBucketWithoutExpirationAndWithVersioning({
      scope: this,
      props: props,
      bucketName: `Repositorios`,
    });
    /* -------------------------------------------------------------------------- */

    // ANS
    EverestBucketConstructor.createBucketWithoutExpiration({
      scope: this,
      props: props,
      bucketName: `SasAnsResposta`,
    });
    // ANS
    EverestBucketConstructor.createBucketWithoutExpiration({
      scope: this,
      props: props,
      bucketName: `SasAnsProtocolo`,
    });

    // Email
    EverestBucketConstructor.createBucketWithoutExpiration({
      scope: this,
      props: props,
      bucketName: `EmailEvidencias`,
    });
  }
}
