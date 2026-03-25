// import twilio from "twilio";

// const client = twilio(
//     process.env.TWILIO_SID,
//     process.env.TWILIO_AUTH_TOKEN
// );

// export const sendWhatsAppMessage = async ({ to, message }) => {
//     return client.messages.create({
//         from: "whatsapp:+14155238886", // Twilio approved WhatsApp number
//         to: `whatsapp:${to}`,          // 91XXXXXXXXXX
//         body: message,
//     });
// };