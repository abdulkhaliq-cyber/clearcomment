import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pageId, pageAccessToken, pageName } = await request.json();

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Page ID and Page Access Token are required' },
        { status: 400 }
      );
    }

    // TODO: Save to Supabase database
    // For now, we'll just return success
    // You'll implement the Supabase save logic in the next step
    
    // Example structure for what to save:
    // {
    //   page_id: pageId,
    //   page_name: pageName,
    //   page_access_token: pageAccessToken,
    //   user_id: userId, // from session/auth
    //   created_at: new Date(),
    //   updated_at: new Date()
    // }

    return NextResponse.json({
      success: true,
      message: 'Page connected successfully',
      pageId,
      pageName,
    });
  } catch (error: any) {
    console.error('Error connecting page:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

