const POKOCO_BASE_URL = "https://pokoco-co.pages.dev";
// 🔑 MASUKKAN API KEY KAMU DI SINI (PASTE DI DALAM TANDA PETIK)
const POKOCO_API_KEY = "Ipulapik999#";

let mediaItems = [];
let activeFilter = "all";
let currentSelectedItem = null;

// Track selected files for the custom file input view
let selectedFilesList = [];

// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const uploadModal = document.getElementById("uploadModal");
const lightboxModal = document.getElementById("lightboxModal");
const settingsModal = document.getElementById("settingsModal");
const uploadForm = document.getElementById("uploadForm");
const searchInput = document.getElementById("searchInput");

const fileInput = document.getElementById("fileInput");
const selectedFilesContainer = document.getElementById("selectedFilesContainer");
const selectedFilesCount = document.getElementById("selectedFilesCount");
const selectedFilesListEl = document.getElementById("selectedFilesList");
const btnClearSelection = document.getElementById("btnClearSelection");

// App Init
document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const currentYearEl = document.getElementById("currentYear");
  if (currentYearEl) {
    currentYearEl.innerText = new Date().getFullYear();
  }

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
                        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                        (item.category && item.category.toLowerCase().includes(searchTerm));
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
    <div onclick="openLightbox(${item.id})" class="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex flex-col shadow-sm">
      <div class="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
        ${item.media_type === 'image' 
          ? `<img src="${item.view_url}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">`
          : `<video src="${item.view_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
             <div class="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 flex items-center justify-center transition-all duration-300">
               <div class="p-3 bg-brand-600/90 rounded-full text-white shadow-lg shadow-brand-600/20 transform group-hover:scale-110 transition duration-300">
                 <i data-lucide="play" class="w-5 h-5 fill-current"></i>
               </div>
             </div>`
        }
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-slate-200/50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1 shadow-sm">
          <i data-lucide="${item.media_type === 'image' ? 'image' : 'video'}" class="w-3 h-3 text-brand-500"></i>
          ${item.category || 'Umum'}
        </span>
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 class="font-bold text-slate-800 group-hover:text-brand-600 transition duration-200 line-clamp-1 text-sm tracking-tight">${item.title}</h3>
          <p class="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">${item.description || 'Tidak ada cerita'}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span class="flex items-center gap-1">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            ${new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span class="uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${item.media_type}</span>
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
  const btnSettings = document.getElementById("btnSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const btnSaveKey = document.getElementById("btnSaveKey");
  const apiKeyInput = document.getElementById("apiKeyInput");

  // Load API Key if saved in local storage (fallback to constant)
  const savedApiKey = localStorage.getItem("POKOCO_API_KEY") || POKOCO_API_KEY;
  if (apiKeyInput) {
    apiKeyInput.value = savedApiKey;
  }

  if (btnOpenUpload) btnOpenUpload.onclick = () => {
    resetUploadForm();
    uploadModal.classList.remove("hidden");
  };
  if (btnCloseUpload) btnCloseUpload.onclick = () => uploadModal.classList.add("hidden");
  if (btnCloseLightbox) btnCloseLightbox.onclick = () => lightboxModal.classList.add("hidden");

  if (btnSettings) btnSettings.onclick = () => settingsModal.classList.remove("hidden");
  if (btnCloseSettings) btnCloseSettings.onclick = () => settingsModal.classList.add("hidden");

  if (btnSaveKey && apiKeyInput) {
    btnSaveKey.onclick = () => {
      localStorage.setItem("POKOCO_API_KEY", apiKeyInput.value.trim());
      alert("API Key berhasil disimpan!");
      settingsModal.classList.add("hidden");
    };
  }

  // Handle Multi-file selection display
  if (fileInput) {
    fileInput.onchange = (e) => {
      selectedFilesList = Array.from(e.target.files);
      updateSelectedFilesUI();
    };
  }

  if (btnClearSelection) {
    btnClearSelection.onclick = () => {
      fileInput.value = "";
      selectedFilesList = [];
      updateSelectedFilesUI();
    };
  }

  // Search & Filter
  if (searchInput) searchInput.oninput = () => renderGallery();
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".cat-btn").forEach(b => {
        b.classList.remove("bg-brand-600", "text-white", "shadow-sm");
        b.classList.add("bg-white", "text-slate-600", "border", "border-slate-200/80");
      });
      btn.classList.remove("bg-white", "text-slate-600", "border", "border-slate-200/80");
      btn.classList.add("bg-brand-600", "text-white", "shadow-sm");
      activeFilter = btn.dataset.cat;
      renderGallery();
    };
  });

  // Handle Form Upload
  uploadForm.onsubmit = async (e) => {
    e.preventDefault();

    if (selectedFilesList.length === 0) {
      alert("Silakan pilih minimal satu file foto atau video.");
      return;
    }

    const customTitle = document.getElementById("titleInput").value.trim();
    const category = document.getElementById("categoryInput").value;
    const description = document.getElementById("descInput").value.trim();
    const dateInput = document.getElementById("dateInput").value;

    const progressContainer = document.getElementById("uploadProgressContainer");
    const progressBar = document.getElementById("progressBar");
    const uploadStatusText = document.getElementById("uploadStatusText");
    const uploadPercent = document.getElementById("uploadPercent");
    const overallProgressText = document.getElementById("overallProgressText");
    const btnSubmit = document.getElementById("btnSubmitUpload");

    btnSubmit.disabled = true;
    progressContainer.classList.remove("hidden");

    const currentKey = localStorage.getItem("POKOCO_API_KEY") || POKOCO_API_KEY;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFilesList.length; i++) {
      const file = selectedFilesList[i];
      const isVideo = file.type.startsWith("video/");
      const mediaType = isVideo ? "video" : "image";

      // Automatic fallback title generation
      let title = customTitle;
      if (!title) {
        // Fallback: Use filename without extension
        const lastDotIndex = file.name.lastIndexOf(".");
        title = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      } else if (selectedFilesList.length > 1) {
        // If batch uploading and custom title is specified, append index
        title = `${customTitle} (${i + 1})`;
      }

      overallProgressText.innerText = `Mengunggah file ke-${i + 1} dari ${selectedFilesList.length}...`;
      progressBar.style.width = "0%";
      uploadPercent.innerText = "0%";

      try {
        // Step 1: Request Presigned Upload URL ke Pokoco API
        uploadStatusText.innerText = `Menghubungkan: ${file.name}`;
        const initRes = await fetch(`${POKOCO_BASE_URL}/api/upload`, {
          method: "POST",
          headers: {
            "X-API-Key": currentKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: file.type || "application/octet-stream",
            size: file.size,
            filename: file.name
          })
        });

        const initData = await initRes.json();
        if (!initData.success) throw new Error("Gagal mengontak Pokoco API. Silakan cek API Key Anda.");

        // Step 2: PUT File Mentah ke uploadUrl Presigned Pokoco
        uploadStatusText.innerText = `Mengirim: ${file.name}`;
        
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
            else reject(new Error("Gagal upload file ke Pokoco Storage."));
          };
          xhr.onerror = () => reject(new Error("Koneksi terputus saat upload."));
          xhr.send(file);
        });

        // Step 3: Simpan Metadata ke D1 Database
        uploadStatusText.innerText = `Menyimpan memori...`;

        // Use custom date if provided, otherwise default to current server timestamp
        const postData = {
          title,
          description,
          category,
          media_type: mediaType,
          r2_key: initData.id,
          view_url: initData.viewUrl,
          download_url: initData.downloadUrl,
          file_size: file.size
        };

        if (dateInput) {
          postData.created_at = new Date(dateInput).toISOString();
        }

        const saveRes = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData)
        });

        const saveData = await saveRes.json();
        if (!saveData.success) throw new Error("Gagal menyimpan metadata ke Database.");

        successCount++;
      } catch (err) {
        console.error(`Gagal mengunggah ${file.name}:`, err);
        failCount++;
      }
    }

    // Success / Finish Notification
    progressContainer.classList.add("hidden");
    btnSubmit.disabled = false;

    if (failCount === 0) {
      alert(`Berhasil mengunggah ${successCount} kenangan baru!`);
    } else {
      alert(`Selesai dengan kendala. Berhasil: ${successCount}, Gagal: ${failCount}.`);
    }

    uploadModal.classList.add("hidden");
    resetUploadForm();
    fetchMediaList();
  };
}

function updateSelectedFilesUI() {
  if (selectedFilesList.length > 0) {
    selectedFilesContainer.classList.remove("hidden");
    selectedFilesCount.innerText = selectedFilesList.length;

    selectedFilesListEl.innerHTML = selectedFilesList.map((file, idx) => {
      const isVideo = file.type.startsWith("video/");
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeStr = sizeKB > 1000 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      return `
        <div class="flex items-center justify-between text-xs bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
          <div class="flex items-center gap-2 truncate max-w-[80%]">
            <i data-lucide="${isVideo ? 'video' : 'image'}" class="w-4 h-4 text-brand-500 shrink-0"></i>
            <span class="text-slate-700 font-medium truncate">${file.name}</span>
          </div>
          <span class="text-slate-400 text-[10px] shrink-0 font-semibold">${sizeStr}</span>
        </div>
      `;
    }).join("");
    lucide.createIcons();
  } else {
    selectedFilesContainer.classList.add("hidden");
  }
}

function resetUploadForm() {
  uploadForm.reset();
  selectedFilesList = [];
  updateSelectedFilesUI();

  const progressBar = document.getElementById("progressBar");
  const uploadPercent = document.getElementById("uploadPercent");
  const progressContainer = document.getElementById("uploadProgressContainer");

  if (progressBar) progressBar.style.width = "0%";
  if (uploadPercent) uploadPercent.innerText = "0%";
  if (progressContainer) progressContainer.classList.add("hidden");
}

// Lightbox Detail Viewer
window.openLightbox = (id) => {
  const item = mediaItems.find(i => i.id === id);
  if (!item) return;

  currentSelectedItem = item;
  const contentContainer = document.getElementById("lightboxContent");

  if (item.media_type === "image") {
    contentContainer.innerHTML = `<img src="${item.view_url}" class="max-h-[65vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800/20">`;
  } else {
    contentContainer.innerHTML = `<video src="${item.view_url}" controls autoplay class="max-h-[65vh] w-full rounded-2xl shadow-2xl border border-slate-800/20"></video>`;
  }

  document.getElementById("lightboxTitle").innerText = item.title;
  document.getElementById("lightboxDesc").innerText = item.description || "Tidak ada cerita yang ditambahkan.";

  const categoryEl = document.getElementById("lightboxCategory");
  categoryEl.innerHTML = `<i data-lucide="${item.media_type === 'image' ? 'image' : 'video'}" class="w-3.5 h-3.5 mr-1"></i> ${item.category || 'Umum'}`;
  
  const downloadBtn = document.getElementById("lightboxDownloadBtn");
  downloadBtn.href = item.download_url;

  document.getElementById("lightboxDeleteBtn").onclick = () => deleteMedia(item.id);

  lightboxModal.classList.remove("hidden");
  lucide.createIcons();
};

// Hapus Media
async function deleteMedia(id) {
  if (!confirm("Apakah kamu yakin ingin menghapus kenangan ini?")) return;

  const currentKey = localStorage.getItem("POKOCO_API_KEY") || POKOCO_API_KEY;

  try {
    const res = await fetch(`/api/media/${id}`, {
      method: "DELETE",
      headers: { "X-API-Key": currentKey }
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
