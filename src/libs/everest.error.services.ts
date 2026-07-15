export class EverestError extends Error {
  public badRequest: any;
  constructor(message: string, badRequest?: any) {
    super(message);
    this.badRequest = badRequest;
  }
}
