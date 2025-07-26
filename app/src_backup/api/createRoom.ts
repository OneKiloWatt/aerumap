// createRoom.ts
export async function createRoom(nickname: string, idToken: string): Promise<string> {
	const baseUrl = process.env.REACT_APP_API_BASE_URL;

	if (!baseUrl) throw new Error('API接続先が設定されていません');

	const response = await fetch(`${baseUrl}/createRoom`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${idToken}`,
		},
		body: JSON.stringify({ nickname }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`ルーム作成失敗: ${errorText}`);
	}

	const data = await response.json();
	return data.roomId;
}

