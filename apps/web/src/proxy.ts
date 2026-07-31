import { refreshProxyAuth } from '@/features/auth/auth.proxy'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  return await refreshProxyAuth(request) ?? NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)']
}
