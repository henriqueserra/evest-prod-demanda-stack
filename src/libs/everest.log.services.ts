export class EverestLogService {
  constructor() {}

  info({ message, method }: { message: string; method: string }) {
    console.info(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} :: [${method}] :: - ${message}`
    );
  }

  error({ message, method }: { message: string; method: string }) {
    console.error(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} :: [${method}] :: - ${message}`
    );
  }

  log({ message, method }: { message: string; method: string }) {
    console.log(
      `${new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })} :: [${method}] :: - ${message}`
    );
  }
}
