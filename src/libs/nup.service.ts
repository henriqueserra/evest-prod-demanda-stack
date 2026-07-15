import axios, { AxiosRequestConfig } from 'axios';
import { EverestApoioService } from './everest.apoio.service';

export class NupService {
  static async getNupAttributes({ nup }: { nup: string }): Promise<any> {
    try {
      const axiosRequest: AxiosRequestConfig = {
        method: 'GET',
        url: `https://backnode.apps.oito.srv.br/apoio/dadosdecapa/nup/${nup}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const axiosRresult = await axios(axiosRequest);
      return axiosRresult.data;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getNupAttributes - ${error.message}`);
    }
  }

  public static async getTribunal({ nup }: { nup: string }) {
    try {
      const dados = await this.getNupAttributes({ nup });
      const tribunaisBrutos = dados.data.map((item: any) => item.dsc_tribunal);
      if (!tribunaisBrutos || tribunaisBrutos.length === 0) return [];
      // Get unique values from array of strings
      const tribunais = [...new Set(tribunaisBrutos as string[])];
      return EverestApoioService.sortAlphabetically(tribunais);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getTribunal - ${error.message}`);
    }
  }

  public static async getComarca({ nup }: { nup: string }) {
    try {
      const dados = await this.getNupAttributes({ nup });
      const comarcaBrutos = dados.data.map((item: any) =>
        item.dsc_comarca.toUpperCase(),
      );
      if (!comarcaBrutos || comarcaBrutos.length === 0) return [];
      const comarca = [...new Set(comarcaBrutos as string[])];
      return comarca;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getComarca - ${error.message}`);
    }
  }

  public static async getForo({ nup }: { nup: string }) {
    try {
      const dados = await this.getNupAttributes({ nup });
      const foroBrutos = dados.data.map((item: any) =>
        item.dsc_foro.toUpperCase(),
      );
      if (!foroBrutos || foroBrutos.length === 0) return [];
      const foro = [...new Set(foroBrutos as string[])];
      return foro;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getForo - ${error.message}`);
    }
  }

  public static async getVara({ nup }: { nup: string }) {
    try {
      const dados = await this.getNupAttributes({ nup });
      const varaBrutos = dados.data.map((item: any) =>
        item.dsc_vara.toUpperCase(),
      );
      if (!varaBrutos || varaBrutos.length === 0) return [];
      const vara = [...new Set(varaBrutos as string[])];
      return vara;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getVara - ${error.message}`);
    }
  }

  public static async getUf({ nup }: { nup: string }) {
    try {
      const dados = await this.getNupAttributes({ nup });
      const ufBrutos = dados.data.map((item: any) =>
        item.dsc_uf_processo.toUpperCase(),
      );
      if (!ufBrutos || ufBrutos.length === 0) return [];
      const uf = [...new Set(ufBrutos as string[])];
      return uf;
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`getUf - ${error.message}`);
    }
  }
}
