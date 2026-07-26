import { logger } from "../config/logger.js";

export const sendEmail = async (to: string, subject: string, bodyHtml: string, bodyText?: string) => {
  logger.info(`[Email Mock] Would have sent email to ${to}`);
  logger.info(`[Email Mock] Subject: ${subject}`);
  logger.info(`[Email Mock] Body: ${bodyText || bodyHtml.replace(/<[^>]*>?/gm, "")}`);
  return true;
};
