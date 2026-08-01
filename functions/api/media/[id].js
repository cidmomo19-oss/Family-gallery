export async function onRequestDelete({ params, request, env }) {
  try {
    const mediaId = params.id;
    const apiKey = request.headers.get("X-API-Key");

    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "X-API-Key dibutuhkan" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Cari data di D1 untuk mendapatkan r2_key
    const item = await env.DB.prepare("SELECT r2_key FROM media WHERE id = ?").bind(mediaId).first();

    if (!item) {
      return new Response(JSON.stringify({ success: false, error: "Media tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Hapus file dari Pokoco API
    const pokocoDeleteUrl = `https://pokoco-co.pages.dev/api/delete/${encodeURI(item.r2_key)}`;
    const pokocoRes = await fetch(pokocoDeleteUrl, {
      method: "DELETE",
      headers: { "X-API-Key": apiKey }
    });

    if (!pokocoRes.ok) {
      console.warn("Gagal menghapus file dari Pokoco, melanjutkan hapus DB...");
    }

    // 3. Hapus record dari D1
    await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run();

    return new Response(JSON.stringify({ success: true, message: "Media berhasil dihapus" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
