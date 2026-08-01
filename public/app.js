const POKOCO_BASE_URL = "https://pokoco-co.pages.dev";
// 🔑 MASUKKAN API KEY KAMU DI SINI (PASTE DI DALAM TANDA PETIK)
const POKOCO_API_KEY = "Ipulapik999#";

let mediaItems = [];
let activeFilter = "all";
let currentSelectedItem = null;

// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const uploadModal = document.getElementById("uploadModal");
const lightboxModal = document.getElementById("lightboxModal");
const uploadForm = document.getElementById("uploadForm");
const searchInput = document.getElementById("searchInput");

// App Init
document.addEventListener("DOMContentLoaded", () => {
  fetchMediaList();
  setupEventListeners();
});

// Fetch List dari D1
async function fetchMediaList() {
  try {
    const res = await fetch("/api/media");
    const json = await res.json();
    if (json.success) {
      mediaItems = json.data;
      renderGallery();
    }
  } catch (err) {
    console.error("Gagal mengambil data galeri:", err);
  }
}

// Render Gallery Grid
function renderGallery() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  
  const filtered = mediaItems.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm) || 
                        (item.description && item.description.toLowerCase().includes(searchTerm));
    const matchCat = activeFilter === "all" ? true : item.media_type === activeFilter;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    galleryGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  galleryGrid.innerHTML = filtered.map(item => `
    <div onclick="openLightbox(${item.id})" class="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-700 transition duration-300 flex flex-col">
      <div class="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        ${item.media_type === 'image' 
          ? `<img src="${item.view_url}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">`
          : `<video src="${item.view_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
             <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
               <div class="p-3 bg-rose-600/90 rounded-full text-white shadow-lg">
                 <i data-lucide="play" class="w-6 h-6 fill-current"></i>
               </div>
             </div>`
        }
        <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300">
          ${item.category}
        </span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-slate-100 group-hover:text-rose-400 transition line-clamp-1">${item.title}</h3>
          <p class="text-slate-400 text-xs mt-1 line-clamp-2">${item.description || 'Tidak ada deskripsi'}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
          <span>${new Date(item.created_at).toLocaleDateString('id-ID')}</span>
          <span class="uppercase tracking-wider font-semibold text-[10px] text-slate-400">${item.media_type}</span>
        </div>
      </div>
    </div>
  `).join("");

  lucide.createIcons();
}

// Handlers & Event Listeners
function setupEventListeners() {
  const btnOpenUpload = document.getElementById("btnOpenUpload");
  const btnCloseUpload = document.getElementById("btnCloseUpload");
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");

  if (btnOpenUpload) btnOpenUpload.onclick = () => uploadModal.classList.remove("hidden");
  if (btnCloseUpload) btnCloseUpload.onclick = () => uploadModal.classList.add("hidden");
  if (btnCloseLightbox) btnCloseLightbox.onclick = () => lightboxModal.classList.add("hidden");

  // Search & Filter
  if (searchInput) searchInput.oninput = () => renderGallery();
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".cat-btn").forEach(b => {
        b.classList.remove("bg-rose-600", "text-white");
        b.classList.add("bg-slate-900", "text-slate-400");
      });
      btn.classList.remove("bg-slate-900", "text-slate-400");
      btn.classList.add("bg-rose-600", "text-white");
      activeFilter = btn.dataset.cat;
      renderGallery();
    };
  });

  // Handle Form Upload
  uploadForm.onsubmit = async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    const title = document.getElementById("titleInput").value;
    const category = document.getElementById("categoryInput").value;
    const description = document.getElementById("descInput").value;
    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? "video" : "image";

    const progressContainer = document.getElementById("uploadProgressContainer");
    const progressBar = document.getElementById("progressBar");
    const uploadStatusText = document.getElementById("uploadStatusText");
    const uploadPercent = document.getElementById("uploadPercent");
    const btnSubmit = document.getElementById("btnSubmitUpload");

    btnSubmit.disabled = true;
    progressContainer.classList.remove("hidden");

    try {
      // Step 1: Request Presigned Upload URL ke Pokoco API
      uploadStatusText.innerText = "Meminta izin upload...";
      const initRes = await fetch(`${POKOCO_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": POKOCO_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: file.type || "application/octet-stream",
          size: file.size,
          filename: file.name
        })
      });

      const initData = await initRes.json();
      if (!initData.success) throw new Error("Gagal mengontak Pokoco API. Cek API Key di app.js");

      // Step 2: PUT File Mentah ke uploadUrl Presigned Pokoco
      uploadStatusText.innerText = "Mengirim file...";
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", initData.uploadUrl, true);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = `${percent}%`;
            uploadPercent.innerText = `${percent}%`;
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Gagal upload file ke Pokoco Storage"));
        };
        xhr.onerror = () => reject(new Error("Koneksi terputus saat upload."));
        xhr.send(file);
      });

      // Step 3: Simpan Metadata ke D1 Database
      uploadStatusText.innerText = "Menyimpan kenangan...";
      const saveRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          media_type: mediaType,
          r2_key: initData.id,
          view_url: initData.viewUrl,
          download_url: initData.downloadUrl,
          file_size: file.size
        })
      });

      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error("Gagal menyimpan ke Database D1.");

      // Success
      uploadModal.classList.add("hidden");
      uploadForm.reset();
      progressContainer.classList.add("hidden");
      fetchMediaList();
      alert("Kenangan berhasil ditambahkan!");

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      btnSubmit.disabled = false;
    }
  };
}

// Lightbox Detail Viewer
window.openLightbox = (id) => {
  const item = mediaItems.find(i => i.id === id);
  if (!item) return;

  currentSelectedItem = item;
  const contentContainer = document.getElementById("lightboxContent");

  if (item.media_type === "image") {
    contentContainer.innerHTML = `<img src="${item.view_url}" class="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl">`;
  } else {
    contentContainer.innerHTML = `<video src="${item.view_url}" controls autoplay class="max-h-[70vh] w-full rounded-xl shadow-2xl"></video>`;
  }

  document.getElementById("lightboxTitle").innerText = item.title;
  document.getElementById("lightboxDesc").innerText = item.description || "";
  document.getElementById("lightboxCategory").innerText = item.category;
  
  const downloadBtn = document.getElementById("lightboxDownloadBtn");
  downloadBtn.href = item.download_url;

  document.getElementById("lightboxDeleteBtn").onclick = () => deleteMedia(item.id);

  lightboxModal.classList.remove("hidden");
  lucide.createIcons();
};

// Hapus Media
async function deleteMedia(id) {
  if (!confirm("Apakah kamu yakin ingin menghapus kenangan ini?")) return;

  try {
    const res = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: { "X-API-Key": POKOCO_API_KEY }
    });

    const json = await res.json();
    if (json.success) {
      lightboxModal.classList.add("hidden");
      fetchMediaList();
      alert("Kenangan berhasil dihapus!");
    } else {
      alert(`Gagal menghapus: ${json.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
