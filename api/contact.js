const nodemailer = require("nodemailer");

const requiredFields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "deviceType",
  "issueDescription",
];

const readValue = (value) => (typeof value === "string" ? value.trim() : "");
const readEnv = (name) => readValue(process.env[name]);

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end(JSON.stringify({ ok: false, error: "Method not allowed." }));
    return;
  }

  const body = typeof req.body === "object" && req.body !== null ? req.body : {};
  const data = Object.fromEntries(requiredFields.map((field) => [field, readValue(body[field])]));
  const missingField = requiredFields.find((field) => !data[field]);

  if (missingField) {
    res.status(400).end(JSON.stringify({ ok: false, error: "Vyplnte prosim vsechna pole." }));
    return;
  }

  const smtpHost = readEnv("SMTP_HOST");
  const smtpPort = Number(readEnv("SMTP_PORT") || 465);
  const smtpUser = readEnv("SMTP_USER");
  const rawSmtpPass = readEnv("SMTP_PASS");
  const contactInbox = readEnv("CONTACT_INBOX") || "petahecik@gmail.com";
  const isGmail = smtpHost === "smtp.gmail.com" || smtpUser.endsWith("@gmail.com");
  const smtpPass = isGmail ? rawSmtpPass.replace(/\s+/g, "") : rawSmtpPass;

  if (!smtpHost || !smtpUser || !smtpPass) {
    res.status(500).end(JSON.stringify({ ok: false, error: "Server email neni nastaveny." }));
    return;
  }

  const transportConfig = isGmail
    ? {
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

  const transporter = nodemailer.createTransport(transportConfig);

  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const safeIssue = escapeHtml(data.issueDescription).replace(/\r?\n/g, "<br />");
  const safeDevice = escapeHtml(data.deviceType);

  const text = [
    "Nova poptavka z webu FixPlace",
    "",
    `Jmeno: ${fullName}`,
    `E-mail: ${data.email}`,
    `Telefon: ${data.phone}`,
    `Typ zarizeni: ${data.deviceType}`,
    "",
    "Popis zavady:",
    data.issueDescription,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.7">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1d4f91">Nova poptavka z webu FixPlace</h2>
      <p style="margin:0 0 10px"><strong>Jmeno:</strong> ${escapeHtml(fullName)}</p>
      <p style="margin:0 0 10px"><strong>E-mail:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
      <p style="margin:0 0 10px"><strong>Telefon:</strong> <a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></p>
      <p style="margin:0 0 10px"><strong>Typ zarizeni:</strong> ${safeDevice}</p>
      <p style="margin:18px 0 8px"><strong>Popis zavady:</strong></p>
      <div style="padding:16px;border:1px solid #d6e3f3;border-radius:14px;background:#f8fbff">${safeIssue}</div>
    </div>
  `;

  try {
    await transporter.verify();

    await transporter.sendMail({
      from: `"FixPlace web" <${smtpUser}>`,
      to: contactInbox,
      replyTo: data.email,
      subject: `Nova poptavka od ${fullName} | FixPlace`,
      text,
      html,
    });

    res.status(200).end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("Contact form send failed:", error);

    const errorCode = typeof error?.code === "string" ? error.code : "SEND_FAILED";
    const errorMessage = typeof error?.message === "string" ? error.message : "";

    let publicError = "Email se nepodarilo odeslat.";

    if (errorCode === "EAUTH" || /Invalid login|Username and Password not accepted|Missing credentials/i.test(errorMessage)) {
      publicError = "SMTP prihlaseni selhalo. Zkontroluj SMTP_USER a Gmail App Password.";
    } else if (/Application-specific password required|534-5\\.7\\.9/i.test(errorMessage)) {
      publicError = "Google vyzaduje App Password. Pouzij 16mistne heslo aplikace, ne bezne heslo do Gmailu.";
    } else if (/Please log in via your web browser|534-5\\.7\\.14|suspicious/i.test(errorMessage)) {
      publicError = "Google prihlaseni zablokoval. Zkontroluj Security alerts nebo Recent activity v Google uctu.";
    } else if (["ECONNECTION", "ESOCKET", "ETIMEDOUT", "EDNS"].includes(errorCode)) {
      publicError = "SMTP server neni dostupny. Zkontroluj SMTP_HOST a SMTP_PORT.";
    }

    res.status(500).end(JSON.stringify({ ok: false, error: publicError, code: errorCode }));
  }
};
