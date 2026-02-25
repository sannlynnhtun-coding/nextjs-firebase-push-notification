import { GoogleAuth } from 'google-auth-library';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { token, topic, serviceAccount } = req.body;

    if (!token || !topic || !serviceAccount) {
        return res.status(400).json({ message: 'Missing required fields: token, topic, or serviceAccount' });
    }

    try {
        let credentials;
        try {
            credentials = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid service account JSON format.' });
        }

        const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });

        const accessToken = await auth.getAccessToken();

        const url = `https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`;

        let response;
        if (req.method === 'POST') {
            // Subscribe
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'access_token_auth': 'true'
                }
            });
        } else if (req.method === 'DELETE') {
            // Unsubscribe
            const deleteUrl = `https://iid.googleapis.com/iid/v1:batchRemove`;
            response = await fetch(deleteUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'access_token_auth': 'true'
                },
                body: JSON.stringify({
                    to: `/topics/${topic}`,
                    registration_tokens: [token]
                })
            });
        }

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const data = await response.json();
            return res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error('Topic API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
