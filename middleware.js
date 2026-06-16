import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if user is logged in for dashboard routes
    if (path.startsWith('/dashboard') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based authorization example:
    // Only super_admin or agency_admin can access the settings portal configurations
    if (path.startsWith('/dashboard/integrations') && 
        !['super_admin', 'agency_admin'].includes(token?.role)) {
      // Redirect unauthorized users to dashboard home
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    // We only want the middleware to run on specific paths
    pages: {
      signIn: '/login',
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/leads/:path*',
    '/api/properties/:path*',
    '/api/dashboard/:path*',
    '/api/upload/:path*'
  ]
};
