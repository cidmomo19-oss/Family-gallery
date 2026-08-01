// GET: Ambil semua data media dari D1
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM media ORDER BY created_at DESC"
    ).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST: Simpan metadata ke D1
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { title, description, category, media_type, r2_key, view_url, download_url, file_size } = body;

    if (!title || !r2_key || !view_url || !media_type) {
      return new Response(JSON.stringify({ success: false, error: "Data wajib tidak lengkap" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const info = await env.DB.prepare(
      `INSERT INTO media (title, description, category, media_type, r2_key, view_url, download_url, file_size) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      title, 
      description || '', 
      category || 'Umum', 
      media_type, 
      r2_key, 
      view_url, 
      download_url || view_url, 
      file_size || 0
    ).run();

    return new Response(JSON.stringify({ success: true, id: info.meta.last_row_id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
