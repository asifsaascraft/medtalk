
import { SendMailClient } from "zeptomail";

const client = new SendMailClient({
  url: process.env.ZEPTO_URL,
  token: process.env.ZEPTO_TOKEN,
});

const sendEmail = async ({
  to,
  name,
  subject = "",
  templateKey,
  mergeInfo = {},
}) => {
  try {
    if (!to) {
      throw new Error("Recipient email is required.");
    }

    if (!templateKey) {
      throw new Error("Template key is required.");
    }

    const response = await client.sendMailWithTemplate({
      mail_template_key: templateKey,

      from: {
        address: process.env.ZEPTO_FROM,
        name: "MedTalk",
      },

      to: [
        {
          email_address: {
            address: to,
            name: name || "",
          },
        },
      ],

      subject,
      merge_info: mergeInfo,
    });

    return response;
  } catch (error) {
    console.error("ZeptoMail Error:", {
      message: error.message,
      status: error.status,
    });

    throw error;
  }
};

export default sendEmail;
