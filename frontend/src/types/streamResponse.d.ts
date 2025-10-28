interface StreamResponse {
	ok: boolean;
	body: ReadableStream<Uint8Array> | null;
}
