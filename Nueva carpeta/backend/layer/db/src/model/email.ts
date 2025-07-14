import { Status } from "../const/enum";

export class Email {
  private id: string;
  private destinatario: string;
  private status: Status;
  private content: {
    url: string;
    urlTerminos: string;
    fechaVencimientos: {
      fecha: string;
      nroCuota: string;
    }[];
  };
  private receivedAt: string;
  private email?: {
    emailId: string;
    emailStatus: Status;
  }[];
  private enviado: boolean;
  private contador: number;
  constructor(
    id: string,
    destinatario: string,
    status: Status,
    enviado: boolean,
    content: {
      url: string;
      urlTerminos: string;
      fechaVencimientos: { fecha: string; nroCuota: string }[];
    }
  ) {
    this.id = id;
    this.destinatario = destinatario;
    this.status = status;
    this.enviado = enviado;
    this.content = content;
    this.receivedAt = new Date().toISOString();
    this.contador = 0;
  }
  public getId(): string {
    return this.id;
  }
  public getDestinatario(): string {
    return this.destinatario;
  }
  public getContent(): {
    url: string;
    urlTerminos: string;
    fechaVencimientos: { fecha: string; nroCuota: string }[];
  } {
    return this.content;
  }
  public getReceivedAt(): string {
    return this.receivedAt;
  }
  public getContador(): number {
    return this.contador;
  }
  public setContador(contador: number): void {
    this.contador = contador;
  }
  public setContent(content: { url: string; urlTerminos: string; fechaVencimientos: { fecha: string; nroCuota: string }[] }): void {
    this.content = content;
  }
  public setStatus(status: Status): void {
    this.status = status;
  }
  public getStatus(): Status {
    return this.status;
  }
  public setEnviado(enviado: boolean): void {
    this.enviado = enviado;
  }
  public getEnviado(): boolean {
    return this.enviado;
  }
  public getEmail(): { emailId: string; emailStatus: Status }[] | undefined {
    return this.email;
  }
  public setEmail(email: { emailId: string; emailStatus: Status }[] | undefined): void {
    this.email = email;
  }
}
