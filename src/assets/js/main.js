const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function normalizeUrl(url, basePath = "/") {
  if (!url) return "#";
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(url)) return url;
  const cleanBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  if (cleanBase && !cleanUrl.startsWith(`${cleanBase}/`) && cleanUrl !== cleanBase) {
    return `${cleanBase}${cleanUrl}`;
  }
  return cleanUrl;
}

document.addEventListener("alpine:init", () => {
  Alpine.data("siteShell", () => ({
    navOpen: false,
    dark: false,
    init() {
      try {
        const saved = localStorage.getItem("imigi-theme");
        if (saved === "dark" || saved === "light") {
          this.dark = saved === "dark";
        } else if (window.matchMedia) {
          this.dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
      } catch (_) {}
      this.applyTheme();
    },
    toggleNav() {
      this.navOpen = !this.navOpen;
    },
    closeAll() {
      this.navOpen = false;
    },
    toggleTheme() {
      this.dark = !this.dark;
      this.applyTheme();
      try {
        localStorage.setItem("imigi-theme", this.dark ? "dark" : "light");
      } catch (_) {}
    },
    applyTheme() {
      document.documentElement.dataset.theme = this.dark ? "dark" : "light";
    }
  }));

  Alpine.data("toolSearch", () => ({
    query: "",
    open: false,
    matches: [],
    tools: [],
    init() {
      const node = document.getElementById("tool-index-data");
      if (!node || !node.textContent.trim()) return;
      const basePath = document.querySelector('link[rel="stylesheet"]')?.getAttribute("href")?.replace(/\/assets\/css\/style\.css.*$/, "") || "/";
      try {
        const sections = JSON.parse(node.textContent);
        if (!Array.isArray(sections)) return;
        this.tools = sections.flatMap((section) =>
          (section.links || []).map((link) => ({
            title: link.title,
            url: normalizeUrl(link.url, basePath),
            category: section.heading || "Tool"
          }))
        );
      } catch (error) {
        console.error("Unable to load tool search index:", error);
      }
    },
    search() {
      const term = this.query.trim().toLowerCase();
      if (!term) {
        this.matches = [];
        this.open = false;
        return;
      }
      this.matches = this.tools
        .filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(term))
        .slice(0, 8);
      this.open = true;
    },
    clear() {
      this.query = "";
      this.matches = [];
      this.open = false;
    }
  }));

  Alpine.data("imageCompressor", () => ({
    file: null,
    quality: 0.8,
    format: "image/webp",
    busy: false,
    dragover: false,
    status: "No image selected",
    resultUrl: "",
    resultInfo: "",
    downloadName: "compressed-image.webp",
    destroy() {
      this.clearResult();
    },
    selectFile(file) {
      if (!file) return;
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        this.status = "Please choose a PNG, JPEG, or WebP image.";
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        this.status = "The maximum supported file size is 25 MB.";
        return;
      }
      this.clearResult();
      this.file = file;
      this.status = `${file.name} · ${this.formatBytes(file.size)}`;
    },
    reset() {
      this.clearResult();
      this.file = null;
      this.dragover = false;
      this.status = "No image selected";
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },
    async compress() {
      if (!this.file || this.busy) return;
      this.busy = true;
      this.clearResult();
      try {
        const bitmap = await createImageBitmap(this.file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) {
          bitmap.close?.();
          throw new Error("Your browser could not create a canvas.");
        }
        context.drawImage(bitmap, 0, 0);
        bitmap.close?.();

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("Image export failed."))),
            this.format,
            this.format === "image/png" ? undefined : this.quality
          );
        });

        this.resultUrl = URL.createObjectURL(blob);
        const extension = this.format === "image/jpeg" ? "jpg" : this.format === "image/png" ? "png" : "webp";
        const baseName = this.file.name.replace(/\.[^.]+$/, "") || "image";
        this.downloadName = `${baseName}-compressed.${extension}`;

        const change = ((1 - blob.size / this.file.size) * 100);
        const deltaText = change >= 0
          ? `${change.toFixed(1)}% smaller`
          : `${Math.abs(change).toFixed(1)}% larger`;

        this.resultInfo = `Original: ${this.formatBytes(this.file.size)} · Compressed: ${this.formatBytes(blob.size)} · ${deltaText}`;
        this.status = "Compression complete.";
      } catch (error) {
        this.status = error?.message || "Compression failed.";
      } finally {
        this.busy = false;
      }
    },
    clearResult() {
      if (this.resultUrl) {
        URL.revokeObjectURL(this.resultUrl);
      }
      this.resultUrl = "";
      this.resultInfo = "";
    },
    formatBytes(bytes) {
      if (!bytes) return "0 B";
      const units = ["B", "KB", "MB", "GB"];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
    }
  }));
});