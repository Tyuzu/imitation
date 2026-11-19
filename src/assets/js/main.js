document.addEventListener("alpine:init", () => {
  Alpine.data("siteShell", () => ({
    navOpen: false,
    dark: false,
    init() {
      try {
        this.dark = localStorage.getItem("imigi-theme") === "dark";
      } catch (_) {}
      this.applyTheme();
    },
    toggleNav() { this.navOpen = !this.navOpen; },
    toggleTheme() {
      this.dark = !this.dark;
      this.applyTheme();
      try { localStorage.setItem("imigi-theme", this.dark ? "dark" : "light"); } catch (_) {}
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
      if (!node) return;
      try {
        const sections = JSON.parse(node.textContent);
        this.tools = sections.flatMap(section =>
          (section.links || []).map(link => ({
            title: link.title, url: link.url, category: section.heading
          }))
        );
      } catch (error) {
        console.error("Unable to load tool search index:", error);
      }
    },
    search() {
      const term = this.query.trim().toLowerCase();
      this.matches = term
        ? this.tools.filter(item => `${item.title} ${item.category}`.toLowerCase().includes(term)).slice(0, 8)
        : [];
      this.open = term.length > 0;
    },
    clear() { this.query = ""; this.matches = []; this.open = false; }
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
    selectFile(file) {
      if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        this.status = "Please choose a PNG, JPEG or WebP image.";
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        this.status = "The maximum supported file size is 25 MB.";
        return;
      }
      this.clearResult();
      this.file = file;
      this.status = `${file.name} · ${this.formatBytes(file.size)}`;
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
        if (!context) throw new Error("Your browser could not create a canvas.");
        context.drawImage(bitmap, 0, 0);
        bitmap.close?.();

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            result => result ? resolve(result) : reject(new Error("Image export failed.")),
            this.format,
            this.format === "image/png" ? undefined : this.quality
          );
        });
        this.resultUrl = URL.createObjectURL(blob);
        const extension = this.format === "image/jpeg" ? "jpg" :
          this.format === "image/png" ? "png" : "webp";
        this.downloadName = `${this.file.name.replace(/\.[^.]+$/, "")}-compressed.${extension}`;
        const saved = blob.size;
        const change = (1 - saved / this.file.size) * 100;
        this.resultInfo = `Original: ${this.formatBytes(this.file.size)} · Compressed: ${this.formatBytes(saved)} · ${change >= 0 ? `${change.toFixed(1)}% smaller` : `${Math.abs(change).toFixed(1)}% larger`}`;
        this.status = "Compression complete.";
      } catch (error) {
        this.status = error.message || "Compression failed.";
      } finally {
        this.busy = false;
      }
    },
    clearResult() {
      if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
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
