/**
 * StegoLab: The Rhino Protocol
 * Mission Control - Generates synthetic evidence for training
 */

import { Stego } from './stego.js';

export class MissionControl {
    constructor() {
        this.missions = [
            {
                id: 'm001',
                title: 'Operation: First Steps',
                difficulty: 'Easy',
                brief: 'We intercepted a suspicious image from a known poacher network. Intelligence suggests they are using basic LSB encoding. Recover the hidden message.',
                secret: 'FLAG{baby_rhino_safe}',
                imageType: 'noise'
            },
            {
                id: 'm002',
                title: 'Operation: Gray Ghost',
                difficulty: 'Medium',
                brief: 'A corrupted hard drive yielded this artifact. It looks like static, but analysis confirms a high entropy in the red channel. Find the coordinates.',
                secret: 'LOC: 24.124,-12.994 | DATE: 2026-05-12',
                imageType: 'gradient'
            }
        ];
    }

    /**
     * generating a mission image on the fly
     */
    async generateEvidence(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) throw new Error("Mission not found");

        // 1. Create a Base Image (Canvas)
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        // Draw pattern based on type
        if (mission.imageType === 'noise') {
            const idata = ctx.createImageData(300, 300);
            const data = idata.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = Math.floor(Math.random() * 255);
                data[i] = val;     // R
                data[i + 1] = val;   // G
                data[i + 2] = val;   // B
                data[i + 3] = 255;   // A
            }
            ctx.putImageData(idata, 0, 0);
        } else {
            // Gradient
            const grd = ctx.createLinearGradient(0, 0, 300, 300);
            grd.addColorStop(0, "#222");
            grd.addColorStop(1, "#555");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 300, 300);

            // Add some distractors
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("CLASSIFIED", 100, 150);
        }

        // 2. Convert to File object for the Stego Engine
        // We need to wait for blob
        const blob = await new Promise(r => canvas.toBlob(r));
        const file = new File([blob], "evidence.png", { type: 'image/png' });

        // 3. Encode the Secret
        const secretImage = await Stego.encode(file, mission.secret);

        return secretImage; // This is a Data URL
    }

    renderMissions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = ''; // Clear

        this.missions.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'card mission-card';
            card.innerHTML = `
                <div class="mission-header">
                    <h3>${mission.title}</h3>
                    <span class="badge ${mission.difficulty.toLowerCase()}">${mission.difficulty}</span>
                </div>
                <p>${mission.brief}</p>
                <button class="btn btn-primary btn-sm" onclick="app.missions.startMission('${mission.id}')">
                    <i data-lucide="download"></i> Download Evidence
                </button>
            `;
            container.appendChild(card);
        });

        // Refresh icons since we added new DOM
        if (window.lucide) window.lucide.createIcons();
    }

    async startMission(id) {
        try {
            const dataUrl = await this.generateEvidence(id);
            // Trigger download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `evidence_${id}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            alert("Evidence Downloaded! \n\nNow, go to the 'Decode' tab or 'Forensics' tab and upload this file to investigate.");
        } catch (e) {
            console.error(e);
            alert("Failed to generate mission data.");
        }
    }
}
