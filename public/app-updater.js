// App Update Manager for Lemonade Kenya
class AppUpdater {
    constructor() {
        this.config = {
            // GitHub releases API for your app
            githubRepo: 'yourusername/lemonade-kenya-app',
            // Direct download link (fallback)
            directDownloadUrl: 'https://lemonadekenya.up.railway.app/download/app-v1.2.0.apk',
            // Version API endpoint
            versionCheckUrl: 'https://lemonadekenya.up.railway.app/api/version',
            // Local storage key for installed version
            storageKey: 'lemonade_app_version'
        };

        this.elements = {
            downloadBtn: document.getElementById('download-btn'),
            currentVersion: document.getElementById('current-version'),
            appSize: document.getElementById('app-size'),
            versionStatus: document.getElementById('version-status'),
            downloadProgress: document.getElementById('download-progress'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text')
        };

        this.currentInstalledVersion = this.getInstalledVersion();
        this.latestVersion = null;
        this.appDownloadUrl = null;
        this.fileSize = null;

        this.init();
    }

    init() {
        this.checkForUpdates();
        this.setupEventListeners();
    }

    getInstalledVersion() {
        return localStorage.getItem(this.config.storageKey) || '1.0.0';
    }

    setInstalledVersion(version) {
        localStorage.setItem(this.config.storageKey, version);
        this.currentInstalledVersion = version;
    }

    async checkForUpdates() {
        try {
            // First try GitHub API
            await this.checkGitHubReleases();
        } catch (error) {
            console.log('GitHub check failed, trying direct method');
            await this.checkDirectVersion();
        }
    }

    async checkGitHubReleases() {
        const response = await fetch(`https://api.github.com/repos/${this.config.githubRepo}/releases/latest`);
        
        if (!response.ok) throw new Error('GitHub API failed');
        
        const data = await response.json();
        this.latestVersion = data.tag_name.replace('v', '');
        this.appDownloadUrl = data.assets[0]?.browser_download_url || this.config.directDownloadUrl;
        
        // Try to get file size
        if (data.assets[0]) {
            this.fileSize = this.formatFileSize(data.assets[0].size);
        }
        
        this.updateUI();
    }

    async checkDirectVersion() {
        try {
            const response = await fetch(this.config.versionCheckUrl);
            const data = await response.json();
            
            this.latestVersion = data.version;
            this.appDownloadUrl = data.downloadUrl || this.config.directDownloadUrl;
            this.fileSize = data.fileSize ? this.formatFileSize(data.fileSize) : '~25 MB';
        } catch (error) {
            // Fallback to hardcoded values
            this.latestVersion = '1.2.0';
            this.appDownloadUrl = this.config.directDownloadUrl;
            this.fileSize = '~25 MB';
        }
        
        this.updateUI();
    }

    updateUI() {
        const isUpdateAvailable = this.compareVersions(this.latestVersion, this.currentInstalledVersion) > 0;
        
        // Update version display
        this.elements.currentVersion.innerHTML = `
            <strong>Installed:</strong> v${this.currentInstalledVersion}<br>
            <strong>Latest:</strong> v${this.latestVersion}
        `;
        
        // Update app size
        if (this.fileSize) {
            this.elements.appSize.textContent = `Size: ${this.fileSize}`;
        }
        
        // Update status message
        if (isUpdateAvailable) {
            this.elements.versionStatus.innerHTML = `
                <span class="status-update-available">
                    <i class="fas fa-arrow-alt-circle-up"></i> Update Available!
                </span>
            `;
            this.elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Update Now';
            this.elements.downloadBtn.classList.add('update-available');
        } else {
            this.elements.versionStatus.innerHTML = `
                <span class="status-up-to-date">
                    <i class="fas fa-check-circle"></i> You have the latest version
                </span>
            `;
            this.elements.downloadBtn.innerHTML = '<i class="fas fa-redo"></i> Reinstall';
        }
        
        // Enable download button
        this.elements.downloadBtn.disabled = false;
    }

    setupEventListeners() {
        this.elements.downloadBtn.addEventListener('click', () => this.downloadApp());
    }

    async downloadApp() {
        try {
            // Show progress bar
            this.elements.downloadProgress.style.display = 'flex';
            this.elements.downloadBtn.disabled = true;
            this.elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            
            // Create blob download with progress tracking
            const response = await fetch(this.appDownloadUrl);
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                
                // Update progress
                const progress = Math.round((loaded / total) * 100);
                this.updateProgress(progress);
            }
            
            // Create blob and download
            const blob = new Blob(chunks);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lemonade-Kenya-v${this.latestVersion}.apk`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Update installed version
            this.setInstalledVersion(this.latestVersion);
            
            // Show success message
            this.showDownloadComplete();
            
        } catch (error) {
            console.error('Download failed:', error);
            this.showDownloadError();
        } finally {
            this.resetDownloadButton();
        }
    }

    updateProgress(percentage) {
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${percentage}%`;
    }

    showDownloadComplete() {
        this.elements.versionStatus.innerHTML = `
            <span class="status-download-complete">
                <i class="fas fa-check-circle"></i> Download Complete! Install the APK
            </span>
        `;
        
        // Show installation instructions
        setTimeout(() => {
            alert('📱 Installation Instructions:\n\n1. Open the downloaded APK file\n2. Allow installation from unknown sources\n3. Follow the installation wizard\n4. Launch the updated app!');
        }, 500);
    }

    showDownloadError() {
        this.elements.versionStatus.innerHTML = `
            <span class="status-error">
                <i class="fas fa-exclamation-circle"></i> Download failed. Try again
            </span>
        `;
    }

    resetDownloadButton() {
        this.elements.downloadProgress.style.display = 'none';
        this.elements.downloadBtn.disabled = false;
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        this.elements.progressFill.style.width = '0%';
        this.elements.progressText.textContent = '0%';
    }

    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.appUpdater = new AppUpdater();
});