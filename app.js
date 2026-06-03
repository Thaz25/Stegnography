/**
 * StegoLab: The Rhino Protocol
 * Application Entry Point
 */

import { UI } from './ui.js';
import { StegoError } from './stego.js';
import { MissionControl } from './missions.js';

class App {
    constructor() {
        this.ui = new UI();
        this.missions = new MissionControl();
        this.init();
    }

    init() {
        console.log("Rhino Protocol Initiated...");
        lucide.createIcons(); // Initialize icons
        this.ui.initListeners();
        this.missions.renderMissions('mission-list');
    }
}

// Global App Instance
window.app = new App();
