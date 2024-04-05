import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { StreamingTextResponse } from 'ai';
import { getBusinessUser } from '@/app/lib/utils';

const appHost = process.env['AZURE_APP_HOST'];
const appKey = process.env['AZURE_APP_API_KEY'] || 'no-api-key';

export const POST = async (req: NextRequest) => {
    const session = await auth();
    if (session?.user) {
        try {
            const body = await req.json();
            const response = await fetch(appHost + 'conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-business-user': getBusinessUser(session),
                    Authorization: appKey,
                },
                body: JSON.stringify(body),
            });

            const conversationId = response.headers.get('x-conversation-id');

            // Check if the response is successful (status code 2xx)
            if (response.ok) {

                const headers = {
                    'Content-Type': 'application/json',
                    'x-conversation-id': ''
                };
                
                // If the conversation-id header is present, add it to the headers
                if (conversationId) {
                    headers['x-conversation-id'] = conversationId;
                }

                // Check if the response has JSON content type
                if (response.headers.get('content-type')?.includes('application/json')) {
                    return new NextResponse(JSON.stringify(await response.json()), {
                        status: response.status,
                        headers: headers,
                    });
                } else {
                    // If not JSON, stream the response
                    if (response.body) {
                        const streamingResponse = new StreamingTextResponse(response.body);
                        if (conversationId) {
                            streamingResponse.headers.set('x-conversation-id', conversationId);
                        }
                        return streamingResponse;
                    } else {
                        return new Response();
                    }
                }
            } else {
                // Handle non-successful response (e.g., error status code)
                console.error('Error:', response.status, response.statusText);
                return Response.json({ error: 'Failed to fetch data' }, { status: response.status });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            return Response.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
};
