import { MailDataRequired } from '@sendgrid/mail';
import {
  EmailDataInterface,
  SendGridAttachmentInterface,
  SendGridSendEmailInterface,
  SendGridSendEmailInterfaceWithAttachment,
} from './everest.interfaces';
import sgMail from '@sendgrid/mail';

const environment = process.env.ENVIRONMENT?.toLowerCase();

const apiKey: string = environment === 'prod' ? 'xx' : '';

export class EverestSendGridService {
  //
  public static sendGridSendEmail = async ({
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    text,
  }: SendGridSendEmailInterface) => {
    try {
      replyTo = replyTo ?? from.email;

      sgMail.setApiKey(apiKey);

      if (Array.isArray(to) && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => email !== to);
      }

      if (Array.isArray(to) && Array.isArray(cc)) {
        cc = cc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(cc)) {
        cc = cc.filter((email) => email !== to);
      }

      const emailParams: MailDataRequired = {
        to: to,
        cc: cc,
        bcc: bcc,
        replyTo,
        from,
        subject,
        text,
      };
      return await sgMail.send(emailParams);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`${error.message}`);
    }
  };

  public static sendGridSendEmailWithAttachment = async ({
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    text,
    attachment,
  }: SendGridSendEmailInterfaceWithAttachment) => {
    try {
      replyTo = replyTo ?? from.email;
      sgMail.setApiKey(apiKey);

      if (Array.isArray(to) && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => email !== to);
      }

      if (Array.isArray(to) && Array.isArray(cc)) {
        cc = cc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(cc)) {
        cc = cc.filter((email) => email !== to);
      }

      const emailParams: MailDataRequired = {
        to: to,
        cc: cc,
        bcc: bcc,
        replyTo,
        from,
        subject,
        text,
        attachments: attachment,
      };
      return await sgMail.send(emailParams);
    } catch (error: any) {
      console.error(error.message);
      throw new Error(`sendGridSendEmailWithAttachment - ${error.message}`);
    }
  };

  public static sendGridSenEmailTemplate = async ({
    to,
    cc = [],
    bcc = [],
    from,
    replyTo,
    templateId,
    dynamicTemplateData,
    attachments = [],
  }: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    from: EmailDataInterface;
    replyTo: string;
    templateId: string;
    dynamicTemplateData: { [key: string]: any };
    attachments?: SendGridAttachmentInterface[];
  }) => {
    try {
      sgMail.setApiKey(apiKey);

      if (Array.isArray(to) && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(bcc)) {
        bcc = bcc.filter((email) => email !== to);
      }

      if (Array.isArray(to) && Array.isArray(cc)) {
        cc = cc.filter((email) => !to.includes(email));
      } else if (typeof to === 'string' && Array.isArray(cc)) {
        cc = cc.filter((email) => email !== to);
      }

      const emailParams: MailDataRequired = {
        to: to,
        cc: cc,
        bcc: bcc,
        replyTo,
        from,
        dynamicTemplateData: dynamicTemplateData,
        templateId: templateId,
        attachments,
      };
      return await sgMail.send(emailParams);
    } catch (error: any) {
      console.error(error.message);
      console.error(JSON.stringify(error.response.body));
      throw new Error(`sendGridSenEmailTemplate - ${JSON.stringify(error.response.body)}`);
    }
  };
}
