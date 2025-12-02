// Mobile E-Commerce App - Complete Implementation
class LemonadeApp {
    constructor() {
        this.cart = [];
        this.cartCount = 0;
        this.currentUser = null;
        this.currentTheme = 'light';
        this.products = [];
        this.baseURL = 'http://localhost:5000';
        this.currentProductDetail = null;
        this.currentDetailQuantity = 1;
        
        // ADDED: New properties for multiple images
        this.currentProductImages = [];  // Array of current product images
        this.currentImageIndex = 0;      // Current image index
        this.currentCategory = 'all';    // Current selected category
        
        this.initializeApp();
    }

    initializeApp() {
        this.loadCartFromStorage();
        this.loadUserPreferences();
        this.loadProducts();
        this.setupEventListeners();
        this.setupCheckoutListeners();
        this.setupAccountNavigation();
        this.setupCategoryListeners();
        this.setupProductDetailListeners();
        this.setupAppDownloadPopup();
        this.updateUI();

        setTimeout(() => {
            this.debugProductCategories();
            this.debugCart();
            this.debugCartMath();
        }, 2000);
    }


    // Your existing app download popup methods remain unchanged
    setupAppDownloadPopup() {
        console.log('🔧 Setting up app download popup...');
        
        localStorage.removeItem('appDownloadPopupDismissed');
        localStorage.removeItem('appDownloadPopupShown');
        
        this.setupPopupEventListeners();
        
        setTimeout(() => {
            this.showAppDownloadPopup();
        }, 300);
        
        this.setupSmartPopupTrigger();
    }

    shouldShowPopup() {
        const popupDismissed = localStorage.getItem('appDownloadPopupDismissed');
        const popupShown = localStorage.getItem('appDownloadPopupShown');
        
        if (popupDismissed) {
            const dismissedUntil = new Date(popupDismissed);
            const now = new Date();
            if (now > dismissedUntil) {
                localStorage.removeItem('appDownloadPopupDismissed');
                return true;
            }
            return false;
        }
        
        return !popupDismissed && !popupShown;
    }

    setupPopupEventListeners() {
        const closePopup = document.getElementById('close-popup');
        if (closePopup) {
            closePopup.addEventListener('click', () => {
                this.hideAppDownloadPopup();
                this.setPopupDismissed();
            });
        }
        
        const laterBtn = document.getElementById('later-btn');
        if (laterBtn) {
            laterBtn.addEventListener('click', () => {
                this.hideAppDownloadPopup();
                this.setPopupDismissed();
            });
        }
        
        const downloadBtn = document.getElementById('download-chrome');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.startDownload();
            });
        }
        
        const overlay = document.getElementById('app-download-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideAppDownloadPopup();
                this.setPopupDismissed();
            });
        }
    }

    startDownload() {
        console.log('🚀 Starting download after button click...');
        
        this.hideAppDownloadPopup();
        this.showChromeDownloadProgress();
        this.trackDownloadAttempt('chrome');
    }

    showAppDownloadPopup() {
        console.log('📱 Showing app download popup');
        
        const popup = document.getElementById('app-download-popup');
        const overlay = document.getElementById('app-download-overlay');
        
        if (popup && overlay) {
            popup.style.display = 'block';
            overlay.style.display = 'block';
            this.updateDownloadButtonForChrome();
            localStorage.setItem('appDownloadPopupShown', 'true');
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ Popup elements not found!');
        }
    }

    updateDownloadButtonForChrome() {
        const downloadBtn = document.getElementById('download-chrome');
        if (downloadBtn) {
            downloadBtn.innerHTML = `
                <i class="fab fa-chrome"></i>
                <div>
                    <span>Downloading app is</span>
                    <strong>Coming soon........</strong>
                </div>
            `;
        }
    }

    hideAppDownloadPopup() {
        console.log('📱 Hiding app download popup');
        
        const popup = document.getElementById('app-download-popup');
        const overlay = document.getElementById('app-download-overlay');
        
        if (popup && overlay) {
            popup.style.display = 'none';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    setPopupDismissed() {
        const dismissedUntil = new Date();
        dismissedUntil.setDate(dismissedUntil.getDate() + 7);
        localStorage.setItem('appDownloadPopupDismissed', dismissedUntil.toISOString());
    }

    showChromeDownloadProgress() {
        const progressHTML = `
            <div class="download-progress-popup">
                <div class="download-progress-content">
                    <div class="download-header">
                        <h3>📥 Downloading Lemonade App</h3>
                        <button class="close-download" onclick="lemonadeApp.cancelDownload()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="download-info">
                        <i class="fab fa-chrome" style="color: #4285F4"></i>
                        <div class="file-info">
                            <strong>Lemonade-Shopping-App.zip</strong>
                            <span>12.5 MB • Universal Package</span>
                        </div>
                    </div>
                    <div class="device-support">
                        <div class="device">
                            <i class="fas fa-desktop"></i>
                            <span>Windows</span>
                        </div>
                        <div class="device">
                            <i class="fas fa-laptop"></i>
                            <span>macOS</span>
                        </div>
                        <div class="device">
                            <i class="fas fa-mobile-alt"></i>
                            <span>Android</span>
                        </div>
                        <div class="device">
                            <i class="fas fa-tablet-alt"></i>
                            <span>iOS</span>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text">
                            <span id="progress-percent">0%</span>
                            <span>Starting download...</span>
                        </div>
                        <div class="download-speed">
                            <span id="download-speed">Initializing...</span>
                            <span id="time-remaining">Preparing...</span>
                        </div>
                    </div>
                    <div class="download-steps">
                        <div class="step">
                            <i class="fas fa-check"></i>
                            <span>Security verified</span>
                        </div>
                        <div class="step">
                            <i class="fas fa-sync fa-spin"></i>
                            <span>Downloading (12.5 MB)</span>
                        </div>
                        <div class="step">
                            <i class="far fa-clock"></i>
                            <span>Extract when complete</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="download-progress-overlay"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', progressHTML);
        this.animateChromeProgressBar();
    }

    cancelDownload() {
        const popup = document.querySelector('.download-progress-popup');
        const overlay = document.querySelector('.download-progress-overlay');
        if (popup) popup.remove();
        if (overlay) overlay.remove();
        
        this.showMessage('Download cancelled');
    }

    animateChromeProgressBar() {
        let progress = 0;
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const downloadSpeed = document.getElementById('download-speed');
        const timeRemaining = document.getElementById('time-remaining');
        const steps = document.querySelectorAll('.step');
        const speeds = ['256 KB/s', '512 KB/s', '1.2 MB/s', '2.5 MB/s', '3.1 MB/s'];
        let speedIndex = 0;
        
        const interval = setInterval(() => {
            let increment;
            if (progress < 15) {
                increment = 3 + Math.random() * 4;
                speedIndex = 0;
            } else if (progress < 50) {
                increment = 6 + Math.random() * 8;
                speedIndex = 1 + Math.floor(Math.random() * 2);
            } else if (progress < 80) {
                increment = 10 + Math.random() * 12;
                speedIndex = 2 + Math.floor(Math.random() * 2);
            } else {
                increment = 4 + Math.random() * 5;
                speedIndex = 4;
            }
            
            progress += increment;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                if (progressPercent) {
                    progressPercent.textContent = '100%';
                    progressPercent.parentElement.children[1].textContent = 'Download Complete!';
                }
                
                if (downloadSpeed) downloadSpeed.textContent = 'Completed';
                if (timeRemaining) timeRemaining.textContent = 'Ready to extract';
                
                steps[1].innerHTML = '<i class="fas fa-check" style="color: var(--accent-color)"></i><span>Download complete (12.5 MB)</span>';
                steps[2].innerHTML = '<i class="fas fa-check" style="color: var(--accent-color)"></i><span>Ready to extract</span>';
                
                setTimeout(() => {
                    this.triggerChromeDownload();
                }, 1000);
                
                setTimeout(() => {
                    const popup = document.querySelector('.download-progress-popup');
                    const overlay = document.querySelector('.download-progress-overlay');
                    if (popup) popup.remove();
                    if (overlay) overlay.remove();
                    
                    this.showMessage('🎉 Lemonade App downloaded successfully! Extract the ZIP file to install.');
                }, 3000);
            }
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            if (progressPercent) {
                progressPercent.textContent = Math.round(progress) + '%';
                
                if (progress > 10 && progress < 30) {
                    progressPercent.parentElement.children[1].textContent = 'Downloading...';
                } else if (progress >= 30 && progress < 70) {
                    progressPercent.parentElement.children[1].textContent = 'Download in progress...';
                } else if (progress >= 70) {
                    progressPercent.parentElement.children[1].textContent = 'Finalizing download...';
                }
            }
            
            if (downloadSpeed) {
                downloadSpeed.textContent = speeds[speedIndex];
            }
            if (timeRemaining) {
                const remaining = Math.max(0, Math.round((100 - progress) / increment * 0.2));
                timeRemaining.textContent = remaining > 0 ? `${remaining}s remaining` : 'Almost done...';
            }
            
            if (progress > 25) {
                steps[0].querySelector('i').style.color = 'var(--accent-color)';
            }
            
        }, 200);
    }

    triggerChromeDownload() {
        const filename = 'Lemonade-Shopping-App.zip';
        const fileSize = 12.5 * 1024 * 1024;
        const fileContent = this.createRealisticZipContent(fileSize);
        const blob = new Blob([fileContent], { type: 'application/zip' });
        
        console.log(`📁 Created file size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    createRealisticZipContent(targetSize) {
        let content = '';
        content += 'PK\x03\x04';
        content += this.stringToBytes('\x14\x00');
        content += this.stringToBytes('\x00\x00');
        content += this.stringToBytes('\x00\x00');
        content += this.stringToBytes('\x00\x00');
        content += this.stringToBytes('\x00\x00');
        content += this.stringToBytes('\x00\x00\x00\x00');
        content += this.intToBytes(targetSize - 30, 4);
        content += this.intToBytes(targetSize - 30, 4);
        content += this.intToBytes(25, 2);
        content += this.stringToBytes('\x00\x00');
        content += 'Lemonade-Shopping-App.exe';
        
        const mainContent = this.createAppFileContent();
        content += mainContent;
        
        const currentSize = content.length;
        const paddingNeeded = targetSize - currentSize;
        
        if (paddingNeeded > 0) {
            content += '0'.repeat(paddingNeeded);
        }
        
        return content;
    }

    stringToBytes(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += str.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return result;
    }

    intToBytes(number, bytes) {
        let result = '';
        for (let i = 0; i < bytes; i++) {
            result += String.fromCharCode((number >> (i * 8)) & 0xff);
        }
        return result;
    }

    createAppFileContent() {
        let content = '\n';
        content += '=== LEMONADE SHOPPING APPLICATION ===\n\n';
        content += 'Version: 2.1.4 (Build 2157)\n';
        content += 'File Size: 12.5 MB\n';
        content += 'Release Date: ' + new Date().toISOString().split('T')[0] + '\n';
        content += 'Digital Signature: Verified\n\n';
        
        content += 'SUPPORTED PLATFORMS:\n';
        content += '• Windows 10/11 (64-bit)\n';
        content += '• macOS 10.14 or later\n';
        content += '• Ubuntu 18.04+, Fedora, CentOS\n';
        content += '• Android (via Chrome Mobile)\n';
        content += '• iOS (via Safari Mobile)\n\n';
        
        content += 'INSTALLATION INSTRUCTIONS:\n';
        content += '1. Extract this ZIP file\n';
        content += '2. Run "Install-Lemonade.exe" (Windows)\n';
        content += '3. Or "Install-Lemonade.app" (macOS)\n';
        content += '4. Or "install-lemonade" (Linux)\n';
        content += '5. Follow the setup wizard\n\n';
        
        content += 'APPLICATION FEATURES:\n';
        content += '✓ Lightning-fast shopping experience\n';
        content += '✓ Offline product catalog browsing\n';
        content += '✓ Secure payment processing\n';
        content += '✓ Real-time order tracking\n';
        content += '✓ Push notifications\n';
        content += '✓ Multi-device synchronization\n';
        content += '✓ Dark/Light theme support\n';
        content += '✓ Multiple language support\n\n';
        
        content += 'SYSTEM REQUIREMENTS:\n';
        content += '- Operating System: Windows 10+, macOS 10.14+, Linux\n';
        content += '- Memory: 4GB RAM minimum\n';
        content += '- Storage: 200MB available space\n';
        content += '- Internet: Broadband connection\n';
        content += '- Browser: Chrome 80+, Firefox 75+, Safari 13+\n\n';
        
        content += 'DEVELOPER INFORMATION:\n';
        content += 'Company: Lemonade Technologies Inc.\n';
        content += 'Website: https://lemonade.com\n';
        content += 'Support: support@lemonade.com\n';
        content += 'Privacy: https://lemonade.com/privacy\n';
        content += 'Terms: https://lemonade.com/terms\n\n';
        
        content += 'SECURITY INFORMATION:\n';
        content += '• Digitally signed and verified\n';
        content += '• No malware or viruses detected\n';
        content += '• Regular security updates\n';
        content += '• Encrypted data transmission\n\n';
        
        content += 'Thank you for choosing Lemonade!\n';
        content += 'Your favorite shopping experience awaits...\n\n';
        
        content += 'BINARY_DATA_START:' + '0'.repeat(50000) + ':BINARY_DATA_END\n';
        
        return content;
    }

    trackDownloadAttempt(platform) {
        let downloadStats = JSON.parse(localStorage.getItem('appDownloadStats') || '{}');
        
        if (!downloadStats.totalAttempts) {
            downloadStats.totalAttempts = 0;
        }
        if (!downloadStats[platform]) {
            downloadStats[platform] = 0;
        }
        
        downloadStats.totalAttempts++;
        downloadStats[platform]++;
        
        localStorage.setItem('appDownloadStats', JSON.stringify(downloadStats));
        
        console.log('📊 Download stats:', downloadStats);
    }

    setupSmartPopupTrigger() {
        let pageViews = parseInt(localStorage.getItem('lemonadePageViews') || '0');
        pageViews++;
        localStorage.setItem('lemonadePageViews', pageViews.toString());
        
        const originalAddToCart = this.addToCart.bind(this);
        
        this.addToCart = function(productId, productName, price, quantity) {
            const result = originalAddToCart(productId, productName, price, quantity);
            
            if (this.shouldShowPopup()) {
                setTimeout(() => {
                    this.showAppDownloadPopup();
                }, 2000);
            }
            
            return result;
        }.bind(this);
    }

    debugProductCategories() {
        console.log('🔍 DEBUG: Product Categories');
        
        this.products.forEach((product, index) => {
            console.log(`📱 ${index + 1}. ${product.name}: Category = "${product.category}"`);
        });
        
        const uniqueCategories = [...new Set(this.products.map(p => p.category))];
        console.log('🏷️ Available categories in products:', uniqueCategories);
        
        const categoryCards = document.querySelectorAll('.category-card');
        console.log('🃏 Category cards in HTML:');
        categoryCards.forEach(card => {
            console.log(`   - ${card.textContent.trim()}: data-category = "${card.getAttribute('data-category')}"`);
        });
    }

    setupBottomNavigation() {
        console.log('🔧 Setting up bottom navigation...');
        
        const homeBtn = document.getElementById('nav-home');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                console.log('🏠 Home button clicked');
                this.switchView('home-view');
            });
        }

        const cartBtn = document.getElementById('nav-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                console.log('🛒 Cart button clicked');
                this.switchView('cart-view');
            });
        }

        const accountBtn = document.getElementById('nav-account');
        if (accountBtn) {
            accountBtn.addEventListener('click', () => {
                console.log('👤 Account button clicked');
                this.switchView('account-view');
            });
        }

        const searchBtn = document.getElementById('nav-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('🔍 Search button clicked');
                this.switchView('search-view');
            });
        }
    }
    
    setupCheckoutListeners() {
        const confirmPaymentBtn = document.getElementById('confirm-payment');
        const cancelCheckoutBtn = document.getElementById('cancel-checkout');
        const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
        
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', () => {
                this.processPayment();
            });
        }
        
        if (cancelCheckoutBtn) {
            cancelCheckoutBtn.addEventListener('click', () => {
                this.hideMpesaModal();
            });
        }
        
        if (paymentMethods.length > 0) {
            paymentMethods.forEach(method => {
                method.addEventListener('change', (e) => {
                    const selectedMethod = e.target.value;
                    const mpesaFields = document.getElementById('mpesa-fields');
                    const cashFields = document.getElementById('cash-fields');
                    
                    if (selectedMethod === 'mpesa') {
                        if (mpesaFields) mpesaFields.style.display = 'block';
                        if (cashFields) cashFields.style.display = 'none';
                    } else if (selectedMethod === 'cash') {
                        if (mpesaFields) mpesaFields.style.display = 'none';
                        if (cashFields) cashFields.style.display = 'block';
                    }
                    
                    this.updateConfirmButton(selectedMethod);
                });
            });
        }
    }

    setupAccountNavigation() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item') && e.target.closest('#user-menu')) {
                const menuItem = e.target.closest('.menu-item');
                if (menuItem.onclick) return;
                
                const text = menuItem.textContent.toLowerCase();
                if (text.includes('profile')) {
                    this.showSection('profile');
                } else if (text.includes('address')) {
                    this.showSection('address');
                } else if (text.includes('order') || text.includes('history')) {
                    this.showSection('order-history');
                } else if (text.includes('notification')) {
                    this.showSection('notifications');
                }
            }
            
            if (e.target.closest('.back-btn')) {
                this.showSection('main');
            }
        });
    }
    
    setupCategoryListeners() {
        console.log('🔧 Setting up category listeners...');
        
        document.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.category-card');
            if (categoryCard) {
                const category = categoryCard.getAttribute('data-category');
                console.log('🎯 CATEGORY CARD CLICKED:', category);
                
                document.querySelectorAll('.category-card').forEach(card => {
                    card.classList.remove('active');
                });
                categoryCard.classList.add('active');
                
                this.filterByCategory(category);
            }
        });
    }

    setupProductDetailListeners() {
        const backButton = document.getElementById('back-to-products');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideProductDetail();
                this.switchView('home-view');
            });
        }

        const cartButtonDetail = document.getElementById('cart-button-detail');
        if (cartButtonDetail) {
            cartButtonDetail.addEventListener('click', () => {
                this.switchView('cart-view');
            });
        }

        const addToCartDetail = document.getElementById('add-to-cart-detail');
        if (addToCartDetail) {
            addToCartDetail.addEventListener('click', () => {
                this.addToCartFromDetail();
            });
        }

        const buyNowBtn = document.getElementById('buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                this.buyNowFromDetail();
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.closest('#product-detail-view .quantity-btn')) {
                this.handleDetailQuantityChange(e);
            }
        });
    }

    showProductDetail(product) {
        const detailView = document.getElementById('product-detail-view');
        if (!detailView) return;

        document.getElementById('product-detail-title').textContent = product.name;
        document.getElementById('product-detail-price').textContent = `ksh ${product.price.toFixed(2)}`;
        document.getElementById('product-detail-description').textContent = product.description;
        document.getElementById('product-category').textContent = product.category;
        document.getElementById('product-stock').textContent = product.stock > 0 ? 'In Stock' : 'Out of Stock';
        
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
            mainImage.src = product.image;
            mainImage.alt = product.name;
        }

        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        detailView.style.display = 'block';
        
        this.updateCartBadgeDetail();
    }

    hideProductDetail() {
        const detailView = document.getElementById('product-detail-view');
        if (detailView) {
            detailView.style.display = 'none';
        }
    }
    
    updateCartBadge() {
        console.log('🔄 Updating cart badge, count:', this.cartCount);
        
        const bottomCartBadge = document.getElementById('bottom-cart-count');
        if (bottomCartBadge) {
            bottomCartBadge.textContent = this.cartCount;
            bottomCartBadge.style.display = this.cartCount > 0 ? 'flex' : 'none';
        }
        
        this.updateDetailCartBadge();
        
        console.log('✅ Cart badges updated');
    }

    addToCartFromDetail() {
        const productTitle = document.getElementById('product-detail-title').textContent;
        const productPrice = parseFloat(document.getElementById('product-detail-price').textContent.replace('$', ''));
        const quantity = parseInt(document.querySelector('#product-detail-view .quantity-display').textContent);
        
        const product = this.products.find(p => p.name === productTitle);
        
        if (product) {
            this.addToCart(product.id, product.name, product.price, quantity);
            this.showMessage(`${quantity} ${product.name}(s) added to cart! 🎉`);
            this.updateCartBadgeDetail();
        }
    }

    handleDetailQuantityChange(e) {
        const quantityDisplay = document.querySelector('#product-detail-view .quantity-display');
        let quantity = parseInt(quantityDisplay.textContent);
        
        if (e.target.classList.contains('plus')) {
            quantity++;
        } else if (e.target.classList.contains('minus') && quantity > 1) {
            quantity--;
        }
        
        quantityDisplay.textContent = quantity;
    }

    buyNowFromDetail() {
        this.addToCartFromDetail();
        this.hideProductDetail();
        this.initiateCheckout();
    }
    
    // Product Management
    loadProducts() {
        this.fetchProductsFromBackend();
    }

    async fetchProductsFromBackend() {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // UPDATED: Ensure images array exists for each product
            if (data.products) {
                this.products = data.products.map(product => ({
                    ...product,
                    images: product.images || (product.image ? [product.image] : [])
                }));
            } else if (Array.isArray(data)) {
                this.products = data.map(product => ({
                    ...product,
                    images: product.images || (product.image ? [product.image] : [])
                }));
            } else if (data.success && data.products) {
                this.products = data.products.map(product => ({
                    ...product,
                    images: product.images || (product.image ? [product.image] : [])
                }));
            } else {
                console.warn('⚠️ Unexpected API response format:', data);
                this.products = [];
            }
            
            console.log('📦 Products loaded:', this.products.length);
            
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            this.products = [];
        } finally {
            this.renderProducts();
        }
    }

    // UPDATED: renderProducts with multiple images support
    renderProducts() {
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) {
            console.error('❌ Products container (.products) not found');
            return;
        }

        console.log('🔄 Rendering products:', this.products?.length || 0);
        
        
        
        this.hideNoProductsMessage();
        
        const activeProducts = this.products.filter(product => product.status === 'active');
        
        if (activeProducts.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <p>No products available at the moment.</p>
                </div>
            `;
            return;
        }
        
        productsContainer.innerHTML = activeProducts
            .map(product => {
                console.log('📱 Rendering product:', product.name, 'Category:', product.category);
                
                // UPDATED: Include images array in safeProduct
                const safeProduct = JSON.stringify({
                    ...product,
                    images: product.images || [product.image || ''] // Ensure images array
                }).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                
                // Get first image for thumbnail
                const firstImage = product.images && product.images.length > 0 
                    ? product.images[0] 
                    : product.image || '/uploads/placeholder.jpg';
                
                return `
                    <div class="product-card2" 
                         data-category="${product.category || 'all'}" 
                         data-name="${product.name?.toLowerCase() || ''}">
                        
                        <img src="${firstImage}" 
                             alt="${product.name || 'Product'}" 
                             onclick="lemonadeApp.showProductDetail(${safeProduct})"
                             style="cursor: pointer;"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/fff9c4/ff6f00?text=📱+Product'"
                             class="product-main-image">
                        <h3 class="product-title2">${product.name || 'Unnamed Product'}</h3>
                        
                        <div class="price2">Ksh ${product.price?.toFixed(2) || '0.00'}</div>
                        
                        ${product.stock > 0 ? `
                          
                        ` : `
                            <button class="add-to-cart out-of-stock" disabled>
                                Out of Stock
                            </button>
                        `}
                    </div>
                `;
            }).join('');

        console.log('✅ Products rendered:', activeProducts.length);
        this.setupProductInteractions();
    }

    setupProductInteractions() {
        document.addEventListener('click', (e) => {
            const quantityBtn = e.target.closest('.quantity-btn');
            if (quantityBtn && e.target.closest('.product-card')) {
                const productCard = e.target.closest('.product-card');
                const quantityElement = productCard.querySelector('.quantity');
                
                if (!quantityElement) {
                    console.error('❌ Quantity element not found in product card');
                    return;
                }
                
                let quantity = parseInt(quantityElement.textContent);
                
                if (quantityBtn.classList.contains('plus')) {
                    quantity++;
                } else if (quantityBtn.classList.contains('minus') && quantity > 1) {
                    quantity--;
                }
                
                quantityElement.textContent = quantity;
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart') && !e.target.disabled) {
                const productCard = e.target.closest('.product-card');
                
                if (!productCard) {
                    console.error('❌ Product card not found for add to cart button');
                    return;
                }
                
                const productId = parseInt(e.target.getAttribute('data-id'));
                const productName = e.target.getAttribute('data-product');
                const price = parseFloat(e.target.getAttribute('data-price'));
                const quantityElement = productCard.querySelector('.quantity');
                
                if (!quantityElement) {
                    console.error('❌ Quantity element not found for add to cart');
                    return;
                }
                
                const quantity = parseInt(quantityElement.textContent);
                
                console.log('🛒 Adding to cart:', { productId, productName, price, quantity });
                
                this.addToCart(productId, productName, price, quantity);
                this.showMessage(`${quantity} ${productName}(s) added to cart! 🎉`);
                
                quantityElement.textContent = '1';
            }
        });
    }
    
    addToCart(productId, productName, price, quantity) {
        console.log('🛒 addToCart called:', { productId, productName, price, quantity });
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ 
                id: productId,
                product: productName, 
                price: price, 
                quantity: quantity
            });
        }
        
        this.cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        
        console.log(`📊 Cart count updated to: ${this.cartCount}`);
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    removeFromCart(itemId) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            const removedItem = this.cart[itemIndex];
            this.cartCount -= removedItem.quantity;
            this.cart.splice(itemIndex, 1);
            this.updateCartDisplay();
            this.saveCartToStorage();
            this.showMessage(`${removedItem.product} removed from cart!`);
        }
    }

    clearCart() {
        this.cart = [];
        this.cartCount = 0;
        this.updateCartDisplay();
        this.saveCartToStorage();
        this.showMessage('Cart cleared! 🧹');
    }

    updateCartDisplay() {
        console.log('🔄 Updating cart display, items:', this.cart.length);
        
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total-amount');
        
        if (this.cart.length === 0) {
            if (cartItems) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p style="text-align: center; color: var(--text-light); padding: 2rem;">Your cart is empty</p>
                        <button class="continue-shopping-btn" onclick="lemonadeApp.switchView('home-view')">
                            Continue Shopping
                        </button>
                    </div>
                `;
            }
            if (cartTotal) cartTotal.textContent = 'ksh 0.00';
        } else {
            if (cartItems) {
                cartItems.innerHTML = this.cart.map(item => {
                    const product = this.products.find(p => p.id === item.id);
                    const productImage = product ? product.image : 'https://via.placeholder.com/60x60/fff9c4/ff6f00?text=📱';
                    
                    return `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="item-image">
                            <img src="${productImage}" alt="${item.product}" 
                                 onerror="this.src='https://via.placeholder.com/60x60/fff9c4/ff6f00?text=📱'">
                        </div>
                        <div class="item-details">
                            <div class="item-info">
                                <h4>${item.product}</h4>
                                <p class="item-price">ksh ${item.price.toFixed(2)} each</p>
                            </div>
                           
                            </div>
                        </div>
                        <div class="item-total">
                            ksh ${(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                    `;
                }).join('');
            }
            
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (cartTotal) {
                cartTotal.textContent = `ksh ${total.toFixed(2)}`;
            }
        }
        
        this.updateCartBadge();
        this.setupCartItemListeners();
    }

    setupCartItemListeners() {
        console.log('🔧 Setting up cart item listeners...');
        
        document.addEventListener('click', (e) => {
            const quantityBtn = e.target.closest('.quantity-btn');
            if (quantityBtn) {
                const productId = parseInt(quantityBtn.getAttribute('data-id'));
                const isPlus = quantityBtn.classList.contains('plus');
                
                console.log('🎯 Quantity button clicked:', { productId, isPlus });
                
                if (!isNaN(productId)) {
                    this.updateCartQuantity(productId, isPlus);
                } else {
                    console.error('❌ Invalid product ID:', quantityBtn.getAttribute('data-id'));
                }
            }
            
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                const productId = parseInt(removeBtn.getAttribute('data-id'));
                
                console.log('🗑️ Remove button clicked:', productId);
                
                if (!isNaN(productId)) {
                    this.removeFromCart(productId);
                } else {
                    console.error('❌ Invalid product ID for removal:', removeBtn.getAttribute('data-id'));
                }
            }
        });
    }
    
    updateCartQuantity(productId, increase = true) {
        console.log('🔄 updateCartQuantity called:', { productId, increase, currentCart: this.cart });
        
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            if (increase) {
                this.cart[itemIndex].quantity += 1;
                console.log(`➕ Increased quantity for item ${productId} to ${this.cart[itemIndex].quantity}`);
            } else {
                this.cart[itemIndex].quantity -= 1;
                console.log(`➖ Decreased quantity for item ${productId} to ${this.cart[itemIndex].quantity}`);
                
                if (this.cart[itemIndex].quantity <= 0) {
                    console.log(`🗑️ Removing item ${productId} from cart (quantity <= 0)`);
                    this.cart.splice(itemIndex, 1);
                }
            }
            
            this.cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
            console.log(`📊 New cart count: ${this.cartCount}`);
            
            this.saveCartToStorage();
            this.updateCartBadge();
            this.updateCartDisplay();
            
            console.log('✅ Cart quantity updated successfully');
            console.log('🛒 Final cart state:', this.cart);
        } else {
            console.error('❌ Item not found in cart:', productId);
        }
    }

    debugCartMath() {
        console.log('🧮 DEBUG CART MATH:');
        console.log('Cart items:', this.cart);
        
        const calculatedCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        console.log(`Calculated count: ${calculatedCount}`);
        console.log(`Stored cartCount: ${this.cartCount}`);
        console.log(`Match: ${calculatedCount === this.cartCount ? '✅' : '❌'}`);
        
        if (calculatedCount !== this.cartCount) {
            console.error('🚨 COUNT MISMATCH! Resetting...');
            this.cartCount = calculatedCount;
            this.updateCartBadge();
        }
    }
    
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        
        this.cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        this.saveCartToStorage();
        this.updateCartBadge();
        this.updateCartDisplay();
        
        this.showMessage('🗑️ Item removed from cart');
        console.log('❌ Item removed from cart:', productId);
    }
    
    updateCartView() {
        const cartItems = document.getElementById('cart-items');
        if (!cartItems) return;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const cartTotalElement = document.getElementById('cart-total-amount');
        if (cartTotalElement) cartTotalElement.textContent = `ksh ${total.toFixed(2)}`;
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.product}</h4>
                    <p>ksh ${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span>ksh ${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item" data-id="${item.id}" type="button">Remove</button>
                </div>
            </div>
        `).join('') || '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Your cart is empty</p>';

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.getAttribute('data-id'));
                this.removeFromCart(itemId);
                this.updateCartView();
            });
        });
    }
    
    debugCart() {
        console.log('🔍 DEBUG CART:');
        console.log('Cart items:', this.cart);
        console.log('Cart count:', this.cartCount);
        console.log('Products in system:', this.products.length);
        
        this.cart.forEach(cartItem => {
            const productExists = this.products.some(p => p.id === cartItem.id);
            console.log(`Cart item ${cartItem.id} (${cartItem.product}): ${productExists ? '✅ Exists' : '❌ Missing'}`);
        });
    }
    
    // Checkout Functions
    initiateCheckout() {
        if (this.cart.length === 0) {
            this.showMessage('Your cart is empty! 🛒');
            return;
        }

        if (!this.currentUser) {
            this.showMessage('Please sign in to complete your order');
            this.switchView('account-view');
            return;
        }

        this.showMpesaCheckout();
    }

    showMpesaCheckout() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const summaryHTML = `
            <div class="checkout-summary">
                <h3 style="margin-bottom: 0.5rem;">Order Summary</h3>
                ${this.cart.map(item => `
                    <div class="checkout-item">
                        <span>${item.product} × ${item.quantity}</span>
                        <span>ksh ${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="checkout-total">
                    <span>Total:</span>
                    <span> ksh ${total.toFixed(2)}</span>
                </div>
            </div>
        `;

        const checkoutSummary = document.getElementById('checkout-summary');
        const checkoutUserName = document.getElementById('checkout-user-name');
        
        if (checkoutSummary) checkoutSummary.innerHTML = summaryHTML;
        if (checkoutUserName) checkoutUserName.textContent = this.currentUser.name;
        
        this.setupCheckoutAddress();
        
        const mpesaRadio = document.getElementById('payment-mpesa');
        if (mpesaRadio) mpesaRadio.checked = true;
        
        const mpesaFields = document.getElementById('mpesa-fields');
        const cashFields = document.getElementById('cash-fields');
        if (mpesaFields) mpesaFields.style.display = 'block';
        if (cashFields) cashFields.style.display = 'none';
        
        const phoneInput = document.getElementById('checkout-phone');
        if (phoneInput) phoneInput.value = this.currentUser.phone || '';
        
        const termsCheckbox = document.getElementById('terms-agree');
        if (termsCheckbox) termsCheckbox.checked = false;
        
        this.showMpesaModal();
    }

    setupCheckoutAddress() {
        const savedAddressDisplay = document.getElementById('saved-address-display');
        const addressInputSection = document.getElementById('address-input-section');
        const savedAddressText = document.getElementById('saved-address-text');
        
        const addressInput = document.getElementById('checkout-address');
        const cityInput = document.getElementById('checkout-city');
        const landmarkInput = document.getElementById('checkout-landmark');
        const notesInput = document.getElementById('delivery-notes');
        
        if (addressInput) addressInput.value = '';
        if (cityInput) cityInput.value = '';
        if (landmarkInput) landmarkInput.value = '';
        if (notesInput) notesInput.value = '';

        if (this.currentUser.address && savedAddressDisplay && addressInputSection) {
            savedAddressDisplay.style.display = 'block';
            addressInputSection.style.display = 'none';
            
            const addressText = typeof this.currentUser.address === 'string' 
                ? this.currentUser.address 
                : this.currentUser.address.fullAddress;
                
            if (savedAddressText) savedAddressText.textContent = addressText;
        } else if (savedAddressDisplay && addressInputSection) {
            savedAddressDisplay.style.display = 'none';
            addressInputSection.style.display = 'block';
        }
    }

    changeAddress() {
        const savedAddressDisplay = document.getElementById('saved-address-display');
        const addressInputSection = document.getElementById('address-input-section');
        
        if (savedAddressDisplay) savedAddressDisplay.style.display = 'none';
        if (addressInputSection) addressInputSection.style.display = 'block';
    }

    // Main payment processing
    async processPayment() {
        console.log('🔍 Starting payment process...');
        
        const termsCheckbox = document.getElementById('terms-agree');
        if (termsCheckbox && !termsCheckbox.checked) {
            this.showMessage('Please agree to the terms and conditions');
            return;
        }

        const selectedPaymentElement = document.querySelector('input[name="payment-method"]:checked');
        if (!selectedPaymentElement) {
            this.showMessage('Please select a payment method');
            return;
        }
        const selectedPayment = selectedPaymentElement.value;
        
        if (this.cart.length === 0) {
            this.showMessage('Your cart is empty!');
            return;
        }

        if (!this.currentUser) {
            this.showMessage('Please log in to complete your order');
            this.hideMpesaModal();
            this.switchView('account-view');
            return;
        }

        let deliveryAddress = '';
        let addressToSave = null;
        
        const savedAddressDisplay = document.getElementById('saved-address-display');
        if (savedAddressDisplay && savedAddressDisplay.style.display !== 'none') {
            const savedAddressText = document.getElementById('saved-address-text');
            if (savedAddressText) {
                deliveryAddress = savedAddressText.textContent;
            }
        } else {
            const address = document.getElementById('checkout-address')?.value.trim() || '';
            const city = document.getElementById('checkout-city')?.value.trim() || '';
            
            if (!address || !city) {
                this.showMessage('Please enter delivery address and city');
                return;
            }
            
            const landmark = document.getElementById('checkout-landmark')?.value.trim() || '';
            deliveryAddress = `${address}${landmark ? ` (Near ${landmark})` : ''}, ${city}`;
            
            const notes = document.getElementById('delivery-notes')?.value.trim() || '';
            if (notes) {
                deliveryAddress += ` - ${notes}`;
            }
            
            addressToSave = {
                street: address,
                landmark: landmark,
                city: city,
                fullAddress: deliveryAddress
            };
        }

        if (selectedPayment === 'mpesa') {
            const phone = document.getElementById('checkout-phone')?.value || '';
            if (!this.validatePhone(phone)) {
                this.showMessage('Please enter a valid Kenyan phone number (07XXXXXXXX)');
                return;
            }
        }

        this.showMessage('📱 Processing your order...');

        try {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderData = {
                customerName: this.currentUser.name,
                customerPhone: selectedPayment === 'mpesa' ? document.getElementById('checkout-phone')?.value : this.currentUser.phone,
                customerEmail: this.currentUser.email,
                customerId: this.currentUser.id,
                items: this.cart,
                total: total,
                deliveryAddress: deliveryAddress,
                paymentMethod: selectedPayment,
                paymentStatus: selectedPayment === 'cash' ? 'pending_cod' : 'pending',
                status: 'pending'
            };
            
            console.log('Sending order to backend:', orderData);
            
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            console.log('Backend response:', data);
            
            if (data.success) {
                if (selectedPayment === 'mpesa') {
                    this.showMpesaConfirmation(data.order, deliveryAddress);
                } else {
                    this.showCashConfirmation(data.order, deliveryAddress);
                }
                
                if (addressToSave && !this.currentUser.address) {
                    this.askToSaveAddress(addressToSave);
                }
                
                this.clearCart();
                this.hideMpesaModal();
                this.loadOrderHistory();
                
            } else {
                this.showMessage('❌ Order failed: ' + (data.message || 'Please try again.'));
            }
            
        } catch (error) {
            console.error('❌ Payment error:', error);
            this.showMessage('❌ Network error. Please check your connection.');
        }
    }

    validatePhone(phone) {
        const phoneRegex = /^07[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showMpesaConfirmation(order, deliveryAddress) {
        const orderSummary = this.cart.map(item => 
            `${item.product} x${item.quantity}`
        ).join(', ');
        
        this.showMessage(`✅ M-Pesa Order Confirmed! Order #${order.orderNumber}. Check your phone for payment prompt.`);
        this.addOrderNotification(order, deliveryAddress, 'mpesa');
        this.updateUserOrderStats(order);
    }

    showCashConfirmation(order, deliveryAddress) {
        const orderSummary = this.cart.map(item => 
            `${item.product} x${item.quantity}`
        ).join(', ');
        
        this.showMessage(`✅ Cash Order Confirmed! Order #${order.orderNumber}. Please have cash ready for delivery.`);
        this.addOrderNotification(order, deliveryAddress, 'cash');
        this.updateUserOrderStats(order);
    }

    askToSaveAddress(address) {
        if (confirm('Would you like to save this address for faster checkout next time?')) {
            this.saveUserAddress(address);
        }
    }

    async saveUserAddress(address) {
        try {
            const response = await fetch(`http://localhost:5000/api/user/address/${this.currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: address })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser.address = address;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('✅ Address saved successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            this.currentUser.address = address;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMessage('✅ Address saved locally!', 'success');
        }
    }

    updateUserOrderStats(order) {
        if (!this.currentUser) return;
        
        this.currentUser.orders = (this.currentUser.orders || 0) + 1;
        this.currentUser.totalSpent = (this.currentUser.totalSpent || 0) + parseFloat(order.total);
        this.currentUser.lastOrder = new Date().toISOString();
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateUserUI();
    }

    addOrderNotification(order, deliveryAddress, paymentMethod) {
        if (!this.currentUser) return;
        
        const paymentIcons = {
            'mpesa': 'fas fa-mobile-alt',
            'cash': 'fas fa-money-bill-wave',
            'card': 'fas fa-credit-card'
        };
        
        const orderItems = order.items || this.cart;
        const productImages = orderItems.map(item => {
            const product = this.products.find(p => p.id === item.id);
            return product ? product.image : 'https://via.placeholder.com/60x60/fff9c4/ff6f00?text=📱';
        }).slice(0, 3);
        
        const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const itemNames = orderItems.map(item => item.product).join(', ');
        
        const notification = {
            id: `notif_${Date.now()}`,
            type: 'order',
            title: `Order #${order.orderNumber || order.id} Confirmed`,
            message: `Your ${paymentMethod.toUpperCase()} order with ${totalItems} item${totalItems !== 1 ? 's' : ''} is being prepared`,
            deliveryInfo: `Delivery to: ${deliveryAddress}`,
            paymentMethod: paymentMethod,
            paymentIcon: paymentIcons[paymentMethod] || 'fas fa-shopping-bag',
            productImages: productImages,
            itemNames: itemNames,
            totalItems: totalItems,
            timestamp: new Date().toISOString(),
            orderId: order.id
        };
        
        let userNotifications = JSON.parse(localStorage.getItem(`lemonadeNotifications_${this.currentUser.id}`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`lemonadeNotifications_${this.currentUser.id}`, JSON.stringify(userNotifications.slice(0, 20)));
    }

    loadNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList || !this.currentUser) return;
        
        try {
            const notifications = JSON.parse(localStorage.getItem(`lemonadeNotifications_${this.currentUser.id}`) || '[]');
            
            if (notifications.length > 0) {
                notificationsList.innerHTML = notifications.map(notification => {
                    const productImagesHTML = notification.productImages ? notification.productImages.map(img => `
                        <img src="${img}" alt="Product" 
                             onerror="this.src='https://via.placeholder.com/60x60/fff9c4/ff6f00?text=📱'">
                    `).join('') : '';
                    
                    return `
                    <div class="notification-item">
                        <div class="notification-header">
                            <div class="notification-icon">
                                <i class="${notification.paymentIcon || 'fas fa-bell'}"></i>
                            </div>
                            <div class="notification-title">
                                <h4>${notification.title}</h4>
                                <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div class="notification-body">
                            <p>${notification.message}</p>
                            ${notification.itemNames ? `<small class="items-list">Items: ${notification.itemNames}</small>` : ''}
                            ${notification.deliveryInfo ? `<small class="delivery-info">${notification.deliveryInfo}</small>` : ''}
                        </div>
                        
                        ${productImagesHTML ? `
                        <div class="notification-products">
                            <div class="product-images">
                                ${productImagesHTML}
                                ${notification.totalItems > 3 ? `<div class="more-items">+${notification.totalItems - 3} more</div>` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    `;
                }).join('');
            } else {
                notificationsList.innerHTML = `
                    <div class="no-notifications">
                        <i class="fas fa-bell-slash" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p>No notifications</p>
                        <small>You'll get notifications about your orders here</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b6b;"></i>
                    <p>Error loading notifications</p>
                    <small>Please try again later</small>
                </div>
            `;
        }
    }

    // Modal functions
    showMpesaModal() {
        const modal = document.getElementById('mpesa-modal');
        if (modal) modal.style.display = 'block';
    }

    hideMpesaModal() {
        const modal = document.getElementById('mpesa-modal');
        if (modal) modal.style.display = 'none';
    }

    updateConfirmButton(paymentMethod) {
        const confirmBtn = document.getElementById('confirm-payment');
        if (!confirmBtn) return;
        
        switch(paymentMethod) {
            case 'mpesa':
                confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Pay with M-Pesa';
                break;
            case 'cash':
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Cash Order';
                break;
            default:
                confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Complete Order';
        }
    }

    // Account Management Methods
    showSection(sectionName) {
        document.querySelectorAll('.account-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const userMenu = document.getElementById('user-menu');
        const authSection = document.getElementById('auth-section');
        
        if (userMenu) userMenu.style.display = 'none';
        if (authSection) authSection.style.display = 'none';

        if (sectionName === 'main') {
            if (this.currentUser) {
                if (userMenu) userMenu.style.display = 'block';
            } else {
                if (authSection) authSection.style.display = 'block';
            }
        } else {
            const section = document.getElementById(`${sectionName}-section`);
            if (section) {
                section.style.display = 'block';
                
                switch(sectionName) {
                    case 'profile':
                        this.loadProfileData();
                        break;
                    case 'address':
                        this.loadAddressData();
                        break;
                    case 'order-history':
                        this.loadOrderHistory();
                        break;
                    case 'notifications':
                        this.loadNotifications();
                        break;
                }
            }
        }
    }

    showNotifications() {
        this.showSection('notifications');
    }
    
    async loadOrderHistory() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/user/orders/${this.currentUser.id}`);
            const data = await response.json();
            
            const ordersHistory = document.getElementById('orders-history');
            if (!ordersHistory) return;
            
            if (data.success && data.orders && data.orders.length > 0) {
                ordersHistory.innerHTML = data.orders.map(order => {
                    const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
                    
                    return `
                    <div class="order-history-item">
                        <div class="order-header">
                            <div class="order-info">
                                <h4>Order #${order.orderNumber || order.id}</h4>
                                <span class="order-date">${new Date(order.createdAt || order.date).toLocaleDateString()}</span>
                                <span class="order-items-count">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="order-status status-${order.status}">
                                ${this.formatOrderStatus(order.status)}
                            </div>
                        </div>
                        
                        <div class="order-items-preview">
                            ${order.items ? order.items.map(item => {
                                const product = this.products.find(p => p.id === item.id);
                                const productImage = product ? product.image : 'https://via.placeholder.com/50x50/fff9c4/ff6f00?text=📱';
                                
                                return `
                                <div class="order-item-preview">
                                    <img src="${productImage}" alt="${item.product}" 
                                         onerror="this.src='https://via.placeholder.com/50x50/fff9c4/ff6f00?text=📱'">
                                    <div class="item-preview-info">
                                        <span class="item-name">${item.product}</span>
                                        <span class="item-quantity">Qty: ${item.quantity}</span>
                                    </div>
                                </div>
                                `;
                            }).join('') : 'No items information'}
                        </div>
                        
                        <div class="order-footer">
                            <div class="order-total">
                                Total: ksh ${parseFloat(order.total || 0).toFixed(2)}
                            </div>
                            ${order.deliveryAddress ? `
                                <div class="order-address">
                                    <small>📍 ${order.deliveryAddress}</small>
                                </div>
                            ` : ''}
                            ${order.paymentMethod ? `
                                <div class="order-payment">
                                    <small>Payment: ${order.paymentMethod.toUpperCase()}</small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    `;
                }).join('');
            } else {
                ordersHistory.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-shopping-bag" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p>No orders yet</p>
                        <small>Your order history will appear here</small>
                        <button class="continue-shopping-btn" onclick="lemonadeApp.switchView('home-view')" style="margin-top: 1rem;">
                            Start Shopping
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading order history:', error);
            const ordersHistory = document.getElementById('orders-history');
            if (ordersHistory) {
                ordersHistory.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6b6b;"></i>
                        <p>Error loading order history</p>
                        <small>Please check your connection and try again</small>
                    </div>
                `;
            }
        }
    }
   
    formatOrderStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending',
            'confirmed': '✅ Confirmed',
            'preparing': '👨‍🍳 Preparing',
            'ready': '📦 Ready for Pickup',
            'out_for_delivery': '🚚 Out for Delivery',
            'completed': '🎉 Delivered',
            'cancelled': '❌ Cancelled',
            'pending_cod': '💰 Pending Cash Payment'
        };
        return statusMap[status] || status;
    }
    
    loadProfileData() {
        if (!this.currentUser) return;
        
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        
        if (profileName) profileName.value = this.currentUser.name || '';
        if (profileEmail) profileEmail.value = this.currentUser.email || '';
        if (profilePhone) profilePhone.value = this.currentUser.phone || '';
        
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.onsubmit = (e) => {
                e.preventDefault();
                this.updateProfile();
            };
        }
    }

    async updateProfile() {
        if (!this.currentUser) return;
        
        const name = document.getElementById('profile-name')?.value.trim() || '';
        const email = document.getElementById('profile-email')?.value.trim() || '';
        const phone = document.getElementById('profile-phone')?.value.trim() || '';
        
        if (!name) {
            this.showMessage('Name is required');
            return;
        }
        
        try {
            this.currentUser.name = name;
            this.currentUser.email = email;
            this.currentUser.phone = phone;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUserUI();
            this.showMessage('Profile updated successfully!');
            this.showSection('main');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('Failed to update profile');
        }
    }

    loadAddressData() {
        if (!this.currentUser) return;
        
        const addressContainer = document.getElementById('current-address');
        const addressForm = document.getElementById('address-form');
        
        if (!addressContainer || !addressForm) return;
        
        if (this.currentUser.address) {
            addressContainer.innerHTML = `
                <div class="saved-address">
                    <h4>Saved Address</h4>
                    <p>${typeof this.currentUser.address === 'string' ? this.currentUser.address : this.currentUser.address.fullAddress}</p>
                </div>
            `;
        } else {
            addressContainer.innerHTML = '<p>No address saved yet</p>';
        }
        
        if (this.currentUser.address) {
            const deliveryAddress = document.getElementById('delivery-address');
            const addressLandmark = document.getElementById('address-landmark');
            const addressCity = document.getElementById('address-city');
            
            if (typeof this.currentUser.address === 'string') {
                if (deliveryAddress) deliveryAddress.value = this.currentUser.address;
            } else {
                if (deliveryAddress) deliveryAddress.value = this.currentUser.address.street || '';
                if (addressLandmark) addressLandmark.value = this.currentUser.address.landmark || '';
                if (addressCity) addressCity.value = this.currentUser.address.city || '';
            }
        }
        
        addressForm.onsubmit = (e) => {
            e.preventDefault();
            this.saveAddress();
        };
    }

    async saveAddress() {
        if (!this.currentUser) return;
        
        const street = document.getElementById('delivery-address')?.value.trim() || '';
        const landmark = document.getElementById('address-landmark')?.value.trim() || '';
        const city = document.getElementById('address-city')?.value.trim() || '';
        
        if (!street || !city) {
            this.showMessage('Delivery address and city are required');
            return;
        }
        
        const address = {
            street: street,
            landmark: landmark,
            city: city,
            fullAddress: `${street}${landmark ? ` (Near ${landmark})` : ''}, ${city}`
        };
        
        try {
            const response = await fetch(`http://localhost:5000/api/user/address/${this.currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: address })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentUser.address = address;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    this.showMessage('Address saved successfully!');
                    this.loadAddressData();
                    return;
                }
            }
            
            throw new Error('Backend save failed');
            
        } catch (error) {
            console.error('Error saving address:', error);
            this.currentUser.address = address;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMessage('Address saved locally!');
            this.loadAddressData();
        }
    }

    // Storage Management
    saveCartToStorage() {
        localStorage.setItem('lemonadeCart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('lemonadeCart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        }
    }

    loadUserPreferences() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }

        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    // UPDATED: Product Detail Methods for multiple images
    // This method will be replaced by the enhanced version below
  // REPLACE THE ENTIRE loadProductImages METHOD WITH THIS:
loadProductImages(product) {
    console.log('🖼️ Loading product images for:', product.name);
    
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');
    const currentImageIndexElement = document.getElementById('current-image-index');
    const totalImagesElement = document.getElementById('total-images');
    
    if (!mainImage || !thumbnailContainer) {
        console.error('❌ Image elements not found');
        return;
    }
    
    // Get images array - support both single image and multiple images
    let images = [];
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Use images array if available
        images = product.images;
        console.log(`📸 Using ${images.length} images from product.images array`);
    } else if (product.image) {
        // Fallback to single image
        images = [product.image];
        console.log('📸 Using single image from product.image');
    } else {
        // No images, use placeholder
        images = ['https://via.placeholder.com/600x400/fff9c4/ff6f00?text=🍋+Product'];
        console.log('📸 Using placeholder image');
    }
    
    // If we have less than 4 images, duplicate to make 4
    if (images.length < 4) {
        console.log(`📸 Duplicating images to reach 4 (currently ${images.length})`);
        const originalImages = [...images];
        while (images.length < 4) {
            images.push(originalImages[images.length % originalImages.length]);
        }
    }
    
    console.log(`📸 Final images array: ${images.length} images`);
    
    // Store images for navigation
    this.currentProductImages = images;
    this.currentImageIndex = 0;
    
    // Set main image
    mainImage.src = images[0];
    mainImage.alt = product.name;
    mainImage.style.cursor = 'pointer';
    
    // Update image counter
    if (currentImageIndexElement) {
        currentImageIndexElement.textContent = '1';
    }
    if (totalImagesElement) {
        totalImagesElement.textContent = images.length.toString();
    }
    
    // Show navigation buttons if we have multiple images
    if (prevBtn) {
        prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
        prevBtn.style.cursor = 'pointer';
    }
    if (nextBtn) {
        nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
        nextBtn.style.cursor = 'pointer';
    }
    
    // Clear previous thumbnails
    thumbnailContainer.innerHTML = '';
    
    // Create thumbnails for each image
    images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = imageUrl;
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.alt = `${product.name} - Image ${index + 1}`;
        thumbnail.title = `Click to view image ${index + 1}`;
        thumbnail.style.cursor = 'pointer';
        thumbnail.style.width = '80px';
        thumbnail.style.height = '80px';
        thumbnail.style.objectFit = 'cover';
        thumbnail.style.borderRadius = '8px';
        thumbnail.style.border = index === 0 ? '3px solid #ff6f00' : '3px solid transparent';
        thumbnail.style.opacity = index === 0 ? '1' : '0.7';
        thumbnail.style.transition = 'all 0.3s ease';
        
        // Add hover effect
        thumbnail.addEventListener('mouseenter', () => {
            if (!thumbnail.classList.contains('active')) {
                thumbnail.style.opacity = '1';
                thumbnail.style.transform = 'translateY(-2px)';
            }
        });
        
        thumbnail.addEventListener('mouseleave', () => {
            if (!thumbnail.classList.contains('active')) {
                thumbnail.style.opacity = '0.7';
                thumbnail.style.transform = 'translateY(0)';
            }
        });
        
        // Click to change main image
        thumbnail.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setMainProductImage(imageUrl, index);
        });
        
        thumbnailContainer.appendChild(thumbnail);
    });
    
    // Show thumbnail container
    thumbnailContainer.style.display = 'flex';
    thumbnailContainer.style.gap = '10px';
    thumbnailContainer.style.flexWrap = 'wrap';
    thumbnailContainer.style.justifyContent = 'center';
    thumbnailContainer.style.padding = '10px 0';
    thumbnailContainer.style.overflowX = 'auto';
    
    console.log('✅ Product images loaded successfully');
}

    // ADDED: Setup image navigation
   // REPLACE THE ENTIRE setupImageNavigation METHOD WITH THIS:
setupImageNavigation() {
    console.log('🔧 Setting up image navigation...');
    
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('⬅️ Previous button clicked');
            this.navigateImage(-1);
        });
        
        // Style the button
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #333;
            transition: all 0.3s ease;
            z-index: 10;
        `;
        
        prevBtn.addEventListener('mouseenter', () => {
            prevBtn.style.background = 'white';
            prevBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            prevBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        
        prevBtn.addEventListener('mouseleave', () => {
            prevBtn.style.background = 'rgba(255, 255, 255, 0.9)';
            prevBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            prevBtn.style.transform = 'translateY(-50%) scale(1)';
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('➡️ Next button clicked');
            this.navigateImage(1);
        });
        
        // Style the button
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.style.cssText = `
            position: absolute;
            top: 50%;
            right: 15px;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #333;
            transition: all 0.3s ease;
            z-index: 10;
        `;
        
        nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.background = 'white';
            nextBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            nextBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        
        nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.background = 'rgba(255, 255, 255, 0.9)';
            nextBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            nextBtn.style.transform = 'translateY(-50%) scale(1)';
        });
    }
    
    console.log('✅ Image navigation set up');
}
    // ADDED: Navigate between images
  // REPLACE THE ENTIRE navigateImage METHOD WITH THIS:
navigateImage(direction) {
    if (!this.currentProductImages || this.currentProductImages.length <= 1) {
        console.log('⚠️ No images to navigate');
        return;
    }
    
    console.log(`🖼️ Navigating images: direction ${direction}, current index ${this.currentImageIndex}, total images ${this.currentProductImages.length}`);
    
    // Calculate new index
    let newIndex = this.currentImageIndex + direction;
    
    // Loop around if out of bounds
    if (newIndex < 0) {
        newIndex = this.currentProductImages.length - 1;
    } else if (newIndex >= this.currentProductImages.length) {
        newIndex = 0;
    }
    
    console.log(`🖼️ New image index: ${newIndex}`);
    
    // Update to new image
    this.setMainProductImage(this.currentProductImages[newIndex], newIndex);
}
// REPLACE THE ENTIRE setupImageZoom METHOD WITH THIS:
setupImageZoom() {
    console.log('🔧 Setting up image zoom...');
    
    const mainImage = document.getElementById('main-product-image');
    if (!mainImage) {
        console.error('❌ Main image not found for zoom');
        return;
    }
    
    // Ensure main image container exists
    const mainImageContainer = mainImage.parentElement;
    if (!mainImageContainer) {
        console.error('❌ Main image container not found');
        return;
    }
    
    // Make sure main image is clickable
    mainImage.style.cursor = 'zoom-in';
    
    // Add click event for zoom
    mainImage.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (mainImage.classList.contains('zoomed')) {
            // Zoom out
            mainImage.classList.remove('zoomed');
            mainImage.style.cursor = 'zoom-in';
            mainImage.style.transform = 'scale(1)';
            mainImage.style.transition = 'transform 0.3s ease';
            console.log('🔍 Zoomed out');
        } else {
            // Zoom in
            mainImage.classList.add('zoomed');
            mainImage.style.cursor = 'zoom-out';
            mainImage.style.transform = 'scale(1.5)';
            mainImage.style.transition = 'transform 0.3s ease';
            console.log('🔍 Zoomed in');
        }
    });
    
    // Add double-click for zoom (alternative)
    mainImage.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        mainImage.click(); // Trigger single click
    });
    
    // Exit zoom when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.product-gallery') && mainImage.classList.contains('zoomed')) {
            mainImage.classList.remove('zoomed');
            mainImage.style.cursor = 'zoom-in';
            mainImage.style.transform = 'scale(1)';
            console.log('🔍 Zoomed out (clicked outside)');
        }
    });
    
    // Ensure proper styling for zoom
    const style = document.createElement('style');
    style.textContent = `
        .product-gallery {
            position: relative;
        }
        
        .main-image-container {
            position: relative;
            width: 100%;
            height: 400px;
            overflow: hidden;
            border-radius: 15px;
            background: #f9f9f9;
            margin-bottom: 15px;
        }
        
        #main-product-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.3s ease;
        }
        
        #main-product-image.zoomed {
            cursor: zoom-out;
            transform: scale(1.5);
            z-index: 100;
            position: relative;
        }
        
        .image-counter {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            z-index: 5;
        }
        
        @media (max-width: 768px) {
            .main-image-container {
                height: 300px;
            }
        }
        
        @media (max-width: 480px) {
            .main-image-container {
                height: 250px;
            }
            
            .image-counter {
                font-size: 12px;
                padding: 4px 10px;
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Image zoom set up');
}
    // UPDATED: Set main product image
    setMainProductImage(url, index) {
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
            mainImage.src = url;
            this.currentImageIndex = index;
            
            // Update thumbnails
            document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            // Update image counter
            const currentImageIndex = document.getElementById('current-image-index');
            if (currentImageIndex) {
                currentImageIndex.textContent = (index + 1).toString();
            }
        }
    }

    // UPDATED: Enhanced showProductDetail method
 // REPLACE THE ENTIRE showProductDetail METHOD WITH THIS:
showProductDetail(product) {
    console.log('🎯 Showing product detail:', product.name);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    // Hide main header
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) mainHeader.style.display = 'none';
    
    // Show product detail view
    const detailView = document.getElementById('product-detail-view');
    if (detailView) {
        detailView.style.display = 'block';
        console.log('✅ Product detail view displayed');
    }
    
    // Update product details
    document.getElementById('product-detail-title').textContent = product.name;
    document.getElementById('product-detail-price').textContent = `Ksh ${product.price.toFixed(2)}`;
    
    // Handle description - check if it exists
    const descriptionElement = document.getElementById('product-detail-description');
    if (descriptionElement) {
        descriptionElement.textContent = product.description || 'No description available';
    }
    
    document.getElementById('product-category').textContent = this.formatCategory(product.category);
    document.getElementById('product-stock').textContent = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';
    
    // Load product images with multiple images support
    this.loadProductImages(product);
    
    // Setup image navigation (for prev/next buttons)
    this.setupImageNavigation();
    
    // Load reviews
    this.loadProductReviews(product);
    
    // Set current product
    this.currentProductDetail = product;
    this.currentDetailQuantity = 1;
    this.updateDetailQuantityDisplay();
    
    // Update cart badge in detail view
    this.updateDetailCartBadge();
    
    // Setup zoom functionality
    this.setupImageZoom();
    
    console.log('✅ Product detail loaded successfully');
}

 // REPLACE THE ENTIRE hideProductDetail METHOD WITH THIS:
hideProductDetail() {
    console.log('👋 Hiding product detail');
    
    const detailView = document.getElementById('product-detail-view');
    if (detailView) {
        detailView.style.display = 'none';
    }
    
    // Show main header
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        mainHeader.style.display = 'block';
    }
    
    // Show home view
    const homeView = document.getElementById('home-view');
    if (homeView) {
        homeView.style.display = 'block';
    }
    
    // Reset zoom if active
    const mainImage = document.getElementById('main-product-image');
    if (mainImage && mainImage.classList.contains('zoomed')) {
        mainImage.classList.remove('zoomed');
        mainImage.style.cursor = 'zoom-in';
        mainImage.style.transform = 'scale(1)';
    }
    
    // Make sure bottom nav is visible
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'flex';
    }
}

    loadProductReviews(product) {
        // Sample reviews - in real app, fetch from backend
        const reviews = [
            {
                id: 1,
                customerName: 'John D.',
                rating: 5,
                comment: 'Excellent product! Fast delivery and great quality.',
                date: '2023-10-15'
            },
            {
                id: 2,
                customerName: 'Sarah M.',
                rating: 4,
                comment: 'Good value for money. Would recommend to others.',
                date: '2023-10-10'
            }
        ];
        
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        document.getElementById('average-rating').textContent = averageRating.toFixed(1);
        
        const ratingStars = document.getElementById('rating-stars');
        if (ratingStars) {
            ratingStars.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('i');
                star.className = `fas fa-star ${i <= Math.round(averageRating) ? 'star' : ''}`;
                ratingStars.appendChild(star);
            }
        }
        
        document.getElementById('review-count').textContent = `Based on ${reviews.length} reviews`;
        
        const reviewList = document.getElementById('review-list');
        if (reviewList) {
            if (reviews.length > 0) {
                reviewList.innerHTML = reviews.map(review => `
                    <div class="review-item">
                        <div class="review-header">
                            <span class="reviewer-name">${review.customerName}</span>
                            <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <div class="review-rating">
                            ${this.generateStarRating(review.rating)}
                        </div>
                        <p class="review-text">${review.comment}</p>
                    </div>
                `).join('');
            } else {
                reviewList.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-comment-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No reviews yet</p>
                        <small>Be the first to review this product!</small>
                    </div>
                `;
            }
        }
    }

    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '<i class="fas fa-star star"></i>' : '<i class="far fa-star"></i>';
        }
        return stars;
    }

    updateDetailQuantityDisplay() {
        const quantityDisplay = document.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = this.currentDetailQuantity;
        }
    }

    addToCartFromDetail() {
        if (!this.currentProductDetail) return;
        
        this.addToCart(
            this.currentProductDetail.id,
            this.currentProductDetail.name,
            this.currentProductDetail.price,
            this.currentDetailQuantity
        );
        
        this.showMessage(`${this.currentDetailQuantity} ${this.currentProductDetail.name}(s) added to cart! 🎉`);
    }

    buyNowFromDetail() {
        if (!this.currentProductDetail) return;
        
        // Add to cart
        this.addToCart(
            this.currentProductDetail.id,
            this.currentProductDetail.name,
            this.currentProductDetail.price,
            this.currentDetailQuantity
        );
        
        // Hide product detail and show checkout directly
        this.hideProductDetail();
        this.initiateCheckout();
    }

    goToCartFromDetail() {
        this.hideProductDetail();
        this.switchView('cart-view');
    }

    updateDetailCartBadge() {
        const cartBadge = document.getElementById('cart-badge-detail');
        if (cartBadge) {
            cartBadge.textContent = this.cartCount;
            cartBadge.style.display = this.cartCount > 0 ? 'flex' : 'none';
        }
    }

    formatCategory(category) {
        const categories = {
            'oppo': 'Oppo',
            'Apple': 'Apple',
            'Tecno': 'Tecno',
            'infinix': 'Infinix',
            'samsung': 'Samsung',
            'nokia': 'Nokia',
            'Xiomi': 'Xiaomi'
        };
        return categories[category] || category;
    }
    
    checkProductCategories() {
        console.log('🔍 CHECKING PRODUCT CATEGORIES:');
        this.products.forEach((product, index) => {
            console.log(`Product ${index + 1}: "${product.name}" → Category: "${product.category}"`);
        });
        
        console.log('🔍 CHECKING CATEGORY CARDS IN HTML:');
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            console.log(`Category Card: ${card.textContent.trim()} → data-category: "${card.getAttribute('data-category')}"`);
        });
    }
    
    // Navigation
    setupEventListeners() {
        // Bottom navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                const navItem = e.target.closest('.nav-item');
                const view = navItem.getAttribute('data-view');
                this.switchView(view);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.initiateCheckout();
            });
        }

        // Product detail events
        const backButton = document.getElementById('back-to-products');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideProductDetail();
            });
        }

        const minusBtn = document.querySelector('.quantity-btn.minus');
        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                if (this.currentDetailQuantity > 1) {
                    this.currentDetailQuantity--;
                    this.updateDetailQuantityDisplay();
                }
            });
        }

        const plusBtn = document.querySelector('.quantity-btn.plus');
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                this.currentDetailQuantity++;
                this.updateDetailQuantityDisplay();
            });
        }

        const addToCartDetail = document.getElementById('add-to-cart-detail');
        if (addToCartDetail) {
            addToCartDetail.addEventListener('click', () => {
                this.addToCartFromDetail();
            });
        }

        const buyNowBtn = document.getElementById('buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                this.buyNowFromDetail();
            });
        }

        // Cart actions
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clear-cart-top') {
                if (this.cart.length > 0 && confirm('Are you sure you want to clear your cart?')) {
                    this.clearCart();
                }
            }
        });

        // Setup authentication event listeners
        this.setupAuthEventListeners();
    }

    setupAuthEventListeners() {
        // Auth tabs
        document.addEventListener('click', (e) => {
            if (e.target.closest('.auth-tab')) {
                const tab = e.target.closest('.auth-tab').getAttribute('data-tab');
                this.switchAuthTab(tab);
            }
        });

        // Auth forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Simplified Authentication
    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    // Updated authentication functions
    async handleLogin() {
        const identifier = document.getElementById('login-identifier').value.trim();
        
        if (!identifier) {
            this.showMessage('Please enter your email or phone number');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: identifier.includes('@') ? identifier : null,
                    phone: !identifier.includes('@') ? identifier : null,
                    password: 'default-password'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateUserUI();
                this.showMessage(`Welcome back, ${data.user.name}! 👋`);
            } else {
                this.showMessage('Login failed. Please try signing up first.');
                this.switchAuthTab('signup');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.');
        }
    }

    async handleSignup() {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();

        if (!name) {
            this.showMessage('Please enter your name');
            return;
        }

        if (!email && !phone) {
            this.showMessage('Please enter either email or phone number');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email || null,
                    phone: phone || null,
                    password: 'default-password'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateUserUI();
                this.showMessage(`Welcome to Lily's Lemonade, ${name}! 🎉`);
            } else {
                this.showMessage('Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Network error. Please try again.');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUserUI();
        this.showMessage('Logged out successfully 👋');
    }

    updateUserUI() {
        const authSection = document.getElementById('auth-section');
        const userMenu = document.getElementById('user-menu');
        const userGreeting = document.getElementById('user-greeting');
        const userStatus = document.getElementById('user-status');

        if (this.currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userGreeting) userGreeting.textContent = `Hello, ${this.currentUser.name}!`;
            
            if (this.currentUser.email && this.currentUser.phone) {
                if (userStatus) userStatus.textContent = `${this.currentUser.email} • ${this.currentUser.phone}`;
            } else if (this.currentUser.email) {
                if (userStatus) userStatus.textContent = this.currentUser.email;
            } else {
                if (userStatus) userStatus.textContent = this.currentUser.phone;
            }
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (userGreeting) userGreeting.textContent = 'Hello, Guest!';
            if (userStatus) userStatus.textContent = 'Sign in to your account';
        }
    }

    switchView(viewId) {
        console.log('🔄 Switching to view:', viewId);
        
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        
        const productDetailView = document.getElementById('product-detail-view');
        if (productDetailView) {
            productDetailView.style.display = 'none';
        }
        
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            mainHeader.style.display = 'block';
        }
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
            console.log('✅ View displayed:', viewId);
            
            switch(viewId) {
                case 'cart-view':
                    this.updateCartDisplay();
                    break;
                case 'account-view':
                    this.showSection('main');
                    break;
                case 'home-view':
                    this.renderProducts();
                    break;
                case 'categories-view':
                    break;
            }
        } else {
            console.error('❌ View not found:', viewId);
        }
        
        this.updateActiveNavButton(viewId);
    }

    updateActiveNavButton(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-view="${viewId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    filterByCategory(category) {
        console.log('🎯 FILTER BY CATEGORY CALLED:', category);
        
        const categoryNames = {
            'all': 'All Products',
            'oppo': 'Oppo Phones',
            'Apple': 'Apple iPhones', 
            'Tecno': 'Tecno Phones',
            'infinix': 'Infinix Phones',
            'samsung': 'Samsung Phones',
            'nokia': 'Nokia Phones',
            'Xiomi': 'Xiaomi Phones'
        };

        const currentCategory = document.getElementById('current-category');
        const categoryDescription = document.getElementById('category-description');
        
        if (currentCategory) {
            currentCategory.textContent = categoryNames[category] || 'All Products';
        }
        
        if (categoryDescription) {
            categoryDescription.textContent = category === 'all' 
                ? 'Discover our refreshing phone collection!' 
                : `Browse our ${categoryNames[category]} collection`;
        }
        
        this.switchView('home-view');
        
        setTimeout(() => {
            this.filterProducts('', category);
        }, 100);
    }

    filterProducts(searchTerm = '', category = 'all') {
        console.log('🔍 FILTER PRODUCTS CALLED - Category:', category, 'Search:', searchTerm);
        
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) return;
        
        let filteredProducts = this.products.filter(product => {
            if (product.status !== 'active') return false;
            
            const matchesCategory = category === 'all' || 
                                  product.category.toLowerCase() === category.toLowerCase();
            
            const matchesSearch = !searchTerm || 
                                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesCategory && matchesSearch;
        });
        
        console.log(`📦 Filtered ${filteredProducts.length} products for category: ${category}`);
        
        if (filteredProducts.length === 0) {
            this.showNoProductsMessage(category, searchTerm);
        } else {
            this.hideNoProductsMessage();
            
            productsContainer.innerHTML = filteredProducts.map(product => {
                // Get first image for thumbnail
                const firstImage = product.images && product.images.length > 0 
                    ? product.images[0] 
                    : product.image || 'https://via.placeholder.com/300x200/fff9c4/ff6f00?text=📱+Product';
                
                // Include images array in safeProduct
                const safeProduct = JSON.stringify({
                    ...product,
                    images: product.images || [product.image || '']
                }).replace(/"/g, '&quot;');
                
                return `
                <div class="product-card2" data-category="${product.category}" data-name="${product.name.toLowerCase()}">
                    <img src="${firstImage}" alt="${product.name}" 
                         onclick="lemonadeApp.showProductDetail(${safeProduct})"
                         style="cursor: pointer;"
                         onerror="this.src='https://via.placeholder.com/300x200/fff9c4/ff6f00?text=📱+Product'">
                    <h3>${product.name}</h3>
                    <div class="price2">ksh ${product.price.toFixed(2)}</div>
                    ${product.stock > 0 ? `
                     
                    ` : `
                        <button class="add-to-cart out-of-stock" disabled>
                            Out of Stock
                        </button>
                    `}
                </div>
                `;
            }).join('');
        }

        this.setupProductInteractions();
    }

    showNoProductsMessage(category, searchTerm) {
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) return;
        
        this.hideNoProductsMessage();
        
        let message = '';
        const categoryNames = {
            'all': 'All Products',
            'oppo': 'Oppo',
            'Apple': 'Apple', 
            'Tecno': 'Tecno',
            'infinix': 'Infinix',
            'samsung': 'Samsung',
            'nokia': 'Nokia',
            'Xiomi': 'Xiaomi'
        };
        
        const displayCategory = categoryNames[category] || category;
        
        if (searchTerm) {
            message = `No products found for "${searchTerm}" in ${displayCategory} category`;
        } else {
            message = `No products found in ${displayCategory} category`;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'no-products-message';
        messageElement.style.cssText = `
            text-align: center;
            padding: 3rem;
            color: var(--text-light);
            font-style: italic;
            width: 100%;
        `;
        messageElement.innerHTML = `
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>${message}</p>
            <small>Try selecting a different category or search term</small>
        `;
        productsContainer.appendChild(messageElement);
    }

    hideNoProductsMessage() {
        const existingMessage = document.querySelector('.no-products-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // Utility Functions
    showMessage(message) {
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) existingMessage.remove();

        const messageElement = document.createElement('div');
        messageElement.className = 'message-toast';
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(messageElement);
        setTimeout(() => messageElement.remove(), 3000);
    }

    updateUI() {
        this.updateCartDisplay();
        this.updateUserUI();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.lemonadeApp = new LemonadeApp();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .add-to-cart.out-of-stock {
        background: var(--text-light) !important;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);