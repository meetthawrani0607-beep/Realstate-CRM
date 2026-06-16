import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '.whatsapp-config.json');

async function readConfig() {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { token: '', phoneId: '', verifyToken: '' };
  }
}

async function writeConfig(config) {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// GET — Check WhatsApp status and return masked config
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const config = await readConfig();

  // Also check env vars
  const envToken = process.env.WHATSAPP_TOKEN;
  const envPhoneId = process.env.WHATSAPP_PHONE_ID;

  const token = config.token || envToken || '';
  const phoneId = config.phoneId || envPhoneId || '';

  const connected = !!(token && phoneId);

  return NextResponse.json({
    status: connected ? 'connected' : 'disconnected',
    config: {
      token: token ? '••••••' + token.slice(-6) : '',
      phoneId: phoneId || '',
      verifyToken: config.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || '',
    },
  });
}

// POST — Save WhatsApp credentials
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();

  // Save to config file (and also update process.env for immediate use)
  const config = {
    token: body.token?.startsWith('••') ? (await readConfig()).token : body.token,
    phoneId: body.phoneId,
    verifyToken: body.verifyToken,
  };

  await writeConfig(config);

  // Update process.env for immediate use in this session
  if (config.token && !config.token.startsWith('••')) {
    process.env.WHATSAPP_TOKEN = config.token;
  }
  if (config.phoneId) {
    process.env.WHATSAPP_PHONE_ID = config.phoneId;
  }
  if (config.verifyToken) {
    process.env.WHATSAPP_VERIFY_TOKEN = config.verifyToken;
  }

  return NextResponse.json({ success: true });
}
