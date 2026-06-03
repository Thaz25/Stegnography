/**
* StegoLab: The Rhino Protocol
* UI Controller (Simplified - No Encryption)
*/

import { Stego } from './stego.js';

export class UI {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-links li');
        this.views = document.querySelectorAll('.content-view');
        this.mainContent = document.getElementById('main-content');

        // State
        this.currentFile = null;
        this.currentEncodedUrl = null;

        this.router = {
            navigate: (viewName) => this.switchView(viewName)
        };

        // Expose router to global app for inline onclicks
        window.app = window.app || {};
        window.app.router = this.router;
    }

    initListeners() {
        // Navigation Handling
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const view = link.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // --- Encode View Listeners ---
        const encodeInput = document.getElementById('encode-file-input');
        if (encodeInput) {
            encodeInput.addEventListener('change', (e) => this.handleFileSelect(e, 'encode'));
        }

        const btnEncode = document.getElementById('btn-encode-action');
        if (btnEncode) {
            btnEncode.addEventListener('click', () => this.performEncode());
        }

        // --- Decode View Listeners ---
        const decodeInput = document.getElementById('decode-file-input');
        if (decodeInput) {
            decodeInput.addEventListener('change', (e) => this.handleFileSelect(e, 'decode'));
        }

        const btnDecode = document.getElementById('btn-decode-action');
        if (btnDecode) {
            btnDecode.addEventListener('click', () => this.performDecode());
        }

        // --- Forensics View Listeners ---
        const forensicsInput = document.getElementById('forensics-file-input');
        if (forensicsInput) {
            forensicsInput.addEventListener('change', (e) => this.handleFileSelect(e, 'forensics'));
        }

        const bitPlaneSlider = document.getElementById('bit-plane-slider');
        if (bitPlaneSlider) {
            bitPlaneSlider.addEventListener('input', (e) => {
                document.getElementById('bit-plane-val').textContent = e.target.value;
                this.updateAnalysis(e.target.value);
            });
        }
    }

    switchView(viewName) {
        // Update Nav State
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));

        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
        } else {
            console.error(`View ${viewName} not found`);
        }
    }

    handleFileSelect(event, mode) {
        const file = event.target.files[0];
        if (!file) return;

        this.currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (mode === 'encode') {
                const img = document.getElementById('encode-preview');
                img.src = e.target.result;
                document.getElementById('encode-preview-container').classList.remove('hidden');
                document.getElementById('encode-drop-zone').classList.add('hidden');

                // Calculate capacity
                const image = new Image();
                image.src = e.target.result;
                image.onload = () => {
                    const capacity = Math.floor((image.width * image.height) / 8);
                    document.getElementById('encode-capacity').textContent = capacity;
                };

            } else if (mode === 'decode') {
                const img = document.getElementById('decode-preview');
                img.src = e.target.result;
                document.getElementById('decode-preview-container').classList.remove('hidden');
                document.getElementById('decode-drop-zone').querySelector('p').textContent = file.name;
            } else if (mode === 'forensics') {
                this.updateAnalysis(0);
            }
        };
        reader.readAsDataURL(file);
    }

    async performEncode() {
        const message = document.getElementById('encode-message').value;

        if (!this.currentFile || !message) {
            alert("Please select a file and enter a message.");
            return;
        }

        try {
            console.log("Starting encode...");
            const encodedDataUrl = await Stego.encode(this.currentFile, message);
            console.log("Encode successful!");

            // Show result
            document.getElementById('encode-result-card').classList.remove('hidden');
            const downloadBtn = document.getElementById('btn-download-encoded');
            downloadBtn.href = encodedDataUrl;

        } catch (error) {
            console.error("Encoding Failed:", error);
            alert("Encoding Failed: " + error.message);
        }
    }

    async performDecode() {
        if (!this.currentFile) {
            alert("Please select a suspect image.");
            return;
        }

        const output = document.getElementById('decode-output');
        output.innerHTML = '<span class="placeholder">Scanning bit-stream...</span>';

        try {
            const message = await Stego.decode(this.currentFile);
            output.textContent = message;
            output.style.color = 'var(--color-primary)';
            output.style.textShadow = '0 0 5px var(--color-primary)';
        } catch (error) {
            output.textContent = "EXTRACTION FAILED: " + error.message;
            output.style.color = 'var(--color-secondary)';
            output.style.textShadow = 'none';
        }
    }

    async updateAnalysis(bitPlane) {
        if (!this.currentFile) return;

        const dataUrl = await Stego.analyze(this.currentFile, bitPlane);

        const canvas = document.getElementById('forensics-canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
    }
}
