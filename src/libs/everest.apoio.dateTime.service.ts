import { LambdaContextInterface } from './everest.interfaces';

const nacionalHoliday = [
  '1/1', // Ano Novo
  '25/1', // Aniversário de São Paulo //WENDELL
  '21/4', // Tiradentes
  '1/5', // Dia do Trabalho
  '7/9', // Independência do Brasil
  '12/10', // Nossa Senhora Aparecida
  '2/11', // Finados
  '15/11', // Proclamação da República
  '20/11', // Dia da Consciência Negra
  '24/12',
  '25/12', // Natal
  '31/12',
];

export class EverestApoioDateTimeService {
  public static calculateTTLDynamoDB({ daysToExpire, date }: { date: Date; daysToExpire: number }): number {
    if (daysToExpire < 1) throw new Error('daysToExpire must be greater than 0');
    const ttl = date.getTime() + 3600 * 1000 * 24 * daysToExpire;
    return ttl;
  }

  public static daysBetweenDates({ date1, date2 }: { date1: string; date2: string }) {
    // Converter as datas para objetos Date
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();

    // Calcular a diferença em milissegundos
    const diffInMs = Math.abs(d2 - d1);

    // Converter a diferença de milissegundos para dias
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays;
  }

  public static addDaysToDate({ initialDate, days }: { initialDate: Date; days: string }): Date {
    try {
      const date = new Date(initialDate);
      const endDate = date.setDate(date.getDate() + parseInt(days));
      return new Date(endDate);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`addDaysToDate - ${error.message}`);
    }
  }

  public static addMinutesToDate({ initialDate, minutes }: { initialDate: Date; minutes: number }): Date {
    try {
      const date = new Date(initialDate);
      const endDate = date.setMinutes(date.getMinutes() + minutes);
      return new Date(endDate);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`addMinutesToDate - ${error.message}`);
    }
  }

  public static dateDDMMYYYY(date: Date): string {
    try {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`dateDDMMYYYY - ${error.message}`);
    }
  }

  public static dateDDMMYYYYHHMM(date: Date): string {
    return (
      date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ' ' +
      date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    );
  }

  public static calculateUnixEpochTimeIsSeconds(date: Date): number {
    const unixEpochTimeInSeconds = Math.floor(date.getTime() / 1000);
    return unixEpochTimeInSeconds;
  }

  public static getCloudWatchLogUrl(context: LambdaContextInterface): string {
    if (!context?.logGroupName) return '';
    const logGroupName = context.logGroupName;
    const logStreamName = context.logStreamName;
    const region = context.invokedFunctionArn.split(':')[3];

    const url = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logEventViewer:group=${logGroupName};stream=${logStreamName}`;

    return url;
  }

  public static async getDueDate(
    data_inicial: string,
    sla: number
  ): Promise<{
    data_do_carimbo: string;
    data_do_carimbo_brasil: string;
    data_original: string;
    data_original_brasil: string;
    due_date: string;
    due_date_brasil: string;
    sla: number;
  }> {
    try {
      // const axiosRequestConfig: AxiosRequestConfig = {
      //   method: 'POST',
      //   url: 'https://everest.oito.srv.br/everest/ai/v2/apoio/calculaDueDate',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   data: JSON.stringify({
      //     data: data_inicial,
      //     sla: sla,
      //   }),
      // };
      // const response = await axios(axiosRequestConfig);

      const dados = calculaDueDate({
        data: data_inicial,
        sla: sla,
      });
      return dados as {
        data_do_carimbo: string;
        data_do_carimbo_brasil: string;
        data_original: string;
        data_original_brasil: string;
        due_date: string;
        due_date_brasil: string;
        sla: number;
      };
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getDueDate - ${error.message}`);
    }
  }

  public static async subtraiHoraUtil(data_inicial: string, horas_uteis: number) {
    const dataInicial = new Date(data_inicial);
    let dataAlvo = dataInicial;
    let dataFinal: Date;
    do {
      dataAlvo = new Date(dataAlvo.getTime() - 1 * 60 * 60 * 1000);
      const dataCalculada = await this.getDueDate(dataAlvo.toString(), horas_uteis);
      if (dataInicial > new Date(dataCalculada.due_date)) {
        dataFinal = new Date(dataCalculada.data_original);

        break;
      }
    } while (true);
    return dataFinal;
  }

  public static getEhHoraUtil({ data }: { data: string }) {
    try {
      const response = calculaehHoraUtil({ data: data });
      return response;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getDueDate - ${error.message}`);
    }
  }

  public static isWorkingDateTime(dateISOString: string) {
    const date = new Date(dateISOString);

    const dayNow = date.getUTCDate(); // 1 to end of month
    const monthNow = date.getUTCMonth() + 1; // 0 to 11

    const dayMonthNow = dayNow + '/' + monthNow;

    if (nacionalHoliday.includes(dayMonthNow)) return false;
    if (date.getUTCDay() === 6) return false; // day of the week (0 a 6) 6=Saturday
    if (date.getUTCDay() === 0) return false; // day of the week (0 a 6) 0=Sunday
    if (date.getUTCHours() < 12) return false; // BR 9h, UTC 12h
    if (date.getUTCHours() >= 21) return false; // BR 18h, UTC 21h

    return true;
  }

  public static findPreviousWorkingDateTime(dateISOString: string): Date {
    //Regra de negócio
    //A partir dessa data encontre a proxima data util de forma regressiva
    if (isNaN(Date.parse(dateISOString))) {
      throw new Error('Invalid date ISO string format');
    }

    const date: Date = new Date(dateISOString);

    if (this.isWorkingDateTime(dateISOString)) {
      date.setHours(date.getHours() - 1);

      while (!this.isWorkingDateTime(date.toISOString())) {
        date.setHours(date.getHours() - 1);
      }

      date.setUTCMinutes(0);
      date.setUTCSeconds(0);
      date.setUTCMilliseconds(0);

      return date;
    }

    while (!this.isWorkingDateTime(date.toISOString())) {
      date.setHours(date.getHours() - 1);
    }

    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date;
  }
}

const calculaDueDate = (body: { data: string; sla: number }) => {
  try {
    if (!body.data) throw new Error('no data found');
    if (!body.sla) throw new Error('no sla found');
    const dataRaw = body.data;
    const data: Date = new Date(dataRaw);

    let dataDoCarimbo: string = body.data;

    if (!ehHoraUtil(dataRaw)) {
      data.setUTCMinutes(0);
      data.setUTCSeconds(0);
      dataDoCarimbo = calcDueDate(data.toISOString(), 1);
    }

    const dueDate = calcDueDate(dataDoCarimbo, body.sla + 0);

    console.log(`Calcula Due Date: ${dataRaw} - ${dueDate} - ${body.sla}`);

    return {
      data_original: dataRaw,
      data_do_carimbo: dataDoCarimbo,
      due_date: dueDate,
      sla: body.sla,
      data_original_brasil: new Date(dataRaw).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      }),
      data_do_carimbo_brasil: new Date(dataDoCarimbo).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      }),
      due_date_brasil: new Date(dueDate).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      }),
    };
  } catch (error: any) {
    console.error(JSON.stringify(error));
    throw new Error(`${error.message}`);
  }
};

const calculaehHoraUtil = (body: { data: string }) => {
  const feriadosNacionais = nacionalHoliday;
  const dataConvertida = new Date(body.data);
  const dayMonth = dataConvertida.getUTCDate() + '/' + (dataConvertida.getUTCMonth() + 1);
  if (feriadosNacionais.includes(dayMonth)) return false;
  // const day = dataConvertida.getUTCDay();
  if (dataConvertida.getUTCDay() === 6) return false;
  if (dataConvertida.getUTCDay() === 0) return false;
  if (dataConvertida.getUTCHours() < 12) return false;
  if (dataConvertida.getUTCHours() > 20) return false;

  return true;
};

const ehHoraUtil = (data: string) => {
  const feriadosNacionais = nacionalHoliday;
  const dataConvertida = new Date(data);
  const dayMonth = dataConvertida.getUTCDate() + '/' + (dataConvertida.getUTCMonth() + 1);
  if (feriadosNacionais.includes(dayMonth)) return false;
  // const day = dataConvertida.getUTCDay();
  if (dataConvertida.getUTCDay() === 6) return false;
  if (dataConvertida.getUTCDay() === 0) return false;
  if (dataConvertida.getUTCHours() < 12) return false;
  if (dataConvertida.getUTCHours() > 20) return false;

  return true;
};

const calcDueDate = (horaDoCarimbo: string, sla: number) => {
  let horasUteisSomadas: number = 0;
  const dueDate: Date = new Date(horaDoCarimbo);
  // const horaCarimbo = new Date(horaDoCarimbo);
  do {
    // add 1 hour to the date
    dueDate.setHours(dueDate.getHours() + 1);
    if (ehHoraUtil(dueDate.toISOString())) {
      horasUteisSomadas++;
      if (sla === horasUteisSomadas) break;
    }
  } while (true);
  return dueDate.toISOString();
};
