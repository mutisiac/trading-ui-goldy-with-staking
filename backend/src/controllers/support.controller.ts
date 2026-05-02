import type { Request, Response } from "express";
import { sendSupportEmails } from "../services/support.service.js";
import type { SupportFormBody } from "../validation/support.schemas.js";

export async function supportForm(req: Request, res: Response): Promise<Response> {
  try {
    const body = req.body as SupportFormBody;

    try {
      await sendSupportEmails(body);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg === "EMAIL_NOT_CONFIGURED") {
        return res.status(500).json({
          success: false,
          message: "Support email is not configured on the server.",
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error: unknown) {
    console.error("Error in supportForm controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while sending your message. Please try again later.",
    });
  }
}
