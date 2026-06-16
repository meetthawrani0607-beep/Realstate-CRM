// WhatsApp Cloud API helper — reads credentials from config file or env
import { readFile } from 'fs/promises';
import path from 'path';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

async function getCredentials() {
  // Try config file first, then env vars
  let token = process.env.WHATSAPP_TOKEN || '';
  let phoneId = process.env.WHATSAPP_PHONE_ID || '';

  try {
    const configPath = path.join(process.cwd(), '.whatsapp-config.json');
    const data = await readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    if (config.token) token = config.token;
    if (config.phoneId) phoneId = config.phoneId;
  } catch {
    // Config file doesn't exist yet, use env vars
  }

  return { token, phoneId };
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(phone, message) {
  const { token, phoneId } = await getCredentials();

  if (!token || !phoneId) {
    console.warn(`[WhatsApp MOCK MODE] Pretending to send text message to ${phone}...`);
    // Simulate a 1-second network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      success: true, 
      messageId: `mock_wa_${Date.now()}_${Math.floor(Math.random() * 1000)}` 
    };
  }

  // Normalize phone number — ensure country code
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = normalizedPhone.startsWith('91') ? normalizedPhone : `91${normalizedPhone}`;

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: fullPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', data);
      return { success: false, error: data.error?.message || 'Send failed' };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    console.error('[WhatsApp] Network error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendTemplateMessage(phone, templateName, variables = []) {
  const { token, phoneId } = await getCredentials();

  if (!token || !phoneId) {
    console.warn(`[WhatsApp MOCK MODE] Pretending to send template '${templateName}' to ${phone}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      success: true, 
      messageId: `mock_wa_tpl_${Date.now()}_${Math.floor(Math.random() * 1000)}` 
    };
  }

  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = normalizedPhone.startsWith('91') ? normalizedPhone : `91${normalizedPhone}`;

  const components = variables.length > 0
    ? [{
        type: 'body',
        parameters: variables.map((v) => ({ type: 'text', text: v })),
      }]
    : [];

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: fullPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message };

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Replace template variables like {{name}}, {{budget}} with values
 */
export function renderTemplate(template, variables = {}) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}
