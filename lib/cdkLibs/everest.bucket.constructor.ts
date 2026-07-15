import { StackProps, aws_s3, RemovalPolicy, Duration, Tags, aws_s3_notifications } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CorsRule, Bucket, IntelligentTieringConfiguration } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class EverestBucketConstructor {
  static CreateBucketWithExpiration({
    scope,
    props,
    bucketName,
    deleteAfterDays,
  }: {
    scope: Construct;
    props: StackProps;
    bucketName: string;
    deleteAfterDays: number;
  }) {
    //
    const bucketID = `${props.tags?.Project}${props.tags?.Environment}${bucketName}`;
    const newBucketName = `${props.tags?.Project}.${props.tags?.Environment}.${bucketName}`.toLowerCase();
    //

    const corsRules: CorsRule[] = [
      {
        allowedMethods: [aws_s3.HttpMethods.GET],
        allowedOrigins: ['*'],
      },
    ];

    const bucket = new Bucket(scope, bucketID, {
      bucketName: newBucketName,
      versioned: false,
      objectLockEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      cors: corsRules,
      eventBridgeEnabled: false,
      lifecycleRules: [
        {
          id: 'DeleteOldObjects',
          enabled: true,
          expiration: Duration.days(deleteAfterDays), // Number of days before objects are deleted
        },
      ],
    });

    Tags.of(bucket).add('Description', `${props?.tags?.Description}`);
    Tags.of(bucket).add('Project', `${props?.tags?.Project}`);
    Tags.of(bucket).add('Environment', `${props?.tags?.Environment}`);

    return bucket;
  }

  static createBucketWithoutExpiration({
    scope,
    props,
    bucketName,
  }: {
    scope: Construct;
    props: StackProps;
    bucketName: string;
  }) {
    //
    const bucketID = `${props.tags?.Project}${props.tags?.Environment}${bucketName}`;
    const newBucketName = `${props.tags?.Project}.${props.tags?.Environment}.${bucketName}`.toLowerCase();
    //

    const corsRules: CorsRule[] = [
      {
        allowedMethods: [aws_s3.HttpMethods.GET],
        allowedOrigins: ['*'],
      },
    ];

    const intelligentTieringParams: IntelligentTieringConfiguration = {
      name: 'everest-intelligent-tiering',
      archiveAccessTierTime: Duration.days(365),
    };

    const bucket = new Bucket(scope, bucketID, {
      bucketName: newBucketName,
      versioned: false,
      objectLockEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      cors: corsRules,
      intelligentTieringConfigurations: [intelligentTieringParams],
      eventBridgeEnabled: false,
    });

    Tags.of(bucket).add('Description', `${props?.tags?.Description}`);
    Tags.of(bucket).add('Project', `${props?.tags?.Project}`);
    Tags.of(bucket).add('Environment', `${props?.tags?.Environment}`);

    return bucket;
  }

  static createBucketWithoutExpirationAndWithVersioning({
    scope,
    props,
    bucketName,
  }: {
    scope: Construct;
    props: StackProps;
    bucketName: string;
  }) {
    //
    const bucketID = `${props.tags?.Project}${props.tags?.Environment}${bucketName}`;
    const newBucketName = `${props.tags?.Project}.${props.tags?.Environment}.${bucketName}`.toLowerCase();
    //

    const corsRules: CorsRule[] = [
      {
        allowedMethods: [aws_s3.HttpMethods.GET],
        allowedOrigins: ['*'],
      },
    ];

    const intelligentTieringParams: IntelligentTieringConfiguration = {
      name: 'everest-intelligent-tiering',
      archiveAccessTierTime: Duration.days(365),
    };

    const bucket = new Bucket(scope, bucketID, {
      bucketName: newBucketName,
      versioned: true,
      objectLockEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      cors: corsRules,
      intelligentTieringConfigurations: [intelligentTieringParams],
      eventBridgeEnabled: false,
    });

    Tags.of(bucket).add('Description', `${props?.tags?.Description}`);
    Tags.of(bucket).add('Project', `${props?.tags?.Project}`);
    Tags.of(bucket).add('Environment', `${props?.tags?.Environment}`);

    return bucket;
  }

  static createBucketWithExpirationWithTrigger = ({
    scope,
    props,
    bucketName,
    deleteAfterDays,
    lambdaTarget,
  }: {
    scope: Construct;
    props: StackProps;
    bucketName: string;
    deleteAfterDays: number;
    lambdaTarget: NodejsFunction;
  }) => {
    //
    const bucketID = `Everest${props.tags?.Environment}${bucketName}`;
    const newBucketName = `Everest.${props.tags?.Environment}.${bucketName}`.toLowerCase();
    //

    const corsRules: CorsRule[] = [
      {
        allowedMethods: [aws_s3.HttpMethods.GET],
        allowedOrigins: ['*'],
      },
    ];

    const bucket = new Bucket(scope, bucketID, {
      bucketName: newBucketName,
      versioned: false,
      objectLockEnabled: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      cors: corsRules,
      eventBridgeEnabled: false,
      lifecycleRules: [
        {
          id: 'DeleteOldObjects',
          enabled: true,
          expiration: Duration.days(deleteAfterDays), // Number of days before objects are deleted
        },
      ],
    });

    // Add S3 event notification to trigger Lambda function
    bucket.addEventNotification(
      aws_s3.EventType.OBJECT_CREATED,
      new aws_s3_notifications.LambdaDestination(lambdaTarget)
    );

    Tags.of(bucket).add('Description', `${props?.tags?.Description}`);
    Tags.of(bucket).add('Project', `${props?.tags?.Project}`);
    Tags.of(bucket).add('Environment', `${props?.tags?.Environment}`);

    return bucket;
  };
}
