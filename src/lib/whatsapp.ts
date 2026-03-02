/** Formata telefone para link do WhatsApp */
export function formatWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}
