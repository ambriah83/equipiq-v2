// Proxy function for Limble API calls to avoid CORS issues
exports.handler = async (event, context) => {
  // Only allow specific methods
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the path from the query string
    const { path } = event.queryStringParameters || {};
    if (!path) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Path parameter is required' }) 
      };
    }

    // Get Limble credentials from environment
    const clientId = process.env.LIMBLE_CLIENT_ID || '0IUG6E5S77MPV37ZGPM9LW7MAN41YZTH';
    const clientSecret = process.env.LIMBLE_CLIENT_SECRET || process.env.VITE_LIMBLE_CLIENT_SECRET;
    
    if (!clientSecret) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Limble credentials not configured' }) 
      };
    }

    // Create Basic Auth header
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Build the Limble API URL
    const limbleUrl = `https://api.limblecmms.com/v2${path}`;
    
    console.log('Proxying request to:', limbleUrl);

    // Make the request to Limble
    const response = await fetch(limbleUrl, {
      method: event.httpMethod,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: event.body || undefined
    });

    const data = await response.text();
    
    return {
      statusCode: response.status,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      }
    };
  } catch (error) {
    console.error('Limble proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};