(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    App.init();
  });

  const App = {
    init() {
      Header.init();
      WhatsAppDropdown.init();
      SuitTabs.init();
      Lightbox.init();
      KillianEditor.init();
    }
  };

  const Dom = {
    one(selector, root = document) {
      return root.querySelector(selector);
    },

    all(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    }
  };

  const Header = {
    init() {
      const header = Dom.one(".header");
      if (!header) return;

      const update = () => {
        header.classList.toggle("scrolled", window.scrollY > 80);
      };

      update();
      window.addEventListener("scroll", update, { passive: true });
    }
  };

  const WhatsAppDropdown = {
    init() {
      const dropdown = Dom.one(".whatsapp-dropdown");
      const toggle = Dom.one(".whatsapp-toggle");
      const menu = Dom.one(".whatsapp-menu");

      if (!dropdown || !toggle || !menu) return;

      toggle.addEventListener("click", event => {
        event.stopPropagation();
        dropdown.classList.toggle("active");
      });

      menu.addEventListener("click", event => {
        event.stopPropagation();
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("active");
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape") dropdown.classList.remove("active");
      });
    }
  };

  const SuitTabs = {
    init() {
      const tabs = Dom.all(".suit-tab");
      const lines = Dom.all(".suit-line");

      if (!tabs.length || !lines.length) return;

      const showLine = lineName => {
        lines.forEach(line => {
          line.classList.toggle("active", line.dataset.lineaContent === lineName);
        });

        tabs.forEach(tab => {
          tab.classList.toggle("active", tab.dataset.linea === lineName);
        });
      };

      tabs.forEach(tab => {
        tab.addEventListener("click", () => showLine(tab.dataset.linea));
      });

      showLine("linea1");
    }
  };

  const Lightbox = {
    init() {
      const lightbox = Dom.one("#imageLightbox");
      if (!lightbox) return;

      const image = Dom.one("img", lightbox);
      const closeButton = Dom.one(".lightbox-close", lightbox);

      Dom.all(".suit-gallery-compact img").forEach(item => {
        item.addEventListener("click", () => {
          image.src = item.src;
          image.alt = item.alt || "Vista completa";
          lightbox.classList.add("active");
        });
      });

      closeButton?.addEventListener("click", () => {
        lightbox.classList.remove("active");
      });

      lightbox.addEventListener("click", event => {
        if (event.target === lightbox) lightbox.classList.remove("active");
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape") lightbox.classList.remove("active");
      });
    }
  };

  const KillianEditor = {
    dom: {},
    state: {
      currentView: "front",
      selectedPiece: null,
      hoveredPiece: null,
      selectedZone: "base",
      selectedDesignItem: null,
      renderedPieces: [],
      customItems: [],
      pieceColors: {},
      zoneColors: {},
      viewCache: new Map(),
      activePreset: "killian",
      transform: {
        scale: 1,
        x: 0,
        y: 0
      },
      pointer: {
        active: new Map(),
        downX: 0,
        downY: 0,
        startX: 0,
        startY: 0,
        startScale: 1,
        startDistance: 0,
        moved: false
      }
    },

    labels: {
      views: {
        front: "Frontal",
        back: "Trasero",
        perfil: "Perfil"
      },
      zones: {
        base: "Base cuero",
        torso: "Torso",
        arms: "Brazos",
        legs: "Piernas",
        details: "Detalles",
        protection: "Protecciones"
      }
    },

    presets: {
      killian: {
        base: "#111111",
        torso: "#5bd43b",
        arms: "#111111",
        legs: "#5bd43b",
        details: "#f1f1f1",
        protection: "#2b2b2b"
      },
      viper: {
        base: "#090909",
        torso: "#3b3b3b",
        arms: "#111111",
        legs: "#2a2a2a",
        details: "#5bd43b",
        protection: "#e9e9e9"
      },
      racing: {
        base: "#111111",
        torso: "#c1121f",
        arms: "#ffffff",
        legs: "#c1121f",
        details: "#ffffff",
        protection: "#222222"
      }
    },

    init() {
      this.cacheDom();

      if (!this.dom.canvas || !this.dom.stage || !window.KILLIAN_PIECES) {
        return;
      }

      this.prepareCanvas();
      this.bindControls();
      this.bindCanvasGestures();
      this.bindCustomItemShortcuts();

      this.applyPreset("killian", { silent: true });
      this.setActiveZone("base");
      this.renderView("front");
    },

    cacheDom() {
      this.dom = {
        canvas: Dom.one("#editor2dCanvas"),
        stage: Dom.one("#suitStage"),
        textLayer: Dom.one("#editorTextLayer"),
        customLayer: Dom.one("#editorCustomLayer"),

        selectedPieceName: Dom.one("#selectedPieceName"),
        selectedZoneName: Dom.one("#selectedZoneName"),
        currentViewLabel: Dom.one("#editorCurrentViewLabel"),

        pieceColor: Dom.one("#pieceColor"),
        riderName: Dom.one("#riderName"),
        riderNumber: Dom.one("#riderNumber"),

        logoUpload: Dom.one("#logoUpload"),
        addLogoBtn: Dom.one("#addLogoBtn"),
        addTextBtn: Dom.one("#addTextBtn"),
        exportDesignBtn: Dom.one("#exportDesignBtn"),
        applyPieceBtn: Dom.one("#applyPieceBtn"),
        applyZoneBtn: Dom.one("#applyZoneBtn")
      };
    },

    prepareCanvas() {
      this.dom.canvas.style.touchAction = "none";
      this.dom.stage.style.transformOrigin = "50% 50%";

      if (this.dom.textLayer) {
        this.dom.textLayer.style.transformOrigin = "50% 50%";
      }

      if (this.dom.customLayer) {
        this.dom.customLayer.style.transformOrigin = "50% 50%";
      }

      this.updateTransform();
    },

    bindControls() {
      Dom.all(".view-btn").forEach(button => {
        button.addEventListener("click", () => {
          const view = button.dataset.view || "front";

          Dom.all(".view-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");

          this.renderView(view);
        });
      });

      Dom.all(".editor-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          Dom.all(".editor-tab").forEach(item => item.classList.remove("active"));
          Dom.all(".editor-panel-section").forEach(panel => panel.classList.remove("active"));

          tab.classList.add("active");
          Dom.one(`[data-panel-content="${tab.dataset.panel}"]`)?.classList.add("active");
        });
      });

      Dom.all(".zone-btn").forEach(button => {
        button.addEventListener("click", () => {
          this.setActiveZone(button.dataset.zone || "base");
          this.syncColorInput();
        });
      });

      Dom.all(".preset-card").forEach(button => {
        button.addEventListener("click", () => {
          Dom.all(".preset-card").forEach(item => item.classList.remove("active"));
          button.classList.add("active");

          this.applyPreset(button.dataset.preset || "killian");
        });
      });

      this.dom.pieceColor?.addEventListener("input", () => {
        const color = this.dom.pieceColor.value;

        if (this.state.selectedPiece) {
          this.applyColorToPiece(this.state.selectedPiece, color);
          return;
        }

        this.applyColorToZone(this.state.selectedZone, color);
      });

      this.dom.applyPieceBtn?.addEventListener("click", () => {
        if (!this.state.selectedPiece || !this.dom.pieceColor) return;
        this.applyColorToPiece(this.state.selectedPiece, this.dom.pieceColor.value);
      });

      this.dom.applyZoneBtn?.addEventListener("click", () => {
        if (!this.dom.pieceColor) return;
        this.applyColorToZone(this.state.selectedZone, this.dom.pieceColor.value);
      });

      this.dom.riderName?.addEventListener("input", () => this.renderTextOverlays());
      this.dom.riderNumber?.addEventListener("input", () => this.renderTextOverlays());

      this.dom.addTextBtn?.addEventListener("click", () => this.addCustomText());
      this.dom.addLogoBtn?.addEventListener("click", () => this.dom.logoUpload?.click());

      this.dom.logoUpload?.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
          this.addCustomLogo(reader.result);
        };

        reader.readAsDataURL(file);
        event.target.value = "";
      });

      this.dom.exportDesignBtn?.addEventListener("click", () => this.exportDesign());

      window.addEventListener("resize", () => {
        this.refreshCurrentMasks();
      });
    },

    bindCanvasGestures() {
      const canvas = this.dom.canvas;

      canvas.addEventListener("pointerdown", event => {
        if (event.target.closest(".design-item")) return;

        canvas.setPointerCapture?.(event.pointerId);

        this.state.pointer.active.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });

        this.state.pointer.downX = event.clientX;
        this.state.pointer.downY = event.clientY;
        this.state.pointer.startX = this.state.transform.x;
        this.state.pointer.startY = this.state.transform.y;
        this.state.pointer.startScale = this.state.transform.scale;
        this.state.pointer.moved = false;

        if (this.state.pointer.active.size === 2) {
          this.state.pointer.startDistance = this.getPointerDistance();
        }
      });

      canvas.addEventListener("pointermove", event => {
        if (!this.state.pointer.active.has(event.pointerId)) {
          this.handleHover(event);
          return;
        }

        this.state.pointer.active.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });

        if (this.state.pointer.active.size === 2) {
          this.handlePinch();
          return;
        }

        if (this.state.transform.scale <= 1) return;

        const dx = event.clientX - this.state.pointer.downX;
        const dy = event.clientY - this.state.pointer.downY;

        if (Math.abs(dx) + Math.abs(dy) > 4) {
          this.state.pointer.moved = true;
        }

        this.state.transform.x = this.state.pointer.startX + dx;
        this.state.transform.y = this.state.pointer.startY + dy;

        this.limitTransform();
        this.updateTransform();
      });

      canvas.addEventListener("pointerup", event => {
        const wasTap = !this.state.pointer.moved && this.state.pointer.active.size <= 1;

        this.state.pointer.active.delete(event.pointerId);

        if (wasTap) {
          this.selectPiece(this.hitTest(event));
        }
      });

      canvas.addEventListener("pointercancel", event => {
        this.state.pointer.active.delete(event.pointerId);
      });

      canvas.addEventListener("pointerleave", () => {
        this.clearHover();
      });

      canvas.addEventListener("wheel", event => {
        if (!event.ctrlKey && Math.abs(event.deltaY) < 8) return;

        event.preventDefault();

        const direction = event.deltaY > 0 ? -1 : 1;
        const nextScale = this.clamp(this.state.transform.scale + direction * 0.15, 1, 3.2);

        this.state.transform.scale = nextScale;

        if (nextScale === 1) {
          this.state.transform.x = 0;
          this.state.transform.y = 0;
        }

        this.limitTransform();
        this.updateTransform();
      }, { passive: false });

      canvas.addEventListener("dblclick", () => {
        this.resetTransform();
      });
    },

    bindCustomItemShortcuts() {
      document.addEventListener("keydown", event => {
        const keyDeletes = event.key === "Delete" || event.key === "Backspace";
        const writing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);

        if (!keyDeletes || writing || !this.state.selectedDesignItem) return;

        this.removeDesignItem(this.state.selectedDesignItem);
      });
    },

    renderView(view) {
      if (!window.KILLIAN_PIECES?.[view]) {
        console.warn(`Vista no encontrada en KILLIAN_PIECES: ${view}`);
        return;
      }

      this.state.currentView = view;
      this.state.selectedPiece = null;
      this.state.hoveredPiece = null;

      this.dom.canvas.dataset.view = view;

      if (this.dom.currentViewLabel) {
        this.dom.currentViewLabel.textContent = this.labels.views[view] || view;
      }

      if (this.dom.selectedPieceName) {
        this.dom.selectedPieceName.textContent = "Ninguna";
      }

      this.dom.stage.innerHTML = "";

      const cached = this.state.viewCache.get(view);

      if (cached) {
        this.state.renderedPieces = cached.pieces;
        cached.pieces.forEach(item => this.dom.stage.appendChild(item.el));
        this.refreshAllFilters();
        this.renderTextOverlays();
        this.updateTransform();
        return;
      }

      const pieces = window.KILLIAN_PIECES[view];
      const rendered = pieces.map((piece, index) => this.createPieceElement(piece, index));

      this.state.renderedPieces = rendered;
      this.state.viewCache.set(view, { pieces: rendered });

      rendered.forEach(item => {
        this.dom.stage.appendChild(item.el);
        this.loadImageWithFallback(item.el, this.getImageCandidates(view, item));
      });

      this.renderTextOverlays();
      this.updateTransform();
    },

    createPieceElement(piece, index) {
      const id = piece.id || `${piece.view || this.state.currentView}_${index}`;
      const zone = this.getZone(piece);
      const color = this.getInitialPieceColor(id, zone);
      const image = document.createElement("img");

      image.alt = piece.name || id;
      image.className = `suit-piece ${piece.editable === false ? "support-piece" : "editable-piece"}`;
      image.dataset.id = id;
      image.dataset.zone = zone;
      image.draggable = false;
      image.loading = "eager";
      image.decoding = "async";
      image.style.zIndex = String(index + 1);

      const item = {
        ...piece,
        id,
        zone,
        color,
        el: image,
        mask: null,
        maskReady: false
      };

      if (item.editable !== false) {
        image.style.filter = this.getSelectionFilter(item);
      }

      image.addEventListener("load", () => {
        if (item.editable === false) return;
        this.buildAlphaMask(item);
      });

      image.addEventListener("error", () => {
        image.dataset.missing = "true";
      });

      return item;
    },

    getInitialPieceColor(id, zone) {
      if (this.state.pieceColors[id]) {
        return this.state.pieceColors[id];
      }

      return this.state.zoneColors[zone] || this.presets.killian[zone] || this.presets.killian.base;
    },

    getImageCandidates(view, piece) {
      const names = [
        piece.file,
        piece.src,
        piece.name ? `${piece.name}.png` : null,
        piece.name ? `${piece.name}.webp` : null
      ].filter(Boolean);

      const uniqueNames = [...new Set(names)];
      const paths = [];

      uniqueNames.forEach(name => {
        paths.push(
          `images/${view}/${name}`,
          `images/${name}`,
          `images/piezas/${view}/${name}`,
          `images/piezas/${name}`
        );
      });

      return [...new Set(paths)];
    },

    loadImageWithFallback(image, paths, index = 0) {
      if (index >= paths.length) {
        image.dataset.missing = "true";
        console.warn("No se encontró imagen:", image.alt, paths);
        return;
      }

      image.onerror = () => {
        this.loadImageWithFallback(image, paths, index + 1);
      };

      image.onload = image.onload;
      image.src = paths[index];
    },

    buildAlphaMask(item) {
      const image = item.el;
      const imageWidth = image.naturalWidth || 1;
      const imageHeight = image.naturalHeight || 1;
      const maxSide = this.isTouchDevice() ? 720 : 1100;
      const scale = Math.min(1, maxSide / Math.max(imageWidth, imageHeight));

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imageWidth * scale));
      canvas.height = Math.max(1, Math.round(imageHeight * scale));

      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const alpha = new Uint8Array(canvas.width * canvas.height);

      for (let i = 0, j = 3; i < alpha.length; i += 1, j += 4) {
        alpha[i] = data[j];
      }

      item.mask = {
        width: canvas.width,
        height: canvas.height,
        imageWidth,
        imageHeight,
        alpha
      };

      item.maskReady = true;
    },

    refreshCurrentMasks() {
      this.state.renderedPieces.forEach(item => {
        if (item.editable === false || !item.el.complete) return;
        this.buildAlphaMask(item);
      });
    },

    hitTest(event) {
      const point = this.getCanvasPoint(event);

      for (let i = this.state.renderedPieces.length - 1; i >= 0; i -= 1) {
        const item = this.state.renderedPieces[i];

        if (item.editable === false || !item.maskReady || !item.el.complete) continue;

        const imagePoint = this.pointOnImage(point, item.el);
        if (!imagePoint) continue;

        const maskX = Math.floor(imagePoint.x / item.mask.imageWidth * item.mask.width);
        const maskY = Math.floor(imagePoint.y / item.mask.imageHeight * item.mask.height);
        const safeX = this.clamp(maskX, 0, item.mask.width - 1);
        const safeY = this.clamp(maskY, 0, item.mask.height - 1);
        const alpha = item.mask.alpha[safeY * item.mask.width + safeX];

        if (alpha > 12) {
          return item;
        }
      }

      return null;
    },

    getCanvasPoint(event) {
      const rect = this.dom.canvas.getBoundingClientRect();
      const rawX = event.clientX - rect.left;
      const rawY = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scale = this.state.transform.scale;

      return {
        x: (rawX - centerX - this.state.transform.x) / scale + centerX,
        y: (rawY - centerY - this.state.transform.y) / scale + centerY
      };
    },

    pointOnImage(point, image) {
      const canvasRect = this.dom.canvas.getBoundingClientRect();
      const imageWidth = image.naturalWidth || 1;
      const imageHeight = image.naturalHeight || 1;
      const scale = Math.min(canvasRect.width / imageWidth, canvasRect.height / imageHeight);
      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;
      const offsetX = (canvasRect.width - drawWidth) / 2;
      const offsetY = (canvasRect.height - drawHeight) / 2;
      const x = point.x - offsetX;
      const y = point.y - offsetY;

      if (x < 0 || y < 0 || x > drawWidth || y > drawHeight) {
        return null;
      }

      return {
        x: this.clamp(Math.floor(x / drawWidth * imageWidth), 0, imageWidth - 1),
        y: this.clamp(Math.floor(y / drawHeight * imageHeight), 0, imageHeight - 1)
      };
    },

    handleHover(event) {
      if (this.isTouchDevice()) return;

      const item = this.hitTest(event);

      if (item === this.state.hoveredPiece) return;

      this.clearHover();
      this.state.hoveredPiece = item;

      this.dom.canvas.classList.toggle("can-select", Boolean(item));

      if (!item) return;

      item.el.classList.add("hovered");
      this.refreshPieceFilter(item);
    },

    clearHover() {
      this.state.renderedPieces.forEach(item => {
        item.el.classList.remove("hovered");
        this.refreshPieceFilter(item);
      });

      this.state.hoveredPiece = null;
      this.dom.canvas.classList.remove("can-select");
    },

    selectPiece(item) {
      this.state.renderedPieces.forEach(piece => {
        piece.el.classList.remove("active");
        this.refreshPieceFilter(piece);
      });

      this.state.selectedPiece = item;

      if (!item) {
        if (this.dom.selectedPieceName) {
          this.dom.selectedPieceName.textContent = "Ninguna";
        }

        this.syncColorInput();
        return;
      }

      item.el.classList.add("active");
      this.refreshPieceFilter(item);

      if (this.dom.selectedPieceName) {
        this.dom.selectedPieceName.textContent = this.cleanName(item.name || item.id);
      }

      this.setActiveZone(item.zone);
      this.syncColorInput();
    },

    setActiveZone(zone) {
      this.state.selectedZone = zone || "base";

      Dom.all(".zone-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.zone === this.state.selectedZone);
      });

      if (this.dom.selectedZoneName) {
        this.dom.selectedZoneName.textContent = this.labels.zones[this.state.selectedZone] || this.state.selectedZone;
      }
    },

    applyPreset(name, options = {}) {
      const presetName = this.presets[name] ? name : "killian";
      const preset = this.presets[presetName];

      this.state.activePreset = presetName;
      this.state.zoneColors = { ...preset };

      this.state.renderedPieces.forEach(item => {
        if (item.editable === false) return;
        this.applyColorToPiece(item, preset[item.zone] || preset.base, { fromPreset: true });
      });

      if (!options.silent) {
        this.syncColorInput();
      }
    },

    applyColorToZone(zone, color) {
      if (!zone || !color) return;

      this.state.zoneColors[zone] = color;

      this.state.renderedPieces.forEach(item => {
        if (item.zone !== zone || item.editable === false) return;
        this.applyColorToPiece(item, color, { fromZone: true });
      });

      this.syncColorInput();
    },

    applyColorToPiece(item, color, options = {}) {
      if (!item || item.editable === false || !color) return;

      item.color = color;

      if (!options.fromPreset && !options.fromZone) {
        this.state.pieceColors[item.id] = color;
      }

      this.refreshPieceFilter(item);
    },

    refreshAllFilters() {
      this.state.renderedPieces.forEach(item => this.refreshPieceFilter(item));
    },

    refreshPieceFilter(item) {
      if (!item || item.editable === false || !item.el) return;
      item.el.style.filter = this.getSelectionFilter(item);
    },

    syncColorInput() {
      if (!this.dom.pieceColor) return;

      const selectedPiece = this.state.selectedPiece;

      if (selectedPiece) {
        this.dom.pieceColor.value = selectedPiece.color || "#ffffff";
        return;
      }

      this.dom.pieceColor.value = this.state.zoneColors[this.state.selectedZone] || "#ffffff";
    },

    getSelectionFilter(item) {
      let filter = this.getColorFilter(item?.color || "#ffffff");

      if (item?.el?.classList.contains("hovered")) {
        filter += " drop-shadow(0 0 10px rgba(255,255,255,.75)) drop-shadow(0 0 14px rgba(91,212,59,.55))";
      }

      if (item?.el?.classList.contains("active")) {
        filter += " drop-shadow(0 0 18px rgba(255,255,255,.95)) drop-shadow(0 0 22px rgba(91,212,59,.9))";
      }

      return filter;
    },

    getColorFilter(color) {
      const normalized = String(color || "").toLowerCase();

      if (!normalized || normalized === "#ffffff") {
        return "brightness(1.08) contrast(1.05)";
      }

      if (["#111111", "#000000", "#090909"].includes(normalized)) {
        return "brightness(.18) contrast(1.5) saturate(.75)";
      }

      return `sepia(1) saturate(6.5) hue-rotate(${this.hexToHue(color)}deg) brightness(.9) contrast(1.08)`;
    },

    hexToHue(hex) {
      const value = String(hex || "").replace("#", "");

      if (value.length !== 6) return 0;

      const red = parseInt(value.slice(0, 2), 16) / 255;
      const green = parseInt(value.slice(2, 4), 16) / 255;
      const blue = parseInt(value.slice(4, 6), 16) / 255;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const delta = max - min;

      let hue = 0;

      if (delta === 0) hue = 0;
      else if (max === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (max === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);

      return Math.round(hue < 0 ? hue + 360 : hue);
    },

    getZone(piece) {
      const name = String(piece.name || piece.id || "").toLowerCase();

      if (/rodilla|numero|cierre|cuello|trapecio/.test(name)) return "details";
      if (/pantorrilla|pierna|espinilla/.test(name)) return "legs";
      if (/brazo|antebrazo|hombro/.test(name)) return "arms";
      if (/pecho|espalda|tronco|cintura|lateral|back/.test(name)) return "torso";
      if (/prote|slider|tank/.test(name)) return "protection";

      return "base";
    },

    renderTextOverlays() {
      if (!this.dom.textLayer) return;

      this.dom.textLayer.innerHTML = "";

      const name = (this.dom.riderName?.value || "").trim().toUpperCase();
      const number = (this.dom.riderNumber?.value || "").trim();

      if (name) {
        const element = document.createElement("div");
        element.className = "editor-name-text";
        element.textContent = name;
        this.dom.textLayer.appendChild(element);
      }

      if (number && ["back", "perfil"].includes(this.state.currentView)) {
        const element = document.createElement("div");
        element.className = "editor-number-text";
        element.textContent = number;
        this.dom.textLayer.appendChild(element);
      }

      this.updateTransform();
    },

    addCustomText(defaultText = "KILLIAN") {
      if (!this.dom.customLayer) return;

      const text = window.prompt("Texto a agregar:", defaultText) || defaultText;
      const element = document.createElement("div");

      element.className = "design-item design-text";
      element.textContent = text;
      element.style.left = "42%";
      element.style.top = "48%";
      element.style.width = "18%";
      element.style.height = "8%";

      this.dom.customLayer.appendChild(element);

      this.state.customItems.push({
        type: "text",
        el: element
      });

      this.makeDraggable(element);
      this.selectDesignItem(element);
    },

    addCustomLogo(src) {
      if (!this.dom.customLayer || !src) return;

      const element = document.createElement("div");
      const image = document.createElement("img");

      element.className = "design-item design-logo";
      element.style.left = "42%";
      element.style.top = "38%";
      element.style.width = "18%";
      element.style.height = "16%";

      image.src = src;
      image.alt = "Logo personalizado";

      element.appendChild(image);
      this.dom.customLayer.appendChild(element);

      this.state.customItems.push({
        type: "logo",
        el: element
      });

      this.makeDraggable(element);
      this.selectDesignItem(element);
    },

    makeDraggable(element) {
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;
      let dragging = false;

      const move = event => {
        if (!dragging) return;

        event.preventDefault();

        const pointer = event.touches ? event.touches[0] : event;
        const rect = this.dom.canvas.getBoundingClientRect();
        const scale = this.state.transform.scale;
        const deltaX = (pointer.clientX - startX) / scale;
        const deltaY = (pointer.clientY - startY) / scale;

        const left = startLeft + deltaX / rect.width * 100;
        const top = startTop + deltaY / rect.height * 100;

        element.style.left = `${this.clamp(left, 0, 92)}%`;
        element.style.top = `${this.clamp(top, 0, 92)}%`;
      };

      const end = () => {
        dragging = false;

        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", end);
        document.removeEventListener("touchmove", move);
        document.removeEventListener("touchend", end);
      };

      const start = event => {
        this.selectDesignItem(element);
        dragging = true;

        const pointer = event.touches ? event.touches[0] : event;

        startX = pointer.clientX;
        startY = pointer.clientY;
        startLeft = parseFloat(element.style.left) || 50;
        startTop = parseFloat(element.style.top) || 50;

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", end);
        document.addEventListener("touchmove", move, { passive: false });
        document.addEventListener("touchend", end);
      };

      element.addEventListener("mousedown", start);
      element.addEventListener("touchstart", start, { passive: false });
    },

    selectDesignItem(element) {
      this.state.customItems.forEach(item => {
        item.el.classList.remove("selected");
      });

      this.state.selectedDesignItem = element || null;

      if (element) {
        element.classList.add("selected");
      }
    },

    removeDesignItem(element) {
      this.state.customItems = this.state.customItems.filter(item => item.el !== element);
      element.remove();
      this.state.selectedDesignItem = null;
    },

    async exportDesign() {
      if (!window.html2canvas) {
        alert("No cargó html2canvas. Revisa el CDN.");
        return;
      }

      const button = this.dom.exportDesignBtn;

      if (button) {
        button.disabled = true;
        button.textContent = "Exportando...";
      }

      const previousTransform = { ...this.state.transform };

      try {
        this.resetTransform({ silent: true });

        const canvas = await html2canvas(this.dom.canvas, {
          backgroundColor: null,
          useCORS: true,
          scale: this.isTouchDevice() ? 1.6 : 2.5
        });

        const link = document.createElement("a");
        link.download = `killian-diseno-${this.state.currentView}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error(error);
        alert("No pude exportar el PNG. Revisa que las imágenes estén en el mismo dominio.");
      } finally {
        this.state.transform = previousTransform;
        this.updateTransform();

        if (button) {
          button.disabled = false;
          button.textContent = "Exportar PNG";
        }
      }
    },

    getPointerDistance() {
      const pointers = Array.from(this.state.pointer.active.values());

      if (pointers.length < 2) return 0;

      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;

      return Math.hypot(dx, dy);
    },

    handlePinch() {
      const distance = this.getPointerDistance();

      if (!this.state.pointer.startDistance) {
        this.state.pointer.startDistance = distance;
        return;
      }

      const nextScale = this.state.pointer.startScale * (distance / this.state.pointer.startDistance);

      this.state.transform.scale = this.clamp(nextScale, 1, 3.2);

      if (this.state.transform.scale === 1) {
        this.state.transform.x = 0;
        this.state.transform.y = 0;
      }

      this.state.pointer.moved = true;
      this.limitTransform();
      this.updateTransform();
    },

    updateTransform() {
      const { scale, x, y } = this.state.transform;
      const transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

      this.dom.stage.style.transform = transform;

      if (this.dom.textLayer) {
        this.dom.textLayer.style.transform = transform;
      }

      if (this.dom.customLayer) {
        this.dom.customLayer.style.transform = transform;
      }

      this.dom.canvas.classList.toggle("is-zoomed", scale > 1);
    },

    resetTransform(options = {}) {
      this.state.transform.scale = 1;
      this.state.transform.x = 0;
      this.state.transform.y = 0;

      if (!options.silent) {
        this.updateTransform();
      }
    },

    limitTransform() {
      const rect = this.dom.canvas.getBoundingClientRect();
      const maxX = rect.width * (this.state.transform.scale - 1) * 0.45;
      const maxY = rect.height * (this.state.transform.scale - 1) * 0.45;

      this.state.transform.x = this.clamp(this.state.transform.x, -maxX, maxX);
      this.state.transform.y = this.clamp(this.state.transform.y, -maxY, maxY);
    },

    cleanName(name) {
      return String(name || "Pieza")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
    },

    isTouchDevice() {
      return window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    },

    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
  };
})();
