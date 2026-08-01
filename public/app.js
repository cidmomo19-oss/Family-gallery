const POKOCO_BASE_URL = "https://pokoco-co.pages.dev";
// 🔑 MASUKKAN API KEY KAMU DI SINI (PASTE DI DALAM TANDA PETIK)
const POKOCO_API_KEY = "Ipulapik999#";

let mediaItems = [];
let activeFilter = "all";
let currentSelectedItem = null;
let currentFolder = null;
let selectedFilesQueue = []; // Temporarily hold selected files
let remoteUrlToUpload = null; // Temporarily hold remote link url

// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

const folderGrid = document.getElementById("folderGrid");
const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const lightboxModal = document.getElementById("lightboxModal");
const settingsModal = document.getElementById("settingsModal");

// Folder Prompt Modal Elements
const folderPromptModal = document.getElementById("folderPromptModal");
const folderPromptInput = document.getElementById("folderPromptInput");
const btnConfirmUpload = document.getElementById("btnConfirmUpload");
const btnCancelUpload = document.getElementById("btnCancelUpload");

// Remote MP4 upload elements
const remoteLinkInput = document.getElementById("remoteLinkInput");
const btnRemoteUpload = document.getElementById("btnRemoteUpload");

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
      if (currentFolder) {
        renderFolderGallery();
      } else {
        renderFolders();
      }
    }
  } catch (err) {
    console.error("Gagal mengambil data galeri:", err);
  }
}

// Render Folder Grid
function renderFolders() {
  const foldersMap = {};

  mediaItems.forEach(item => {
    const cat = item.category || "Umum";
    if (!foldersMap[cat]) {
      foldersMap[cat] = {
        name: cat,
        files: [],
        lastUpdated: item.created_at || ""
      };
    }
    foldersMap[cat].files.push(item);
    if (item.created_at && (!foldersMap[cat].lastUpdated || item.created_at > foldersMap[cat].lastUpdated)) {
      foldersMap[cat].lastUpdated = item.created_at;
    }
  });

  const folders = Object.values(foldersMap);

  if (folders.length === 0) {
    folderGrid.classList.add("hidden");
    galleryGrid.classList.add("hidden");
    document.getElementById("filterContainer").classList.add("hidden");
    document.getElementById("btnBackToFolders").classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  folderGrid.classList.remove("hidden");
  galleryGrid.classList.add("hidden");
  document.getElementById("filterContainer").classList.add("hidden");
  document.getElementById("btnBackToFolders").classList.add("hidden");
  document.getElementById("galleryTitle").innerHTML = `
    <i data-lucide="folder" class="w-3.5 h-3.5 text-violet-500"></i>
    <span>Daftar Folder Bani Dumeri</span>
  `;

  folderGrid.innerHTML = folders.map(f => {
    let dateStr = "Belum diketahui";
    if (f.lastUpdated) {
      try {
        const d = new Date(f.lastUpdated.replace(" ", "T") + "Z");
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        dateStr = d.toLocaleDateString('id-ID', options);
      } catch (e) {
        dateStr = f.lastUpdated;
      }
    }

    const previewImg = f.files.find(item => item.media_type === "image");
    const previewVideo = f.files.find(item => item.media_type === "video");

    let previewHtml = "";
    if (previewImg) {
      previewHtml = `<img src="${previewImg.view_url}" alt="${f.name}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300">`;
    } else if (previewVideo) {
      // Loop muted autoplay video thumbnail snippet
      previewHtml = `
        <video src="${previewVideo.view_url}#t=0.5" muted autoplay loop playsinline class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" preload="metadata"></video>
        <div class="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div class="w-7 h-7 bg-white/90 rounded-full text-violet-600 shadow-sm flex items-center justify-center">
            <i data-lucide="play" class="w-2.5 h-2.5 fill-current"></i>
          </div>
        </div>
      `;
    } else {
      previewHtml = `
        <div class="w-full h-full bg-violet-50 text-violet-500 flex items-center justify-center">
          <i data-lucide="folder" class="w-10 h-10"></i>
        </div>
      `;
    }

    return `
      <div onclick="selectFolder('${encodeURIComponent(f.name)}')" class="group premium-card overflow-hidden cursor-pointer hover:border-violet-300 active:scale-95 transition-all duration-250 flex flex-col">
        <div class="aspect-[4/3] w-full bg-neutral-100 overflow-hidden relative border-b border-purple-100/50">
          ${previewHtml}
          <div class="absolute top-2 right-2 bg-neutral-900/60 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white tracking-wide">
            ${f.files.length} Item
          </div>
        </div>
        <div class="p-3.5 flex-1 flex flex-col justify-between">
          <h4 class="text-xs font-extrabold text-neutral-800 group-hover:text-violet-600 transition-colors line-clamp-1">${f.name}</h4>
          <span class="text-[9px] text-neutral-400 font-semibold tracking-wide flex items-center gap-1 mt-1">
            <i data-lucide="calendar" class="w-2.5 h-2.5"></i>
            ${dateStr}
          </span>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// Select a folder to display
window.selectFolder = (encodedName) => {
  currentFolder = decodeURIComponent(encodedName);
  renderFolderGallery();
};

// Render Media Grid inside a Folder
function renderFolderGallery() {
  if (!currentFolder) {
    renderFolders();
    return;
  }

  const folderFiles = mediaItems.filter(item => {
    const cat = item.category || "Umum";
    return cat === currentFolder;
  });

  const filtered = folderFiles.filter(item => {
    return activeFilter === "all" ? true : item.media_type === activeFilter;
  });

  folderGrid.classList.add("hidden");
  galleryGrid.classList.remove("hidden");
  document.getElementById("filterContainer").classList.remove("hidden");
  document.getElementById("btnBackToFolders").classList.remove("hidden");
  emptyState.classList.add("hidden");

  document.getElementById("galleryTitle").innerHTML = `
    <i data-lucide="folder-open" class="w-3.5 h-3.5 text-violet-500"></i>
    <span class="truncate max-w-[150px]">${currentFolder}</span>
  `;

  if (filtered.length === 0) {
    galleryGrid.innerHTML = `
      <div class="col-span-3 text-center py-12 text-neutral-400 font-semibold text-[10px]">
        Tidak ada berkas dengan jenis filter ini.
      </div>
    `;
    lucide.createIcons();
    return;
  }

  galleryGrid.innerHTML = filtered.map(item => `
    <div onclick="openLightbox(${item.id})" class="group relative aspect-square bg-neutral-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-md active:scale-95 transition-all duration-250 border border-purple-100/30">
      ${item.media_type === 'image'
        ? `<img src="${item.view_url}" alt="${item.title}" loading="lazy" class="w-full h-full object-cover">`
        : `<video src="${item.view_url}#t=0.5" class="w-full h-full object-cover" preload="metadata"></video>
           <div class="absolute inset-0 bg-neutral-950/10 flex items-center justify-center">
             <div class="w-8 h-8 bg-white/95 rounded-full text-violet-600 shadow-sm flex items-center justify-center">
               <i data-lucide="play" class="w-3 h-3 fill-current"></i>
             </div>
           </div>`
      }
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
  const btnBackToFolders = document.getElementById("btnBackToFolders");

  if (btnCloseLightbox) {
    btnCloseLightbox.onclick = () => {
      lightboxModal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    };
  }

  if (btnSettings) btnSettings.onclick = () => settingsModal.classList.remove("hidden");
  if (btnCloseSettings) btnCloseSettings.onclick = () => settingsModal.classList.add("hidden");

  if (btnBackToFolders) {
    btnBackToFolders.onclick = () => {
      currentFolder = null;
      renderFolders();
    };
  }

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
      renderFolderGallery();
    };
  });

  // Folder modal cancel/confirm trigger
  if (btnCancelUpload) {
    btnCancelUpload.onclick = () => {
      selectedFilesQueue = [];
      remoteUrlToUpload = null;
      fileInput.value = "";
      folderPromptInput.value = "";
      folderPromptModal.classList.add("hidden");
    };
  }

  if (btnConfirmUpload) {
    btnConfirmUpload.onclick = () => {
      const folderVal = folderPromptInput.value.trim();
      if (!folderVal) {
        alert("Silakan isi Nama Folder!");
        folderPromptInput.focus();
        return;
      }
      folderPromptModal.classList.add("hidden");

      if (remoteUrlToUpload) {
        handleRemoteUpload(remoteUrlToUpload, folderVal);
      } else {
        handleBatchUpload(selectedFilesQueue, folderVal);
      }
    };
  }

  // Bind Remote Link upload button click
  if (btnRemoteUpload && remoteLinkInput) {
    btnRemoteUpload.onclick = () => {
      const linkVal = remoteLinkInput.value.trim();
      if (!linkVal) {
        alert("Silakan tempel URL video .mp4 terlebih dahulu!");
        remoteLinkInput.focus();
        return;
      }
      if (!linkVal.toLowerCase().endsWith(".mp4") && !linkVal.toLowerCase().includes(".mp4?")) {
        alert("URL harus diakhiri atau memiliki format video .mp4!");
        remoteLinkInput.focus();
        return;
      }

      // Store link and prompt folder modal
      remoteUrlToUpload = linkVal;
      selectedFilesQueue = []; // Clear local file queue
      folderPromptInput.value = "";
      folderPromptModal.classList.remove("hidden");
      folderPromptInput.focus();
    };
  }

  // Direct Mobile-friendly Dropzone File Selection trigger
  if (dropzone) {
    dropzone.onclick = () => {
      fileInput.click();
    };

    // Drag and Drop fallback support
    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add("border-violet-400", "bg-violet-50/20");
    };

    // Drag and Drop leave
    dropzone.ondragleave = () => {
      dropzone.classList.remove("border-violet-400", "bg-violet-50/20");
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-violet-400", "bg-violet-50/20");

      if (e.dataTransfer.files.length > 0) {
        selectedFilesQueue = Array.from(e.dataTransfer.files);
        remoteUrlToUpload = null; // Clear remote link
        // Show folder name prompt modal
        folderPromptInput.value = "";
        folderPromptModal.classList.remove("hidden");
        folderPromptInput.focus();
      }
    };
  }

  // File input changes trigger
  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        selectedFilesQueue = Array.from(e.target.files);
        remoteUrlToUpload = null; // Clear remote link
        // Show folder name prompt modal
        folderPromptInput.value = "";
        folderPromptModal.classList.remove("hidden");
        folderPromptInput.focus();
      }
    };
  }
}

// Handle Remote MP4 URL Link metadata entry in D1 Directly
async function handleRemoteUpload(remoteUrl, folderName) {
  // Extract custom title from url filename
  let autoTitle = "Video Link";
  try {
    const parts = remoteUrl.split("/");
    const lastPart = parts[parts.length - 1].split("?")[0];
    if (lastPart && lastPart.toLowerCase().endsWith(".mp4")) {
      autoTitle = lastPart.substring(0, lastPart.lastIndexOf("."));
    }
  } catch (e) {}

  // Show status indicator
  uploadProgressContainer.classList.remove("hidden");
  overallProgressText.innerText = "Menghubungkan link video...";
  progressBar.style.width = "40%";
  uploadPercent.innerText = "40%";

  statusList.innerHTML = `
    <div class="flex items-center justify-between text-[10px] bg-neutral-50 p-2.5 rounded-xl border border-purple-100/30">
      <span class="text-neutral-700 font-semibold truncate max-w-[70%]">${autoTitle}.mp4</span>
      <span class="status-badge text-amber-500 font-extrabold uppercase tracking-wider text-[8px]">Menyimpan Link</span>
    </div>
  `;

  try {
    // Write directly to D1 metadata api
    const saveRes = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: autoTitle,
        description: "Remote Uploaded Link",
        category: folderName,
        media_type: "video",
        r2_key: "remote-" + Date.now(),
        view_url: remoteUrl,
        download_url: remoteUrl,
        file_size: 0
      })
    });

    const saveData = await saveRes.json();
    if (!saveData.success) throw new Error("Gagal menyimpan metadata link.");

    progressBar.style.width = "100%";
    uploadPercent.innerText = "100%";
    overallProgressText.innerText = "Simpan link berhasil!";

    const badge = document.querySelector(".status-badge");
    if (badge) {
      badge.innerText = "Selesai";
      badge.className = "status-badge text-green-600 font-extrabold uppercase tracking-wider text-[8px]";
    }
  } catch (err) {
    console.error("Gagal menyimpan remote link:", err);
    progressBar.style.width = "100%";
    overallProgressText.innerText = "Simpan link gagal.";
    const badge = document.querySelector(".status-badge");
    if (badge) {
      badge.innerText = "Gagal";
      badge.className = "status-badge text-red-500 font-extrabold uppercase tracking-wider text-[8px]";
    }
  }

  setTimeout(() => {
    uploadProgressContainer.classList.add("hidden");
    remoteLinkInput.value = "";
    remoteUrlToUpload = null;
    currentFolder = folderName;
    fetchMediaList();
  }, 1200);
}

// Seamless batch upload logic with instantaneous execution and ZERO prompts
async function handleBatchUpload(files, folderName) {
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

      // Step 3: Simpan Metadata ke D1 Database
      const saveRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: autoTitle,
          description: "",
          category: folderName,
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
    folderPromptInput.value = "";
    selectedFilesQueue = [];
    currentFolder = folderName;
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
    // Reverted plain photo viewer with right-click / context menu prevention
    contentContainer.innerHTML = `
      <img src="${item.view_url}"
           oncontextmenu="return false;"
           class="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl no-download-touch">
    `;
  } else {
    // Reverted to native HTML5 browser player with download blocking options
    contentContainer.innerHTML = `
      <video src="${item.view_url}"
             controls
             controlslist="nodownload"
             oncontextmenu="return false;"
             playsinline
             class="max-h-[75vh] w-full rounded-xl shadow-2xl no-download-touch"
             autoplay>
      </video>
    `;
  }

  // Lock scrolling
  document.body.classList.add("overflow-hidden");

  lightboxModal.classList.remove("hidden");
};
