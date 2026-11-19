document.addEventListener('alpine:init', () => {
  Alpine.data('siteShell', () => {
    return {
      navOpen: false,
      dark: document.documentElement.getAttribute('data-theme') === 'dark',
      searchQuery: '',
      searchOpen: false,
      matches: [],
      tools: (() => {
        try {
          return JSON.parse(document.getElementById('tool-index-data')?.textContent || '[]');
        } catch (_) {
          return [];
        }
      })(),

      toggleNav() {
        this.navOpen = !this.navOpen;
      },

      toggleTheme() {
        this.dark = !this.dark;
        const theme = this.dark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('imigi-theme', theme);
      },

      searchTools() {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
          this.matches = [];
          this.searchOpen = false;
          return;
        }
        this.matches = this.tools
          .filter((tool) => tool.title.toLowerCase().includes(query) || tool.category.toLowerCase().includes(query))
          .slice(0, 8);
        this.searchOpen = true;
      },

      clearSearch() {
        this.searchQuery = '';
        this.matches = [];
        this.searchOpen = false;
      }
    };
  });

  Alpine.data('imageCompressor', () => {
    return {
    selectedFile: null,
    quality: 0.70,
    status: 'No file selected',
    busy: false,
    dragover: false,

    formatBytes(bytes) {
      return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    },

    selectFile(file) {
      if (!file?.type.startsWith('image/')) {
        this.status = 'Please choose a PNG, JPEG, or WebP image.';
        return;
      }
      this.selectedFile = file;
      this.status = `${file.name} • ${this.formatBytes(file.size)}`;
    },

    async compress() {
      if (!this.selectedFile) {
        this.status = 'Choose an image before compressing.';
        document.getElementById('file-input')?.focus();
        return;
      }

      this.busy = true;
      try {
        const bitmap = await createImageBitmap(this.selectedFile);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        bitmap.close();

        const outputType = this.selectedFile.type === 'image/png' ? 'image/webp' : this.selectedFile.type;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, this.quality));
        if (!blob) throw new Error('Compression failed');

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const baseName = this.selectedFile.name.replace(/\.[^.]+$/, '') || 'compressed-image';
        const extension = outputType === 'image/jpeg' ? 'jpg' : outputType.split('/')[1];
        link.href = url;
        link.download = `${baseName}-compressed.${extension}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        const savings = Math.max(0, Math.round((1 - blob.size / this.selectedFile.size) * 100));
        this.status = `Done • ${this.formatBytes(this.selectedFile.size)} → ${this.formatBytes(blob.size)} (${savings}% smaller)`;
      } catch (_) {
        this.status = 'This image could not be processed in your browser.';
      } finally {
        this.busy = false;
      }
    }
    };
  });
});