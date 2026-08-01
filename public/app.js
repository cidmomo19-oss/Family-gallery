const POKOCO_BASE_URL = "https://pokoco-co.pages.dev";
// 🔑 MASUKKAN API KEY KAMU DI SINI (PASTE DI DALAM TANDA PETIK)
const POKOCO_API_KEY = "Ipulapik999#";

let mediaItems = [];
let activeFilter = "all";
let currentSelectedItem = null;

// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const lightboxModal = document.getElementById("lightboxModal");
const settingsModal = document.getElementById("settingsModal");

const uploadProgressContainer = document.getElementById("uploadProgressContainer");
const progressBar = document.getElementById("progressBar");
const uploadPercent = document.getElementById("uploadPercent");
const overallProgressText = document.getElementById("overallProgressText");
const statusList = document.getElementById("statusList");

// App Init
document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const currentYearEl = document.getElementById("currentYear");
  if (currentYearEl) {
    currentYearEl.innerText = new Date().getFullYear();
  }

  // Load API Key if saved in local storage (fallback to constant)
  const apiKeyInput = document.getElementById("apiKeyInput");
  const savedApiKey = localStorage.getItem("POKOCO_API_KEY") || POKOCO_API_KEY;
  if (apiKeyInput) {
    apiKeyInput.value = savedApiKey;
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

// Render Gallery Grid with high-fidelity, high-density square grids perfect for mobile viewports
function renderGallery() {
  const filtered = mediaItems.filter(item => {
    return activeFilter === "all" ? true : item.media_type === activeFilter;
  });

  if (filtered.length === 0) {
    galleryGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  galleryGrid.innerHTML = filtered.map(item => `
    <div onclick="openLightbox(${item.id})" class="group relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md active:scale-95 transition-all duration-250 border border-purple-100/30">
      ${item.media_type === 'image'
        ? `<img src="${item.view_url}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover">`
        : `<video src="${item.view_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
           <div class="absolute inset-0 bg-neutral-950/10 flex items-center justify-center">
             <div class="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full text-violet-600 shadow-sm flex items-center justify-center">
               <i data-lucide="play" class="w-3 h-3 fill-current"></i>
             </div>
           </div>`
      }
      <!-- Quick Title Hover/Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-neutral-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
        <p class="text-white text-[9px] font-bold truncate tracking-wide">${item.title}</p>
      </div>
    </div>
  `).join("");

  lucide.createIcons();
}

// Handlers & Event Listeners
function setupEventListeners() {
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");
  const btnSettings = document.getElementById("btnSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const btnSaveKey = document.getElementById("btnSaveKey");
  const apiKeyInput = document.getElementById("apiKeyInput");

  if (btnCloseLightbox) btnCloseLightbox.onclick = () => lightboxModal.classList.add("hidden");
  if (btnSettings) btnSettings.onclick = () => settingsModal.classList.remove("hidden");
  if (btnCloseSettings) btnCloseSettings.onclick = () => settingsModal.classList.add("hidden");

  if (btnSaveKey && apiKeyInput) {
    btnSaveKey.onclick = () => {
      localStorage.setItem("POKOCO_API_KEY", apiKeyInput.value.trim());
      alert("API Key disimpan.");
      settingsModal.classList.add("hidden");
    };
  }

  // Filter Sub-categories
  document.querySelectorAll(".sub-cat-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".sub-cat-btn").forEach(b => {
        b.classList.remove("bg-white", "text-neutral-900", "shadow-sm");
        b.classList.add("text-neutral-400", "hover:text-neutral-900");
      });
      btn.classList.remove("text-neutral-400", "hover:text-neutral-900");
      btn.classList.add("bg-white", "text-neutral-900", "shadow-sm");
      activeFilter = btn.dataset.cat;
      renderGallery();
    };
  });

  // Direct Mobile-friendly Dropzone File Selection trigger (opens native OS selector instantly)
  if (dropzone) {
    dropzone.onclick = () => {
      fileInput.click();
    };

    // Drag and Drop fallback support
    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add("border-violet-400", "bg-violet-50/20");
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove("border-violet-400", "bg-violet-50/20");
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-violet-400", "bg-violet-50/20");

      if (e.dataTransfer.files.length > 0) {
        handleBatchUpload(Array.from(e.dataTransfer.files));
      }
    };
  }

  // File input changes trigger upload instantly with zero prompts
  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleBatchUpload(Array.from(e.target.files));
      }
    };
  }
}

// Seamless batch upload logic with instantaneous execution and ZERO prompts
async function handleBatchUpload(files) {
  if (files.length === 0) return;

  const currentKey = localStorage.getItem("POKOCO_API_KEY") || POKOCO_API_KEY;

  // Reveal progress container
  uploadProgressContainer.classList.remove("hidden");

  let successCount = 0;
  let failCount = 0;

  // Initialize status queue UI list
  statusList.innerHTML = files.map(f => `
    <div id="file-row-${f.name.replace(/[^a-zA-Z0-9]/g, '')}" class="flex items-center justify-between text-[10px] bg-neutral-50 p-2.5 rounded-xl border border-purple-100/30">
      <span class="text-neutral-700 font-semibold truncate max-w-[70%]">${f.name}</span>
      <span class="status-badge text-neutral-400 font-extrabold uppercase tracking-wider text-[8px]">Menunggu</span>
    </div>
  `).join("");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? "video" : "image";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '');
    const rowEl = document.getElementById(`file-row-${sanitizedName}`);
    const badgeEl = rowEl ? rowEl.querySelector(".status-badge") : null;

    // Automatic filename-to-title mapping (remove extension)
    const lastDotIndex = file.name.lastIndexOf(".");
    const autoTitle = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;

    overallProgressText.innerText = `Menyimpan berkas ke-${i + 1} dari ${files.length}...`;
    progressBar.style.width = "0%";
    uploadPercent.innerText = "0%";

    if (badgeEl) {
      badgeEl.innerText = "Mengunggah";
      badgeEl.className = "status-badge text-amber-500 font-extrabold uppercase tracking-wider text-[8px]";
    }

    try {
      // Step 1: Request Presigned Upload URL ke Pokoco API
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
      if (!initData.success) throw new Error("Gagal mengontak Pokoco API.");

      // Step 2: PUT File Mentah ke uploadUrl Presigned Pokoco
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

      // Step 3: Simpan Metadata ke D1 Database (Simplified database insertion)
      const saveRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: autoTitle,
          description: "", // No description
          category: "Umum", // Default category
          media_type: mediaType,
          r2_key: initData.id,
          view_url: initData.viewUrl,
          download_url: initData.downloadUrl,
          file_size: file.size
        })
      });

      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error("Gagal menyimpan metadata ke Database.");

      successCount++;
      if (badgeEl) {
        badgeEl.innerText = "Selesai";
        badgeEl.className = "status-badge text-green-600 font-extrabold uppercase tracking-wider text-[8px]";
      }
    } catch (err) {
      console.error(`Gagal mengunggah ${file.name}:`, err);
      failCount++;
      if (badgeEl) {
        badgeEl.innerText = "Gagal";
        badgeEl.className = "status-badge text-red-500 font-extrabold uppercase tracking-wider text-[8px]";
      }
    }
  }

  // Complete notification & refresh view
  overallProgressText.innerText = "Unggahan selesai!";
  progressBar.style.width = "100%";
  uploadPercent.innerText = "100%";

  setTimeout(() => {
    uploadProgressContainer.classList.add("hidden");
    fileInput.value = "";
    fetchMediaList();
  }, 1200);
}

// Lightbox Detail Viewer
window.openLightbox = (id) => {
  const item = mediaItems.find(i => i.id === id);
  if (!item) return;

  currentSelectedItem = item;
  const contentContainer = document.getElementById("lightboxContent");

  if (item.media_type === "image") {
    contentContainer.innerHTML = `<img src="${item.view_url}" class="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl">`;
  } else {
    contentContainer.innerHTML = `<video src="${item.view_url}" controls autoplay class="max-h-[75vh] w-full rounded-xl shadow-2xl"></video>`;
  }

  document.getElementById("lightboxTitle").innerText = item.title;
  
  const downloadBtn = document.getElementById("lightboxDownloadBtn");
  downloadBtn.href = item.download_url;

  document.getElementById("lightboxDeleteBtn").onclick = () => deleteMedia(item.id);

  lightboxModal.classList.remove("hidden");
  lucide.createIcons();
};

// Hapus Media
async function deleteMedia(id) {
  if (!confirm("Hapus file ini selamanya?")) return;

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
    } else {
      alert(`Gagal menghapus: ${json.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
