import axios, { AxiosRequestConfig } from 'axios';
import _ from 'lodash';
import { DemandaInterface, StatusInterface } from './everest.demanda.service';
import path from 'path';
import { EverestError } from './everest.error.services';
import { z } from 'zod';

// Add type definitions
interface JsonDiffResult<T> {
  newToOld: Partial<T>;
  oldToNew: Partial<T>;
}

// Add validation schemas
const arrayComparisonSchema = z.object({
  array1: z.array(z.string()),
  array2: z.array(z.string()),
});

export class EverestApoioService {
  constructor() {}

  // Add memoization for expensive operations
  private static readonly memoizedRemoveAcentos = _.memoize((text: string): string => {
    try {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[Çç]/g, 'C')
        .replace(/[ãÃ]/g, 'a')
        .replace(/[õÕ]/g, 'o');
    } catch (error: any) {
      throw new EverestError(`Failed to remove accents: ${error.message}`);
    }
  });

  // Improved number sanitization
  public static apenasNumeros(texto: string | null | undefined): string {
    if (!texto) return '';
    return texto.replace(/\D/g, '');
  }

  // Improved array to text conversion with validation
  public static convertArrayOfObjectsToText(array: unknown[]): string {
    try {
      if (!Array.isArray(array)) {
        throw new EverestError('Input must be an array');
      }

      const lines = array.map((line) => JSON.stringify(line));
      return [
        '----------------------------------------------------',
        '',
        ...lines.map((line) => `${line}\n`),
        '',
        '----------------------------------------------------',
      ].join('\n');
    } catch (error: any) {
      throw new EverestError(`Failed to convert array to text: ${error.message}`);
    }
  }

  public static removeDuplicatesFromStringArray(array: string[]): string[] {
    return [...new Set(array)];
  }

  // Improved deep equality check
  public static deepEqual(obj1: unknown, obj2: unknown): boolean {
    // Handle primitive types and null/undefined
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== typeof obj2) return false;

    // Handle dates
    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime();
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return obj1.length === obj2.length && obj1.every((val, idx) => this.deepEqual(val, obj2[idx]));
    }

    // Handle objects
    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1 as object);
      const keys2 = Object.keys(obj2 as object);
      return (
        keys1.length === keys2.length && keys1.every((key) => this.deepEqual((obj1 as any)[key], (obj2 as any)[key]))
      );
    }

    return false;
  }

  public static extractTextBetween = ({
    text,
    startString,
    endString,
  }: {
    text: string;
    startString: string;
    endString: string;
  }): string => {
    try {
      const startIndex = text.indexOf(startString) + startString.length;
      const endIndex = text.indexOf(endString, startIndex);
      if (startIndex === -1 || endIndex === -1) {
        return '';
      }
      return text.slice(startIndex, endIndex);
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`extractTextBetween - ${error.message}`);
    }
  };

  public static filtraValoresNaArray = (array1: string[], array2: string[]): boolean => {
    for (let valor of array1) {
      if (array2.includes(valor)) {
        return true;
      }
    }
    return false;
  };

  public static formataCamposParaRelatorio = (dados: StatusInterface[]): any => {
    const dadosFormatados = dados.map((item) => {
      return {
        id: item.pk,
        cliente: item.cliente,
        tipo_demanda: item.tipo_demanda,
        data_carimbo: item.data_carimbo,
        data_fatal: item.due_date,
        created_by: item.created_by,
        due_date: item.due_date,
        status: item.status_demanda,
        processo: item.processo ?? '',
        identificacao: item.identificacao ?? '',
      };
    });

    let csv = `"id";"cliente";"tipo_demanda";"data_carimbo";"data_fatal";"created_by";"due_date";"status";"processo";"identificacao"\n`;
    dadosFormatados.forEach((row) => {
      csv += `"${row.id}";"${row.cliente}";"${row.tipo_demanda}";"${row.data_carimbo}";"${row.data_fatal}";"${row.created_by}";"${row.due_date}";"${row.status}";"${row.processo}";"${row.identificacao}"\n`;
    });
    return csv;
  };

  public static getFileFromUrl = async (url: string): Promise<Buffer> => {
    try {
      const axiosParams: AxiosRequestConfig = {
        method: 'GET',
        url,
        responseType: 'arraybuffer',
      };
      const response = await axios.request(axiosParams);

      const buffer = Buffer.from(response.data);

      return buffer;
    } catch (error: any) {
      console.error(`${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} - ${error.message}`);
      throw new Error(`getFileFromUrl - ${error.message}`);
    }
  };

  public static getFirstAttributeNames(jsonData: any): string[] {
    // Obtém os nomes das chaves do objeto
    const keys = Object.keys(jsonData);

    // Retorna os dois primeiros nomes de chave
    return keys;
  }

  public static getMimeTypeFromExtension = (extension: string): string => {
    // Define a mapping of file extensions to MIME types
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
  };

  // Improved array operations with validation
  public static isAnyOfArray1InArray2(array1: string[], array2: string[]): boolean {
    try {
      const { array1: validArray1, array2: validArray2 } = arrayComparisonSchema.parse({ array1, array2 });
      return validArray1.some((value) => validArray2.includes(value));
    } catch (error: any) {
      throw new EverestError(`Invalid array comparison: ${error.message}`);
    }
  }

  public static isEqual(value: any, other: any): boolean {
    // Handle null or undefined values
    if (value === other) return true;

    // Check if both values are objects
    if (typeof value === 'object' && typeof other === 'object' && value !== null && other !== null) {
      const valueKeys = Object.keys(value);
      const otherKeys = Object.keys(other);

      // Check if the number of keys is the same
      if (valueKeys.length !== otherKeys.length) return false;

      // Check if each key in the first object exists in the second object and values are equal
      for (const key of valueKeys) {
        if (!other.hasOwnProperty(key) || !this.isEqual(value[key], other[key])) return false;
      }

      return true;
    }

    // Check for NaN
    if (typeof value === 'number' && typeof other === 'number' && isNaN(value) && isNaN(other)) return true;

    // Otherwise, values are not equal
    return false;
  }

  public static isJsonObject(value: any): boolean {
    try {
      if (typeof value === 'string') return false;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return true;
      JSON.parse(JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Improved JSON diff with type safety
  public static jsonDiff<T extends Record<string, any>>({
    oldJson,
    newJson,
  }: {
    oldJson: T;
    newJson: T;
  }): JsonDiffResult<T> {
    try {
      const differencesNewToOld = Object.keys(newJson).reduce<Partial<T>>((result, key) => {
        if (!this.deepEqual(newJson[key], oldJson[key])) {
          result[key as keyof T] = newJson[key];
        }
        return result;
      }, {});

      const differencesOldToNew = Object.keys(oldJson).reduce<Partial<T>>((result, key) => {
        if (!this.deepEqual(oldJson[key], newJson[key])) {
          result[key as keyof T] = oldJson[key];
        }
        return result;
      }, {});

      return {
        newToOld: differencesNewToOld,
        oldToNew: differencesOldToNew,
      };
    } catch (error: any) {
      throw new EverestError(`Failed to compare JSONs: ${error.message}`);
    }
  }

  public static ordenaArray<T>(array: T[], campo: keyof T): T[] {
    return array.sort((a, b) => {
      const valueA = a[campo];
      const valueB = b[campo];

      if (valueA > valueB) return 1;
      if (valueA < valueB) return -1;
      return 0;
    });
  }

  public static sortArray<T>(array: T[], campo: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return array.sort((a, b) => {
      const valueA = a[campo];
      const valueB = b[campo];

      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      return 0;
    });
  }

  // Improved file name sanitization
  public static saneiaFileName(originalFileName: string): string {
    try {
      const ext = path.extname(originalFileName);
      let fileName = this.memoizedRemoveAcentos(originalFileName)
        .split(ext)[0]
        .trim()
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_');

      return `${fileName}${ext}`;
    } catch (error: any) {
      throw new EverestError(`Failed to sanitize filename: ${error.message}`);
    }
  }

  // Improved JSON sanitization
  public static saneiaJson<T>(obj: T): T {
    try {
      if (_.isArray(obj)) {
        return (obj as unknown as any[])
          .map((item) => this.saneiaJson(item))
          .filter((item) => !_.isEmpty(item)) as unknown as T;
      }

      if (_.isObject(obj)) {
        return _.omitBy(
          _.mapValues(obj as object, (value) => this.saneiaJson(value)),
          (value) => value === null || value === '' || (_.isObject(value) && _.isEmpty(value))
        ) as T;
      }

      return obj;
    } catch (error: any) {
      throw new EverestError(`Failed to sanitize JSON: ${error.message}`);
    }
  }

  public static sortAlphabetically(arr: string[]): string[] {
    return arr.sort((a, b) => a.localeCompare(b));
  }

  public static sortByDueDate = (demandas: StatusInterface[] | DemandaInterface[]): DemandaInterface[] => {
    return demandas.sort((a, b) => {
      const dateA = new Date(a.due_date as string);
      const dateB = new Date(b.due_date as string);
      return dateA.getTime() - dateB.getTime();
    }) as DemandaInterface[];
  };

  public static validaDocumento(documento: string): {
    status: boolean;
    documentoOriginal: string;
    documentoFormatado: string;
    type: string;
  } {
    console.info(`validaDocumento: ${documento}`);
    if (documento === '' || !documento || documento === undefined) {
      return {
        status: false,
        documentoOriginal: '',
        documentoFormatado: `${documento}(inválido)`,
        type: '',
      };
    }

    documento = documento.replace(/[^\d]+/g, '') as string;
    // Valida CPF
    if (documento.length == 14) {
      var result = isValidCnpj(documento);
      return {
        status: result,
        documentoOriginal: documento,
        documentoFormatado: result ? cnpj(documento) : `${documento}(inválido)`,
        type: 'CNPJ',
      };
    } else if (documento.length == 11) {
      var result = isValidCpf(documento);
      return {
        status: result,
        documentoOriginal: documento,
        documentoFormatado: result ? cpf(documento) : `${documento}(inválido)`,
        type: 'CPF',
      };
    } else {
      return {
        status: false,
        type: '',
        documentoOriginal: documento,
        documentoFormatado: `${documento}(inválido)`,
      };
    }
  }

  public static validarNumeroProcesso(numeroProcesso: string): boolean {
    const numero = numeroProcesso.replace(/[^\d]/g, '');

    // Valida o tamanho (deve ter 20 dígitos)
    if (numero.length !== 20) {
      return false;
    }

    // Separa o número base (primeiros 7 dígitos + últimos 11 dígitos) do DV (2 dígitos do meio)
    const parte1 = numero.substring(0, 7);
    const dvInformado = numero.substring(7, 9);
    const parte2 = numero.substring(9);

    // Concatena as partes sem o DV
    const numeroBase = parte1 + parte2;

    // Calcula o DV usando o algoritmo Módulo 97, Base 10, ISO 7064
    const numeroParaCalculo = BigInt(numeroBase) * BigInt(100);
    const resto = Number(numeroParaCalculo % BigInt(97));
    const dvCalculado = (98 - resto).toString().padStart(2, '0');

    // Valida o DV calculado com o informado
    return dvCalculado === dvInformado;
  }

  public static formatarNumeroProcesso(numeroProcesso: string): string {
    const numero = numeroProcesso.replace(/[^\d]/g, '');
    return `${numero.substring(0, 7)}-${numero.substring(7, 9)}.${numero.substring(9, 13)}.${numero.substring(
      13,
      14
    )}.${numero.substring(14, 16)}.${numero.substring(16, 20)}`;
  }

  // Add new utility methods
  public static async retry<T>(
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
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  public static formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack}`;
    }
    return String(error);
  }

  public static removeDuplicates = ({ data, key }: { data: any; key: string }) => {
    const uniqueRecords: { [key: string]: any } = {};

    data.forEach((record) => {
      const uniqueKey = `${record[key]}`;
      if (!uniqueRecords[uniqueKey]) {
        uniqueRecords[uniqueKey] = record;
      }
    });

    return Object.values(uniqueRecords);
  };
}

const isValidCnpj = (documento: string) => {
  var tamanho = documento.length - 2;
  var numeros = documento.substring(0, tamanho);
  var digitos = documento.substring(tamanho);
  var soma = 0;
  var pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  var resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = documento.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != parseInt(digitos.charAt(1))) return false;
  return true;
};

const isValidCpf = (documento: string) => {
  if (typeof documento !== 'string') {
    return false;
  }

  documento = documento.replace(/[^\d]+/g, '');

  if (documento.length !== 11 || !!documento.match(/(\d)\1{10}/)) {
    return false;
  }

  const documentos = documento.split('').map((el) => +el);
  const rest = (count: number) =>
    ((documentos.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11) % 10;

  return rest(10) === documentos[9] && rest(11) === documentos[10];
};

const cpf = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const cnpj = (cnpj: string) => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};
