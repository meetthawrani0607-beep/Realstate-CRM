import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[Password Reset] No user found for email: ${email}`);
      return NextResponse.json({ success: true, message: 'If an account with that email exists, we have sent a reset link.' });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing unused tokens for this email
    await prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Create new reset token
    await prisma.passwordReset.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    // Build the reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send the email
    const result = await sendPasswordResetEmail(email, resetLink);

    console.log(`[Password Reset] Email sent to ${email}, messageId: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`[Password Reset] Preview: ${result.previewUrl}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If an account with that email exists, we have sent a reset link.',
      // Include preview URL in dev mode so user can see the email
      ...(result.previewUrl ? { previewUrl: result.previewUrl } : {}),
    });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
