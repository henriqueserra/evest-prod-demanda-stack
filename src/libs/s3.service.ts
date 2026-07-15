import {
  CopyObjectCommand,
  CopyObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsCommand,
  ListObjectsCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ObjectCannedACL,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { z } from 'zod';
import { EverestError } from './everest.error.services';
import { LambdaServices } from './lambda.services';
import { Everest2DemandaService, StatusInterface } from './everest.demanda.service';
import dotenv from 'dotenv';
import { ArquivoInterface } from './everest.interfaces';
import path from 'path';
// dotenv.config();

export interface ExtendedHeadObjectCommandOutput extends HeadObjectCommandOutput {
  fileName: string;
  fileSizeMB: number;
}

// const region = process.env.AWSREGION;
// const accessKeyId = process.env.AWSACESSKEYID;
// const secretAccessKey = process.env.AWSSECRETACCESSKEY;

// if (!region || !accessKeyId || !secretAccessKey) {
//   throw new Error('AWS configuration environment variables are not set properly.');
// }

const s3Client = new S3Client({
  // region,
  // credentials: {
  //   accessKeyId,
  //   secretAccessKey,
  // },
});

const s3ClientSa = new S3Client({
  region: 'sa-east-1',
  // credentials: {
  //   accessKeyId,
  //   secretAccessKey,
  // },
});

// Add validation schemas
const s3ParamsSchema = z.object({
  s3Bucket: z.string().min(1, 'Bucket name is required'),
  s3Key: z.string().min(1, 'Key is required'),
});

const s3CopyParamsSchema = s3ParamsSchema.extend({
  s3BucketDestino: z.string().min(1, 'Destination bucket is required'),
  s3KeyDestino: z.string().min(1, 'Destination key is required'),
});

// Add type definitions
interface S3OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class S3Service {
  // Add retry logic for S3 operations
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError;
  }

  // Improved put object with validation
  public static async s3PutObject({
    s3Bucket,
    s3Key,
    buffer,
    metadata,
  }: {
    s3Key: string;
    s3Bucket: string;
    buffer: Buffer;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; data: PutObjectCommandOutput; payload: { s3Bucket: string; s3Key: string } }> {
    try {
      const { s3Bucket: validBucket, s3Key: validKey } = s3ParamsSchema.parse({ s3Bucket, s3Key });

      const putS3ObjectParams: PutObjectCommandInput = {
        Bucket: validBucket,
        Key: validKey,
        Body: buffer,
        Metadata: metadata,
      };

      const result = await this.withRetry(() => s3Client.send(new PutObjectCommand(putS3ObjectParams)));

      return {
        success: true,
        data: result,
        payload: { s3Bucket, s3Key },
      };
    } catch (error: any) {
      const errorMessage = `Failed to put object to S3: ${error.message}`;
      throw new EverestError(errorMessage);
    }
  }

  public static async s3PutObjectAcl({
    s3Bucket,
    s3Key,
    buffer,
  }: {
    s3Key: string;
    s3Bucket: string;
    buffer: Buffer;
  }): Promise<any> {
    try {
      const putS3ObjectParams: PutObjectCommandInput = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: buffer,
        ACL: 'public-read',
      };
      const result = await s3Client.send(new PutObjectCommand(putS3ObjectParams));

      return { payload: { s3Bucket, s3Key, s3Region: 'us-east-1' }, result };
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(error.message);
    }
  }

  public static async extractDataFromS3Response(body: any): Promise<Buffer> {
    const stream = body as Readable;

    const data: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.once('end', () => resolve(Buffer.concat(chunks)));
      stream.once('error', reject);
    });

    return data;
  }

  public static async s3CopiaArquivoFromLaEastToUsEast({
    status,
    arquivo,
  }: {
    status: StatusInterface;
    arquivo: ArquivoInterface;
  }): Promise<void> {
    try {
      const pkService = new Everest2DemandaService({ pk: status.pk });

      status = await pkService.getStatus();

      const s3KeyDestino = `${status.cliente}/${arquivo.pk}/${arquivo.file_name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      await this.s3ObjectCopy({
        s3KeyOrgiem: arquivo.s3Key,
        s3BucketOrigem: arquivo.s3Bucket,
        s3KeyDestino: s3KeyDestino,
        s3BucketDestino: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.demanda`,
      });

      const s3Attributes = await this.s3GetObjectAttributes({
        s3Bucket: `everest.${process.env.ENVIRONMENT?.toLowerCase()}.demanda`,
        s3Key: s3KeyDestino,
      });

      arquivo.s3Bucket = `everest.${process.env.ENVIRONMENT?.toLowerCase()}.demanda`;
      arquivo.s3Region = 'us-east-1';
      arquivo.s3Key = s3KeyDestino;

      await pkService.createDemandaDadoArquivo({
        created_by: status.updated_by,
        value: {
          s3Bucket: arquivo.s3Bucket,
          s3Key: arquivo.s3Key,
        },
      });
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`copiaArquivoFromLaEastToUsEast - ${error.message}`);
    }
  }

  public static async s3DeleteObject({
    s3Bucket,
    s3Key,
  }: {
    s3Key: string;
    s3Bucket: string;
  }): Promise<DeleteObjectCommandOutput> {
    try {
      const s3GetObjectParams: DeleteObjectCommandInput = {
        Bucket: s3Bucket,
        Key: s3Key,
      };
      const result: DeleteObjectCommandOutput = await s3Client.send(new DeleteObjectCommand(s3GetObjectParams));
      console.log(`Arquivo ${s3Key} deletado com sucesso!`);
      return result;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3DeleteObject - ${error.message}`);
    }
  }

  public static async s3GetMimeType({ fileName }: { fileName: string }) {
    try {
      const extension = fileName.split('.').pop() || '';
      const mimeTypes: { [key: string]: string } = {
        txt: 'text/plain',
        html: 'text/html',
        css: 'text/css',
        csv: 'text/csv',
        json: 'application/json',
        js: 'application/javascript',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        pdf: 'application/pdf',
        // Add more file extensions and their corresponding MIME types as needed
      };

      // Convert the extension to lowercase (file extensions are often case-insensitive)
      const lowerCaseExtension = extension.toLowerCase();

      // Lookup the MIME type for the given extension
      const mimeType = mimeTypes[lowerCaseExtension];

      return mimeType || 'application/octet-stream';
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3GetMimeType - ${error.message}`);
    }
  }

  // Improved get object with streaming
  public static async s3GetObject({ s3Bucket, s3Key }: { s3Key: string; s3Bucket: string }): Promise<Buffer> {
    try {
      const { s3Bucket: validBucket, s3Key: validKey } = s3ParamsSchema.parse({ s3Bucket, s3Key });

      const getS3ObjectParams: GetObjectCommandInput = {
        Bucket: validBucket,
        Key: validKey,
      };

      const result = await this.withRetry(() => s3Client.send(new GetObjectCommand(getS3ObjectParams)));

      return await this.extractDataFromS3Response(result.Body);
    } catch (error: any) {
      const errorMessage = `Failed to get object from S3: ${error.message}`;
      throw new EverestError(errorMessage);
    }
  }

  public static async s3GetObjectSa({ s3Bucket, s3Key }: { s3Key: string; s3Bucket: string }): Promise<Buffer> {
    try {
      const s3GetObjectParams: GetObjectCommandInput = {
        Bucket: s3Bucket,
        Key: s3Key,
      };
      const result: GetObjectCommandOutput = await s3ClientSa.send(new GetObjectCommand(s3GetObjectParams));

      const data = await this.extractDataFromS3Response(result.Body);

      return data;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(error.message);
    }
  }

  public static async s3GetObjectAttributes({ s3Key, s3Bucket }: { s3Key: string; s3Bucket: string }): Promise<{
    fileName: string;
    fileSizeMB: number;
    mimeType: string;
    metadata: { [key: string]: string };
  }> {
    try {
      const params = {
        Bucket: s3Bucket,
        Key: s3Key,
      };
      let result: HeadObjectCommandOutput = await s3Client.send(new HeadObjectCommand(params));

      const fileName = result?.Metadata?.filename_original || s3Key.split('/').pop() || 'Verificar';
      let fileSizeMB = result?.ContentLength ? Math.ceil((result?.ContentLength / 1024 / 1024) * 10) / 10 : 0;

      if (fileSizeMB === 0) fileSizeMB = 0.01;

      return {
        ...result,
        fileName,
        fileSizeMB,
        mimeType: result?.ContentType || 'application/octet-stream',
        metadata: result?.Metadata || { filename_original: fileName },
      };
    } catch (error: any) {
      console.error(JSON.stringify(error));
      if (error.name === 'NotFound') throw new Error(`${s3Key} - not found`);
      throw new Error(`s3GetObjectSize - ${error.message}`);
    }
  }

  public static async s3GetObjectSize({ s3Key, s3Bucket }: { s3Key: string; s3Bucket: string }) {
    try {
      const params = {
        Bucket: s3Bucket,
        Key: s3Key,
      };
      let { ContentLength } = await s3Client.send(new HeadObjectCommand(params));

      if (!ContentLength) ContentLength = 0;

      const tamanho = Math.ceil((ContentLength / 1024 / 1024) * 10) / 10;
      return tamanho;
    } catch (error: any) {
      console.error(JSON.stringify(error));
      throw new Error(`s3GetObjectSize - ${error.message}`);
    }
  }

  public static async s3ListFilesInBucket({ s3Bucket }: { s3Bucket: string }) {
    try {
      let nextToken: any = null;
      let items: any = [];
      const today = new Date();
      today.setDate(today.getDate() - 180);
      do {
        const params: ListObjectsV2CommandInput = {
          Bucket: s3Bucket,
          ContinuationToken: nextToken,
        };
        const { Contents, NextContinuationToken } = await s3Client.send(new ListObjectsV2Command(params));

        if (Contents) {
          Contents.map((content) => {
            if (content.LastModified && content.LastModified < today) {
              items.push({
                Key: content.Key,
                LastModified: content.LastModified,
                Size: content.Size,
              });
            }
          });
          console.log(items.length);
        }

        nextToken = NextContinuationToken;
      } while (nextToken);
      return items;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3ListFilesInBucket - ${error.message}`);
    }
  }

  public static async s3ListFilesInBucketAndKey({
    s3Bucket,
    s3PartialKey,
  }: {
    s3Bucket: string;
    s3PartialKey: string;
  }) {
    try {
      const params: ListObjectsCommandInput = {
        Bucket: s3Bucket,
        Prefix: s3PartialKey,
      };
      const dados = await s3Client.send(new ListObjectsCommand(params));
      if (!dados.Contents || dados.Contents.length === 0) return [];
      return dados.Contents.map((item) => item.Key);
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3ListFilesInBucketAndKey - ${error.message}`);
    }
  }

  public static async s3ObjectCopyAcl({
    s3BucketDestino,
    s3KeyDestino,
    s3BucketOrigem,
    s3KeyOrgiem,
    publicAcl,
  }: {
    s3KeyOrgiem: string;
    s3KeyDestino: string;
    s3BucketOrigem: string;
    s3BucketDestino: string;
    publicAcl: boolean;
  }): Promise<any> {
    try {
      const getS3ObjectParams: GetObjectCommandInput = {
        Bucket: s3BucketOrigem,
        Key: s3KeyOrgiem,
      };
      const resultCopy = await s3Client.send(new GetObjectCommand(getS3ObjectParams));
      if (!resultCopy.Body) throw new Error('Body not found');
      const buffer = await this.extractDataFromS3Response(resultCopy.Body);

      const putS3ObjectParams: PutObjectCommandInput = {
        Bucket: s3BucketDestino,
        Key: s3KeyDestino,
        Body: buffer,
        ContentType: resultCopy.ContentType,
        ACL: publicAcl ? ('public-read' as ObjectCannedACL) : undefined,
      };
      const result = await s3Client.send(new PutObjectCommand(putS3ObjectParams));

      return result;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3ObjectCopyAcl ${error.message}`);
    }
  }

  public static async s3ObjectCopySaAcl({
    s3BucketDestino,
    s3KeyDestino,
    s3BucketOrigem,
    s3KeyOrgiem,
    publicAcl,
  }: {
    s3KeyOrgiem: string;
    s3KeyDestino: string;
    s3BucketOrigem: string;
    s3BucketDestino: string;
    publicAcl: boolean;
  }): Promise<any> {
    try {
      const getS3ObjectParams: GetObjectCommandInput = {
        Bucket: s3BucketOrigem,
        Key: s3KeyOrgiem,
      };
      const resultCopy = await s3ClientSa.send(new GetObjectCommand(getS3ObjectParams));
      if (!resultCopy.Body) throw new Error('Body not found');
      const buffer = await this.extractDataFromS3Response(resultCopy.Body);

      const putS3ObjectParams: PutObjectCommandInput = {
        Bucket: s3BucketDestino,
        Key: s3KeyDestino,
        Body: buffer,
        ContentType: resultCopy.ContentType,
        ACL: publicAcl ? ('public-read' as ObjectCannedACL) : undefined,
      };
      const result = await s3Client.send(new PutObjectCommand(putS3ObjectParams));

      return result;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3ObjectCopyAcl ${error.message}`);
    }
  }

  public static async s3PreSignedLink(pk: string, sk: string, expiresIn: number) {
    try {
      const pkService = new Everest2DemandaService({ pk });

      // let status = await pkService.getStatus();

      const arquivo = await pkService.getDemandaDadoArquivo({ sk });

      if (!arquivo) throw new Error('Arquivo não encontrado');

      const url = await LambdaServices.invokeLambda({
        lambdaName: 'EverestApoioS3GetPreSignedLink',
        payload: {
          bucket: arquivo.value.s3Bucket,
          s3Key: arquivo.value.s3Key,
          expirationMinutes: expiresIn * 60,
        },
      });
      return url;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3PreSignedLink - ${error.message}`);
    }
  }

  public static async s3ObjectCopy({
    s3BucketDestino,
    s3KeyDestino,
    s3BucketOrigem,
    s3KeyOrgiem,
  }: {
    s3KeyOrgiem: string;
    s3KeyDestino: string;
    s3BucketOrigem: string;
    s3BucketDestino: string;
  }): Promise<any> {
    try {
      // Monta o caminho do objeto de origem no formato 'bucket/key'
      const copySource = `/${s3BucketOrigem}/${s3KeyOrgiem}`;

      const copyS3ObjectParams: CopyObjectCommandInput = {
        Bucket: s3BucketDestino, // Bucket de destino
        Key: s3KeyDestino, // Key de destino
        CopySource: copySource, // Origem no formato '/bucket/key'
      };

      // Executa o comando de cópia
      const result = await s3Client.send(new CopyObjectCommand(copyS3ObjectParams));

      return result;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3ObjectCopy ${error.message}`);
    }
  }

  public static async s3GetFileSizeMB({ s3Bucket, s3Key }: { s3Key: string; s3Bucket: string }) {
    try {
      const params = {
        Bucket: s3Bucket,
        Key: s3Key,
      };
      const { ContentLength } = await s3Client.send(new HeadObjectCommand(params));

      if (!ContentLength) return 0;

      const fileSizeMB = Math.ceil((ContentLength / 1024 / 1024) * 10) / 10;
      return fileSizeMB;
    } catch (error: any) {
      console.error(JSON.stringify(error));
      throw new Error(`s3GetFileSizeMB - ${error.message}`);
    }
  }

  public static async s3GetPreSignedUrl({
    s3Bucket,
    s3Key,
    expirationMinutes,
  }: {
    s3Key: string;
    s3Bucket: string;
    expirationMinutes: number;
  }) {
    try {
      const params: GetObjectCommandInput = {
        Bucket: s3Bucket,
        Key: s3Key,
        ResponseContentDisposition: 'inline',
      };

      const command = new GetObjectCommand(params);
      const expiracao = expirationMinutes * 60;
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: expiracao,
        signingDate: new Date(),
        signingRegion: 'us-east-1',
      });
      return url;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`s3GetPreSignedUrl - ${error.message}`);
    }
  }

  // Add method to check if object exists
  public static async objectExists({ s3Bucket, s3Key }: { s3Bucket: string; s3Key: string }): Promise<boolean> {
    try {
      const { s3Bucket: validBucket, s3Key: validKey } = s3ParamsSchema.parse({ s3Bucket, s3Key });

      await this.s3GetObjectAttributes({ s3Bucket: validBucket, s3Key: validKey });
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Add method to get signed URL with custom options
  public static async getSignedUrl({
    s3Bucket,
    s3Key,
    expiresIn = 3600,
    responseType = 'inline',
  }: {
    s3Bucket: string;
    s3Key: string;
    expiresIn?: number;
    responseType?: 'inline' | 'attachment';
  }): Promise<string> {
    try {
      const { s3Bucket: validBucket, s3Key: validKey } = s3ParamsSchema.parse({ s3Bucket, s3Key });

      const command = new GetObjectCommand({
        Bucket: validBucket,
        Key: validKey,
        ResponseContentDisposition: `${responseType}; filename="${path.basename(validKey)}"`,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error: any) {
      const errorMessage = `Failed to generate signed URL: ${error.message}`;
      throw new EverestError(errorMessage);
    }
  }

  public static async getSignedUrlSa({
    s3Bucket,
    s3Key,
    expiresIn = 3600,
    responseType = 'inline',
  }: {
    s3Bucket: string;
    s3Key: string;
    expiresIn?: number;
    responseType?: 'inline' | 'attachment';
  }): Promise<string> {
    try {
      const { s3Bucket: validBucket, s3Key: validKey } = s3ParamsSchema.parse({ s3Bucket, s3Key });

      const command = new GetObjectCommand({
        Bucket: validBucket,
        Key: validKey,
        ResponseContentDisposition: `${responseType}; filename="${path.basename(validKey)}"`,
      });

      return await getSignedUrl(s3ClientSa, command, { expiresIn });
    } catch (error: any) {
      const errorMessage = `Failed to generate signed URL: ${error.message}`;
      throw new EverestError(errorMessage);
    }
  }
}
