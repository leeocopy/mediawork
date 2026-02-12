/**
 * Safe fetch wrapper that validates JSON responses
 * Prevents "Unexpected token '<'" errors by checking content-type
 */

interface FetchOptions extends RequestInit {
    token?: string;
}

export async function safeFetch(url: string, options: FetchOptions = {}) {
    const { token, ...fetchOptions } = options;

    // Add Authorization header if token is provided
    const headers: any = {
        ...fetchOptions.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type: application/json if not FormData
    const isFormData = fetchOptions.body instanceof FormData;
    if (!isFormData && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT' || fetchOptions.method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
    }

    // Log request for debugging
    console.log(`🌐 [FETCH] ${fetchOptions.method || 'GET'} ${url}`);

    try {
        const res = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        // Log response status and content-type
        const contentType = res.headers.get('content-type') || '';
        console.log(`📡 [RESPONSE] ${url} → ${res.status} (${contentType})`);

        // Check if response is JSON
        if (contentType && !contentType.includes('application/json') && res.status >= 400) {
            // Not JSON and is an error - likely HTML error page
            const text = await res.text();
            const preview = text.substring(0, 200);

            console.error(`❌ [FETCH ERROR] Expected JSON error but got ${contentType}`);
            console.error(`   URL: ${url}`);
            console.error(`   Status: ${res.status}`);
            console.error(`   Preview: ${preview}`);

            throw new Error(
                `API returned ${contentType} error instead of JSON.\n` +
                `URL: ${url}\n` +
                `Status: ${res.status}\n` +
                `Preview: ${preview}`
            );
        }

        // Parse JSON
        let data = null;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        }

        return { res, data };
    } catch (error) {
        if (error instanceof Error && error.message.includes('API returned')) {
            throw error;
        }
        console.error(`❌ [FETCH ERROR] ${url}:`, error);
        throw new Error(`Network error: ${url}`);
    }
}

export async function apiGet(url: string, token?: string) {
    return safeFetch(url, { method: 'GET', token });
}

export async function apiPost(url: string, body: any, token?: string) {
    const isFormData = body instanceof FormData;
    return safeFetch(url, {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
        token,
    });
}

export async function apiPut(url: string, body: any, token?: string) {
    const isFormData = body instanceof FormData;
    return safeFetch(url, {
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body),
        token,
    });
}

export async function apiDelete(url: string, token?: string) {
    return safeFetch(url, { method: 'DELETE', token });
}
