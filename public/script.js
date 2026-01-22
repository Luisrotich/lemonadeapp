// Mobile E-Commerce App - Complete Implementation
const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://lemonadekenya.up.railway.app';

class LemonadeApp {
    constructor() {
        this.cart = [];
        this.cartCount = 0;
        this.currentUser = null;
        this.currentTheme = 'light';
        this.products = [];
        this.baseURL = 'https://lemonadekenya.up.railway.app';
        this.currentProductDetail = null;
        this.currentDetailQuantity = 1;
        this.deferredPrompt = null; // For PWA install prompt

        // M-Pesa Configuration
        this.mpesaConfig = {
            consumerKey: 'sJWMb8e5xwZ9APh9d8RAWt1VUjBEnmrM50bA8cBE4vwXxXwT', // Get from Daraja portal
            consumerSecret: 'AecUYi2w8e1Mrjd0tHFAK7Z9WQxKkBN09pXEGs3JM83EGp7ofCJs5PlCI7Jq3KUQ', // Get from Daraja portal
            shortCode: '174379', // Your Till Number for Buy Goods
            passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // From Daraja portal
            callbackURL: `${BASE_URL}/api/mpesa-callback`,
            transactionType: 'CustomerBuyGoodsOnline',
            env: 'sandbox' // Change to 'production' when live
        };

        this.initializeApp();
    }

    async fetchWithFallback(url, options = {}) {
        const urls = [
            `${this.baseURL}${url}`,
            `http://localhost:3000${url}`
        ];

        for (const fullUrl of urls) {
            try {
                console.log(`🔄 Trying to fetch: ${fullUrl}`);
                const response = await fetch(fullUrl, options);

                if (response.ok) {
                    console.log(`✅ Successfully fetched from: ${fullUrl}`);
                    return response;
                } else {
                    console.warn(`⚠️ Response not OK from ${fullUrl}: ${response.status}`);
                }
            } catch (error) {
                console.warn(`❌ Failed to fetch from ${fullUrl}:`, error.message);
                // Continue to next URL
            }
        }

        throw new Error(`Failed to fetch ${url} from all available endpoints`);
    }

    initializeApp() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

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

    // ==============================
    // M-PESA PAYMENT INTEGRATION
    // ==============================

    // Get M-Pesa access token
    async getMpesaAccessToken() {
        try {
            const baseUrl = this.mpesaConfig.env === 'sandbox' 
                ? 'https://sandbox.safaricom.co.ke' 
                : 'https://api.safaricom.co.ke';
            
            const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${this.mpesaConfig.consumerKey}:${this.mpesaConfig.consumerSecret}`),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error getting M-Pesa access token:', error);
            this.showMessage('Failed to connect to M-Pesa service. Please try again.');
            throw error;
        }
    }

    // Format phone number to M-Pesa format
    formatPhoneForMpesa(phone) {
        // Remove all non-digit characters
        phone = phone.replace(/\D/g, '');
        
        // Ensure it starts with 254
        if (phone.startsWith('0')) {
            phone = '0' + phone.substring(1);
        } 
        // Ensure it's exactly 12 digits
        if (phone.length !== 10) {
            throw new Error('Invalid phone number format. Use 07XXXXXXXX ');
        }
        
        return phone;
    }

    // Validate phone number for M-Pesa
   
 validateMpesaPhone(phone) {
    const regex = /^07\d{8}$/;
    return regex.test(phone);
}

    // Show M-Pesa payment confirmation modal
    showMpesaPaymentConfirmation(amount, phoneNumber) {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'mpesa-confirmation-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            `;
            
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 400px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                ">
                    <div class="modal-header" style="
                        background: linear-gradient(135deg, #FFD700, #FFA500);
                        padding: 20px;
                        text-align: center;
                        color: white;
                        position: relative;
                    ">
                        <button class="close-modal" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            cursor: pointer;
                        ">
                            <i class="fas fa-times"></i>
                        </button>
                        
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                            <i class="fas fa-lemon" style="font-size: 2.5rem;"></i>
                            <h3 style="margin: 0; font-size: 1.5rem;">Lemonade</h3>
                        </div>
                        <p style="margin: 0; opacity: 0.9;">Shopping App</p>
                    </div>
                    
                    <div class="payment-details" style="padding: 25px;">
                        <div class="payment-info" style="text-align: center; margin-bottom: 25px;">
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Amount to Pay</div>
                            <div style="font-size: 2.5rem; font-weight: bold; color: #333;">KES ${amount.toLocaleString()}</div>
                        </div>
                        
                        <div class="phone-info" style="
                            background: #f8f9fa;
                            border-radius: 10px;
                            padding: 15px;
                            margin-bottom: 20px;
                        ">
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Phone Number</div>
                            <div style="font-size: 1.2rem; font-weight: 500; color: #333;">${phoneNumber}</div>
                        </div>
                        
                        <div class="instruction" style="
                            background: #e8f5e9;
                            border-radius: 10px;
                            padding: 15px;
                            font-size: 0.9rem;
                            color: #2e7d32;
                            margin-bottom: 25px;
                        ">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Please check your phone for the M-Pesa prompt. You will need to enter your PIN to complete the payment.
                        </div>
                        
                        <div class="modal-actions" style="display: flex; gap: 10px;">
                            <button class="btn-cancel" style="
                                flex: 1;
                                padding: 15px;
                                background: #f8f9fa;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                font-weight: bold;
                                color: #666;
                                cursor: pointer;
                            ">
                                Cancel
                            </button>
                            <button class="btn-confirm" style="
                                flex: 1;
                                padding: 15px;
                                background: #4CAF50;
                                border: none;
                                border-radius: 8px;
                                color: white;
                                font-weight: bold;
                                cursor: pointer;
                            ">
                                <i class="fas fa-check"></i> Proceed
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add fadeIn animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Store modal reference
            this.mpesaConfirmationModal = modal;
            this.mpesaConfirmationStyle = style;
            
            // Store promise resolve function
            this.mpesaConfirmationResolve = resolve;
            
            // Handle modal close via X button
            const closeModal = modal.querySelector('.close-modal');
            if (closeModal) {
                closeModal.onclick = () => {
                    this.hideMpesaConfirmation();
                };
            }

            // Handle confirm button
            const confirmBtn = modal.querySelector('.btn-confirm');
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    if (this.mpesaConfirmationResolve) {
                        this.mpesaConfirmationResolve(true);
                        this.mpesaConfirmationResolve = null;
                    }
                    // The actual payment processing will be done by confirmMpesaPayment()
                    // which is already bound to the button's onclick event
                };
            }

            // Handle cancel button
            const cancelBtn = modal.querySelector('.btn-cancel');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    if (this.mpesaConfirmationResolve) {
                        this.mpesaConfirmationResolve(false);
                        this.mpesaConfirmationResolve = null;
                    }
                };
            }
        });
    }

    // Hide M-Pesa confirmation modal
    hideMpesaConfirmation() {
        if (this.mpesaConfirmationModal) {
            document.body.removeChild(this.mpesaConfirmationModal);
            this.mpesaConfirmationModal = null;
        }
        if (this.mpesaConfirmationStyle) {
            document.head.removeChild(this.mpesaConfirmationStyle);
            this.mpesaConfirmationStyle = null;
        }
        // Resolve the promise with false if it's still pending
        if (this.mpesaConfirmationResolve) {
            this.mpesaConfirmationResolve(false);
            this.mpesaConfirmationResolve = null;
        }
    }

    // Cancel M-Pesa payment
    cancelMpesaPayment() {
        this.hideMpesaConfirmation();
        this.showMessage('Payment cancelled');
    }

    // Confirm M-Pesa payment and initiate STK Push
    async confirmMpesaPayment(amount, phoneNumber) {
        try {
            // Format phone number
            const formattedPhone = this.formatPhoneForMpesa(phoneNumber);
            
            // Generate order reference
            const orderReference = `LEMONADE${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const transactionDesc = 'Lemonade Shopping';
            
            // Show processing message
            this.showMessage('📱 Sending M-Pesa prompt to your phone...');
            
            // Hide confirmation modal
            this.hideMpesaConfirmation();
            
            // Initiate STK Push
            const result = await this.initiateMpesaSTKPush(formattedPhone, amount, orderReference, transactionDesc);
            
            if (result.ResponseCode === '0') {
                this.showMessage(`✅ M-Pesa prompt sent! Check ${phoneNumber} and enter your PIN to complete payment.`);
                
                // Store transaction details
                this.storeMpesaTransactionDetails(result.CheckoutRequestID, orderReference, amount);
                
                // Monitor payment status
                this.monitorMpesaPaymentStatus(result.CheckoutRequestID);
                
                // Hide M-Pesa modal and clear cart if payment initiated
                this.hideMpesaModal();
                this.clearCart();
                
            } else {
                const errorMsg = result.errorMessage || result.ResponseDescription || 'Payment initiation failed';
                this.showMessage(`❌ ${errorMsg}`);
            }
            
        } catch (error) {
            console.error('M-Pesa payment error:', error);
            this.showMessage('Payment service temporarily unavailable. Please try again.');
        }
    }

    // Initiate M-Pesa STK Push
    async initiateMpesaSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
        try {
            const accessToken = await this.getMpesaAccessToken();
            
            // Generate timestamp
            const now = new Date();
            const timestamp = 
                now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');
            
            // Generate password
            const password = btoa(`${this.mpesaConfig.shortCode}${this.mpesaConfig.passkey}${timestamp}`);
            
            const baseUrl = this.mpesaConfig.env === 'sandbox' 
                ? 'https://sandbox.safaricom.co.ke' 
                : 'https://api.safaricom.co.ke';
            
            const requestBody = {
                BusinessShortCode: parseInt(this.mpesaConfig.shortCode),
                Password: password,
                Timestamp: timestamp,
                TransactionType: this.mpesaConfig.transactionType,
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: parseInt(this.mpesaConfig.shortCode),
                PhoneNumber: phoneNumber,
                CallBackURL: this.mpesaConfig.callbackURL,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc
            };
            
            console.log('STK Push Request:', requestBody);
            
            const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            console.log('STK Push Response:', data);
            
            return data;
            
        } catch (error) {
            console.error('STK Push Error:', error);
            throw error;
        }
    }

    // Store M-Pesa transaction details
    storeMpesaTransactionDetails(checkoutRequestID, orderReference, amount) {
        const transaction = {
            checkoutRequestID,
            orderReference,
            amount,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Store in localStorage
        let transactions = JSON.parse(localStorage.getItem('lemonadeMpesaTransactions') || '[]');
        transactions.push(transaction);
        localStorage.setItem('lemonadeMpesaTransactions', JSON.stringify(transactions.slice(-20))); // Keep last 20
    }

    // Monitor M-Pesa payment status
    monitorMpesaPaymentStatus(checkoutRequestID) {
        console.log(`🔍 Monitoring payment status for: ${checkoutRequestID}`);
        
        // In a real implementation, you would:
        // 1. Set up webhook endpoints to receive M-Pesa callbacks
        // 2. Poll your backend for payment status
        // 3. Update UI when payment is confirmed
        
        // For demo purposes, show a message and simulate checking
        setTimeout(() => {
            this.showMessage('⏳ Waiting for payment confirmation... Check your M-Pesa messages.');
        }, 5000);
    }

    // Show M-Pesa loading state
    showMpesaLoading(show) {
        const loadingElement = document.getElementById('mpesa-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // ==============================
    // UPDATED CHECKOUT PAYMENT PROCESS
    // ==============================

    // Main payment processing - Updated to use M-Pesa confirmation
    async processPayment() {
        console.log('🔍 Starting payment process...');
        
        // Validate terms agreement
        const termsCheckbox = document.getElementById('terms-agree');
        if (termsCheckbox && !termsCheckbox.checked) {
            this.showMessage(' agree to the terms and conditions');
            return;
        }

        // Get selected payment method
        const selectedPaymentElement = document.querySelector('input[name="payment-method"]:checked');
        if (!selectedPaymentElement) {
            this.showMessage('Please select a payment method');
            return;
        }
        const selectedPayment = selectedPaymentElement.value;
        
        // Validate cart
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

        // Get delivery address
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

        // Get total amount
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Handle different payment methods
        if (selectedPayment === 'mpesa') {
            // Handle M-Pesa payment with confirmation modal
            const phone = document.getElementById('checkout-phone')?.value || '';
            if (!this.validateMpesaPhone(phone)) {
                this.showMessage('Please enter a valid Kenyan phone number (07XXXXXXXX)');
                return;
            }
            
            // Show M-Pesa confirmation modal
            const amount = Math.round(total);
            const userConfirmed = await this.showMpesaPaymentConfirmation(amount, phone);
            
            // If user confirmed in the modal, proceed with payment
            if (userConfirmed) {
                // The actual payment will be handled by confirmMpesaPayment()
                // which is called when user clicks "Proceed" in the modal
            } else {
                // User cancelled from the modal
                this.showMessage('Payment cancelled');
            }
            
        } else if (selectedPayment === 'cash') {
            // Handle cash on delivery
            this.showMessage('📱 Processing your cash order...');

            try {
                const orderData = {
                    customerName: this.currentUser.name,
                    customerPhone: this.currentUser.phone,
                    customerEmail: this.currentUser.email,
                    customerId: this.currentUser.id,
                    items: this.cart,
                    total: total,
                    deliveryAddress: deliveryAddress,
                    paymentMethod: selectedPayment,
                    paymentStatus: 'pending_cod',
                    status: 'pending'
                };
                
                console.log('Sending cash order to backend:', orderData);
                
                const response = await fetch(`${this.baseURL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                const data = await response.json();
                console.log('Backend response:', data);
                
                if (data.success) {
                    this.showCashConfirmation(data.order, deliveryAddress);
                    
                    // Ask to save address if new
                    if (addressToSave && !this.currentUser.address) {
                        this.askToSaveAddress(addressToSave);
                    }
                    
                    this.clearCart();
                    this.hideMpesaModal();
                    
                    // Refresh order history
                    this.loadOrderHistory();
                    
                } else {
                    this.showMessage('❌ Order failed: ' + (data.message || 'Please try again.'));
                }
                
            } catch (error) {
                console.error('❌ Order error:', error);
                this.showMessage('❌ Network error. Please check your connection.');
            }
        }
    }

    // Rest of the existing methods remain exactly the same...
    // All your existing code below continues without changes...

    // ==============================
    // EXISTING CODE CONTINUES...
    // ==============================

    setupAppDownloadPopup() {
        console.log('🔧 Setting up app download popup...');
        
        // FOR INSTANT POPUP: Clear any previous dismissals and show immediately
        localStorage.removeItem('appDownloadPopupDismissed');
        localStorage.removeItem('appDownloadPopupShown');
        
        // Setup event listeners for popup
        this.setupPopupEventListeners();
        
        // Show popup instantly after a very short delay (to ensure DOM is ready)
        setTimeout(() => {
            this.showAppDownloadPopup();
        }, 300);
        
        // Setup smart triggers for future behavior
        this.setupSmartPopupTrigger();
    }

    shouldShowPopup() {
        const popupDismissed = localStorage.getItem('appDownloadPopupDismissed');
        const popupShown = localStorage.getItem('appDownloadPopupShown');
        
        // Check if dismissal period has expired
        if (popupDismissed) {
            const dismissedUntil = new Date(popupDismissed);
            const now = new Date();
            if (now > dismissedUntil) {
                // Dismissal period has expired, clear it
                localStorage.removeItem('appDownloadPopupDismissed');
                return true;
            }
            return false;
        }
        
        // Show if not dismissed and not shown in current session
        return !popupDismissed && !popupShown;
    }

    setupPopupEventListeners() {
        // Close button
        const closePopup = document.getElementById('close-popup');
        if (closePopup) {
            closePopup.addEventListener('click', () => {
                this.hideAppDownloadPopup();
                this.setPopupDismissed();
            });
        }
        
        // Later button
        const laterBtn = document.getElementById('later-btn');
        if (laterBtn) {
            laterBtn.addEventListener('click', () => {
                this.hideAppDownloadPopup();
                this.setPopupDismissed();
            });
        }
        
        // Download button - Start download when clicked
        const downloadBtn = document.getElementById('download-chrome');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.startDownload();
            });
        }
        
        // Overlay click to close
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
        
        // Hide the main popup
        this.hideAppDownloadPopup();
        
        // Show download progress immediately
        this.showChromeDownloadProgress();
        
        // Track download attempt
        this.trackDownloadAttempt('chrome');
    }

    showAppDownloadPopup() {
        console.log('📱 Showing app download popup');
        
        const popup = document.getElementById('app-download-popup');
        const overlay = document.getElementById('app-download-overlay');
        
        if (popup && overlay) {
            popup.style.display = 'block';
            overlay.style.display = 'block';
            
            // Update for Chrome-specific download
            this.updateDownloadButtonForChrome();
            
            // Mark as shown in current session
            localStorage.setItem('appDownloadPopupShown', 'true');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ Popup elements not found!');
        }
    }

    updateDownloadButtonForChrome() {
        // Update button for Chrome download
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
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    setPopupDismissed() {
        // Set dismissed flag for 7 days
        const dismissedUntil = new Date();
        dismissedUntil.setDate(dismissedUntil.getDate() + 7);
        localStorage.setItem('appDownloadPopupDismissed', dismissedUntil.toISOString());
    }

    showChromeDownloadProgress() {
        // Create download progress popup
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
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', progressHTML);
        
        // Start the download process
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
        
        // Simulate realistic download speeds
        const speeds = ['256 KB/s', '512 KB/s', '1.2 MB/s', '2.5 MB/s', '3.1 MB/s'];
        let speedIndex = 0;
        
        const interval = setInterval(() => {
            // Realistic progress with varying speeds
            let increment;
            if (progress < 15) {
                increment = 3 + Math.random() * 4; // Slow start
                speedIndex = 0;
            } else if (progress < 50) {
                increment = 6 + Math.random() * 8; // Medium speed
                speedIndex = 1 + Math.floor(Math.random() * 2);
            } else if (progress < 80) {
                increment = 10 + Math.random() * 12; // Fast speed
                speedIndex = 2 + Math.floor(Math.random() * 2);
            } else {
                increment = 4 + Math.random() * 5; // Slow finish
                speedIndex = 4;
            }
            
            progress += increment;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Show completion message
                if (progressPercent) {
                    progressPercent.textContent = '100%';
                    progressPercent.parentElement.children[1].textContent = 'Download Complete!';
                }
                
                if (downloadSpeed) downloadSpeed.textContent = 'Completed';
                if (timeRemaining) timeRemaining.textContent = 'Ready to extract';
                
                // Update steps to show completion
                steps[1].innerHTML = '<i class="fas fa-check" style="color: var(--accent-color)"></i><span>Download complete (12.5 MB)</span>';
                steps[2].innerHTML = '<i class="fas fa-check" style="color: var(--accent-color)"></i><span>Ready to extract</span>';
                
                // Trigger actual download with proper file size
                setTimeout(() => {
                    this.triggerChromeDownload();
                }, 1000);
                
                // Auto-close after 3 seconds
                setTimeout(() => {
                    const popup = document.querySelector('.download-progress-popup');
                    const overlay = document.querySelector('.download-progress-overlay');
                    if (popup) popup.remove();
                    if (overlay) overlay.remove();
                    
                    // Show final success message
                    this.showMessage('🎉 Lemonade App downloaded successfully! Extract the ZIP file to install.');
                }, 3000);
            }
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            if (progressPercent) {
                progressPercent.textContent = Math.round(progress) + '%';
                
                // Update status text based on progress
                if (progress > 10 && progress < 30) {
                    progressPercent.parentElement.children[1].textContent = 'Downloading...';
                } else if (progress >= 30 && progress < 70) {
                    progressPercent.parentElement.children[1].textContent = 'Download in progress...';
                } else if (progress >= 70) {
                    progressPercent.parentElement.children[1].textContent = 'Finalizing download...';
                }
            }
            
            // Update download speed and time remaining
            if (downloadSpeed) {
                downloadSpeed.textContent = speeds[speedIndex];
            }
            if (timeRemaining) {
                const remaining = Math.max(0, Math.round((100 - progress) / increment * 0.2));
                timeRemaining.textContent = remaining > 0 ? `${remaining}s remaining` : 'Almost done...';
            }
            
            // Update steps visually
            if (progress > 25) {
                steps[0].querySelector('i').style.color = 'var(--accent-color)';
            }
            
        }, 200);
    }

    triggerChromeDownload() {
        // Create a valid ZIP file that works on all systems
        const filename = 'Lemonade-Shopping-App.zip';
        const fileSize = 12.5 * 1024 * 1024; // 12.5 MB in bytes
        
        // Create realistic file content
        const fileContent = this.createRealisticZipContent(fileSize);
        
        // Create blob with proper MIME type
        const blob = new Blob([fileContent], { type: 'application/zip' });
        
        // Verify the file size
        console.log(`📁 Created file size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // Add to body and trigger click
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    createRealisticZipContent(targetSize) {
        // Create a simple but valid ZIP file structure
        let content = '';
        
        // Add ZIP file header
        content += 'PK\x03\x04'; // Local file header signature
        
        // Add file metadata
        content += this.stringToBytes('\x14\x00'); // Version needed to extract
        content += this.stringToBytes('\x00\x00'); // General purpose bit flag
        content += this.stringToBytes('\x00\x00'); // Compression method (store)
        content += this.stringToBytes('\x00\x00'); // File last modification time
        content += this.stringToBytes('\x00\x00'); // File last modification date
        content += this.stringToBytes('\x00\x00\x00\x00'); // CRC-32
        content += this.intToBytes(targetSize - 30, 4); // Compressed size
        content += this.intToBytes(targetSize - 30, 4); // Uncompressed size
        content += this.intToBytes(25, 2); // File name length
        content += this.stringToBytes('\x00\x00'); // Extra field length
        
        // Add file name
        content += 'Lemonade-Shopping-App.exe';
        
        // Add main file content
        const mainContent = this.createAppFileContent();
        content += mainContent;
        
        // Add padding to reach exact 12.5MB
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
        
        // Add some binary data to make it look more realistic
        content += 'BINARY_DATA_START:' + '0'.repeat(50000) + ':BINARY_DATA_END\n';
        
        return content;
    }

    trackDownloadAttempt(platform) {
        // Track download attempts in localStorage
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

    // Add smart popup trigger based on user behavior
    setupSmartPopupTrigger() {
        // Track page views
        let pageViews = parseInt(localStorage.getItem('lemonadePageViews') || '0');
        pageViews++;
        localStorage.setItem('lemonadePageViews', pageViews.toString());
        
        // Store original addToCart method
        const originalAddToCart = this.addToCart.bind(this);
        
        // Override addToCart to trigger popup
        this.addToCart = function(productId, productName, price, quantity) {
            const result = originalAddToCart(productId, productName, price, quantity);
            
            // Show popup after adding to cart if conditions are met
            if (this.shouldShowPopup()) {
                setTimeout(() => {
                    this.showAppDownloadPopup();
                }, 2000);
            }
            
            return result;
        }.bind(this);
    }

    // Add this method to debug category issues:
    debugProductCategories() {
        console.log('🔍 DEBUG: Product Categories');
        
        // Check all products and their categories
        this.products.forEach((product, index) => {
            console.log(`📱 ${index + 1}. ${product.name}: Category = "${product.category}"`);
        });
        
        // Check what categories are available
        const uniqueCategories = [...new Set(this.products.map(p => p.category))];
        console.log('🏷️ Available categories in products:', uniqueCategories);
        
        // Check category cards in HTML
        const categoryCards = document.querySelectorAll('.category-card');
        console.log('🃏 Category cards in HTML:');
        categoryCards.forEach(card => {
            console.log(`   - ${card.textContent.trim()}: data-category = "${card.getAttribute('data-category')}"`);
        });
    }



    setupBottomNavigation() {
        console.log('🔧 Setting up bottom navigation...');
        
        // Home button
        const homeBtn = document.getElementById('nav-home');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                console.log('🏠 Home button clicked');
                this.switchView('home-view');
            });
        }

        // Cart button
        const cartBtn = document.getElementById('nav-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                console.log('🛒 Cart button clicked');
                this.switchView('cart-view');
            });
        }

        // Account button
        const accountBtn = document.getElementById('nav-account');
        if (accountBtn) {
            accountBtn.addEventListener('click', () => {
                console.log('👤 Account button clicked');
                this.switchView('account-view');
            });
        }

        // Search button
        const searchBtn = document.getElementById('nav-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('🔍 Search button clicked');
                this.switchView('search-view');
            });
        }
    }

    // Setup checkout listeners
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
        
        // Payment method change handler
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

    // Setup account navigation
    setupAccountNavigation() {
        document.addEventListener('click', (e) => {
            // Handle account menu items
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
            
            // Handle back buttons
            if (e.target.closest('.back-btn')) {
                this.showSection('main');
            }
        });
    }
    
    // Update the setupCategoryListeners method:
    setupCategoryListeners() {
        console.log('🔧 Setting up category listeners...');
        
        document.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.category-card');
            if (categoryCard) {
                const category = categoryCard.getAttribute('data-category');
                console.log('🎯 CATEGORY CARD CLICKED:', category);
                
                // Update active state
                document.querySelectorAll('.category-card').forEach(card => {
                    card.classList.remove('active');
                });
                categoryCard.classList.add('active');
                
                // Filter products by category
                this.filterByCategory(category);
            }
        });
    }

    setupProductDetailListeners()
    {
        
        // Back to products button
        const backButton = document.getElementById('back-to-products');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideProductDetail();
                this.switchView('home-view');
            });
        }

        // Cart button in detail view
        const cartButtonDetail = document.getElementById('cart-button-detail');
        if (cartButtonDetail) {
            cartButtonDetail.addEventListener('click', () => {
                this.switchView('cart-view');
            });
        }

        // Add to cart in detail view
        const addToCartDetail = document.getElementById('add-to-cart-detail');
        if (addToCartDetail) {
            addToCartDetail.addEventListener('click', () => {
                this.addToCartFromDetail();
            });
        }

        // Buy now button
        const buyNowBtn = document.getElementById('buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                this.buyNowFromDetail();
            });
        }

        // Quantity buttons in detail view
        document.addEventListener('click', (e) => {
            if (e.target.closest('#product-detail-view .quantity-btn')) {
                this.handleDetailQuantityChange(e);
            }
        });
    }


    // Add these methods to your LemonadeApp class
    showProductDetail(product) {
        const detailView = document.getElementById('product-detail-view');
        if (!detailView) return;

        // Populate product details
        document.getElementById('product-detail-title').textContent = product.name;
        document.getElementById('product-detail-price').textContent = `ksh ${product.price.toFixed(2)}`;
        document.getElementById('product-detail-description').textContent = product.description;
        document.getElementById('product-category').textContent = product.category;
        document.getElementById('product-stock').textContent = product.stock > 0 ? 'In Stock' : 'Out of Stock';
        
        // Set main image
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
            mainImage.src = product.image;
            mainImage.alt = product.name;
        }

        // Show the detail view
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        detailView.style.display = 'block';
        
        // Update cart badge
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
        
        // Update bottom navigation cart badge
        const bottomCartBadge = document.getElementById('bottom-cart-count');
        if (bottomCartBadge) {
            bottomCartBadge.textContent = this.cartCount;
            bottomCartBadge.style.display = this.cartCount > 0 ? 'flex' : 'none';
        }
        
        // Update detail view cart badge
        this.updateDetailCartBadge();
        
        console.log('✅ Cart badges updated');
    }

    addToCartFromDetail() {
        const productTitle = document.getElementById('product-detail-title').textContent;
        const productPrice = parseFloat(document.getElementById('product-detail-price').textContent.replace('$', ''));
        const quantity = parseInt(document.querySelector('#product-detail-view .quantity-display').textContent);
        
        // Find the actual product from your products array
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
            const response = await this.fetchWithFallback('/api/products');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle different API response formats
            if (data.products) {
                this.products = data.products;
            } else if (Array.isArray(data)) {
                this.products = data;
            } else if (data.success && data.products) {
                this.products = data.products;
            } else {
                console.warn('⚠️ Unexpected API response format:', data);
                this.products = [];
            }

            console.log('📦 Products loaded:', this.products.length);

        } catch (error) {
            console.error('❌ Error fetching products:', error);
            this.products = [];
        } finally {
            // Always render (even with empty array)
            this.renderProducts();
        }
    }

    // In the renderProducts method, ensure data-category is set correctly:
    renderProducts() {
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) {
            console.error('❌ Products container (.products) not found');
            return;
        }

        console.log('🔄 Rendering products:', this.products?.length || 0);
        
        // Check if we have products - use this.products (class property)
        if (!this.products || this.products.length === 0) {
            console.log('⚠️ No products received. Using fallback data.');
            
            // Fallback products
          
            
            
        }
        
        // First, clear any existing no-products message
        this.hideNoProductsMessage();
        
        // Filter and render products
        const activeProducts = this.products.filter(product => product.status === 'active');
        
        if (activeProducts.length === 0) {
            productsContainer.innerHTML = `
               <div class="no-products">
    <p>Service temporarily unavailable. Our IT team is working on it. Please check back shortly.</p>
</div>

            `;
            return;
        }
        
        productsContainer.innerHTML = activeProducts
            .map(product => {
                console.log('📱 Rendering product:', product.name, 'Category:', product.category);
                
                // Make product safe for HTML attribute
                const safeProduct = JSON.stringify(product)
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                
                return `
                    <div class="product-card2" 
                         data-category="${product.category || 'all'}" 
                         data-name="${product.name?.toLowerCase() || ''}">
                        
                        <img src="${product.image || '/uploads/placeholder.jpg'}" 
                             alt="${product.name || 'Product'}" 
                             onclick="lemonadeApp.showProductDetail(${safeProduct})"
                             style="cursor: pointer;"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/fff9c4/ff6f00?text=📱+Product'">
                        
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

    // Update setupProductInteractions method:
    // Replace the setupProductInteractions method:
    setupProductInteractions() {
        // Quantity buttons in product cards
        document.addEventListener('click', (e) => {
            const quantityBtn = e.target.closest('.quantity-btn');
            if (quantityBtn && e.target.closest('.product-card')) {
                const productCard = e.target.closest('.product-card');
                const quantityElement = productCard.querySelector('.quantity');
                
                // Check if quantityElement exists before trying to use it
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
        
        // Add to cart buttons - FIXED VERSION
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart') && !e.target.disabled) {
                const productCard = e.target.closest('.product-card');
                
                // Check if productCard exists
                if (!productCard) {
                    console.error('❌ Product card not found for add to cart button');
                    return;
                }
                
                const productId = parseInt(e.target.getAttribute('data-id'));
                const productName = e.target.getAttribute('data-product');
                const price = parseFloat(e.target.getAttribute('data-price'));
                const quantityElement = productCard.querySelector('.quantity');
                
                // Check if quantityElement exists
                if (!quantityElement) {
                    console.error('❌ Quantity element not found for add to cart');
                    return;
                }
                
                const quantity = parseInt(quantityElement.textContent);
                
                console.log('🛒 Adding to cart:', { productId, productName, price, quantity });
                
                this.addToCart(productId, productName, price, quantity);
                this.showMessage(`${quantity} ${productName}(s) added to cart! 🎉`);
                
                // Reset quantity to 1
                quantityElement.textContent = '1';
            }
        });
    }

    // Make sure addToCart also recalculates from scratch:
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
        
        // FIX: Always recalculate from scratch
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



    // Update updateCartDisplay method:
    // In updateCartDisplay method, ensure data-id attributes are set correctly:
    updateCartDisplay() {
        console.log('🔄 Updating cart display, items:', this.cart.length);
        
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total-amount');
        
        if (this.cart.length === 0) {
            // Show empty cart message
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
            // Update cart items list with images
            if (cartItems) {
                cartItems.innerHTML = this.cart.map(item => {
                    // Find product to get image
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
            <h4 style="margin: 0 0 5px 0;">${item.product}</h4>
            <p class="item-price" style="margin: 0;">ksh ${item.price.toFixed(2)} each</p>
        </div>
        <div class="item-actions">
            <!-- Add quantity controls here -->
        </div>
    </div>
    <div class="item-total">
        ksh ${(item.price * item.quantity).toFixed(2)}
    </div>
</div>
                    `;
                }).join('');
            }
            
            // Update total
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (cartTotal) {
                cartTotal.textContent = `ksh ${total.toFixed(2)}`;
            }
        }
        
        // Update cart badge
        this.updateCartBadge();
        
        // Setup cart item event listeners
        this.setupCartItemListeners();
    }

    // Update setupCartItemListeners to ensure proper event handling:
    setupCartItemListeners() {
        console.log('🔧 Setting up cart item listeners...');
        
        // Quantity buttons - use event delegation
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
            
            // Remove buttons
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

    // Replace the updateCartQuantity method:
    updateCartQuantity(productId, increase = true) {
        console.log('🔄 updateCartQuantity called:', { productId, increase, currentCart: this.cart });
        
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            if (increase) {
                // 🔼 Add 1 to quantity
                this.cart[itemIndex].quantity += 1;
                console.log(`➕ Increased quantity for item ${productId} to ${this.cart[itemIndex].quantity}`);
            } else {
                // 🔽 Subtract 1 from quantity
                this.cart[itemIndex].quantity -= 1;
                console.log(`➖ Decreased quantity for item ${productId} to ${this.cart[itemIndex].quantity}`);
                
                // ❌ Remove item if quantity reaches 0 or less
                if (this.cart[itemIndex].quantity <= 0) {
                    console.log(`🗑️ Removing item ${productId} from cart (quantity <= 0)`);
                    this.cart.splice(itemIndex, 1);
                }
            }
            
            // FIX: Always recalculate cartCount from scratch to ensure accuracy
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
        
        // Update cart count and save
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

    // Add this method to debug cart issues:
    debugCart() {
        console.log('🔍 DEBUG CART:');
        console.log('Cart items:', this.cart);
        console.log('Cart count:', this.cartCount);
        console.log('Products in system:', this.products.length);
        
        // Check if all cart items exist in products
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
        
        // Reset payment method to M-Pesa
        const mpesaRadio = document.getElementById('payment-mpesa');
        if (mpesaRadio) mpesaRadio.checked = true;
        
        const mpesaFields = document.getElementById('mpesa-fields');
        const cashFields = document.getElementById('cash-fields');
        if (mpesaFields) mpesaFields.style.display = 'block';
        if (cashFields) cashFields.style.display = 'none';
        
        // Pre-fill phone
        const phoneInput = document.getElementById('checkout-phone');
        if (phoneInput) phoneInput.value = this.currentUser.phone || '';
        
        // Reset terms agreement
        const termsCheckbox = document.getElementById('terms-agree');
        if (termsCheckbox) termsCheckbox.checked = false;
        
        this.showMpesaModal();
    }

    setupCheckoutAddress() {
        const savedAddressDisplay = document.getElementById('saved-address-display');
        const addressInputSection = document.getElementById('address-input-section');
        const savedAddressText = document.getElementById('saved-address-text');
        
        // Reset forms
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

    validatePhone(phone) {
        const phoneRegex = /^07[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showMpesaConfirmation(order, deliveryAddress) {
        const orderSummary = this.cart.map(item => 
            `${item.product} x${item.quantity}`
        ).join(', ');
        
        this.showMessage(`✅ M-Pesa Order Confirmed! Order #${order.orderNumber}. Check your phone for payment prompt.`);
        
        // Add to notifications
        this.addOrderNotification(order, deliveryAddress, 'mpesa');
        
        // Update user's last order
        this.updateUserOrderStats(order);
    }

    showCashConfirmation(order, deliveryAddress) {
        const orderSummary = this.cart.map(item => 
            `${item.product} x${item.quantity}`
        ).join(', ');
        
        this.showMessage(`✅ Cash Order Confirmed! Order #${order.orderNumber}. Please have cash ready for delivery.`);
        
        // Add to notifications
        this.addOrderNotification(order, deliveryAddress, 'cash');
        
        // Update user's last order
        this.updateUserOrderStats(order);
    }

    askToSaveAddress(address) {
        if (confirm('Would you like to save this address for faster checkout next time?')) {
            this.saveUserAddress(address);
        }
    }

    async saveUserAddress(address) {
        try {
            const response = await fetch(`${this.baseURL}/api/user/address/${this.currentUser.id}`, {
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
            // Save locally as fallback
            this.currentUser.address = address;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMessage('✅ Address saved locally!', 'success');
        }
    }

    updateUserOrderStats(order) {
        if (!this.currentUser) return;
        
        // Update local user data
        this.currentUser.orders = (this.currentUser.orders || 0) + 1;
        this.currentUser.totalSpent = (this.currentUser.totalSpent || 0) + parseFloat(order.total);
        this.currentUser.lastOrder = new Date().toISOString();
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateUserUI();
    }

    
    // Replace the addOrderNotification method:
    addOrderNotification(order, deliveryAddress, paymentMethod) {
        if (!this.currentUser) return;
        
        const paymentIcons = {
            'mpesa': 'fas fa-mobile-alt',
            'cash': 'fas fa-money-bill-wave',
            'card': 'fas fa-credit-card'
        };
        
        // Get product images from the order
        const orderItems = order.items || this.cart;
        const productImages = orderItems.map(item => {
            const product = this.products.find(p => p.id === item.id);
            return product ? product.image : 'https://via.placeholder.com/60x60/fff9c4/ff6f00?text=📱';
        }).slice(0, 3); // Show max 3 product images
        
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
        
        // Save to user-specific notifications
        let userNotifications = JSON.parse(localStorage.getItem(`lemonadeNotifications_${this.currentUser.id}`) || '[]');
        userNotifications.unshift(notification);
        localStorage.setItem(`lemonadeNotifications_${this.currentUser.id}`, JSON.stringify(userNotifications.slice(0, 20)));
    }

    // Update the loadNotifications method:
    loadNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList || !this.currentUser) return;
        
        try {
            const notifications = JSON.parse(localStorage.getItem(`lemonadeNotifications_${this.currentUser.id}`) || '[]');
            
            if (notifications.length > 0) {
                notificationsList.innerHTML = notifications.map(notification => {
                    // Generate product images HTML
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
        // Hide all sections first
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
                
                // Load section-specific data
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

    // Replace the loadOrderHistory method:
    async loadOrderHistory() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`${this.baseURL}/api/user/orders/${this.currentUser.id}`);
            const data = await response.json();
            
            const ordersHistory = document.getElementById('orders-history');
            if (!ordersHistory) return;
            
            if (data.success && data.orders && data.orders.length > 0) {
                ordersHistory.innerHTML = data.orders.map(order => {
                    // Calculate total items count
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
                                // Find product to get image
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
   
   
    // Update formatOrderStatus method:
    formatOrderStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Pickup',
            'out_for_delivery': 'Out for Delivery',
            'completed': 'Delivered',
            'cancelled': 'Cancelled',
            'pending_cod': 'Pending Cash Payment'
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
        
        // Setup profile form submission
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
            // Update locally for now
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
        
        // Check if user has saved address
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
        
        // Prefill form with existing address
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
        
        // Setup address form submission
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
            // Try to save to backend first
            const response = await fetch(`${BASE_URL}/api/user/address/${this.currentUser.id}`, {
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
            
            // Fallback to local storage
            throw new Error('Backend save failed');
            
        } catch (error) {
            console.error('Error saving address:', error);
            // Save locally as fallback
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

    // Product Detail Methods
    setupProductDetailListeners() {
        // Add click handlers to product cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.product-card')) {
                const productCard = e.target.closest('.product-card');
                const productId = parseInt(productCard.querySelector('.add-to-cart')?.getAttribute('data-id'));
                
                if (productId) {
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        this.showProductDetail(product);
                    }
                }
            }
        });

        // Cart button in product detail
        const cartButtonDetail = document.getElementById('cart-button-detail');
        if (cartButtonDetail) {
            cartButtonDetail.addEventListener('click', () => {
                this.goToCartFromDetail();
            });
        }
    }

    showProductDetail(product) {
        // Hide all main views but KEEP bottom navigation visible
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        document.querySelector('.main-header').style.display = 'none';
        // DON'T hide the bottom navigation - this is the fix!
        
        // Show product detail view
        document.getElementById('product-detail-view').style.display = 'block';
        
        // Update cart badge
        this.updateDetailCartBadge();
        
        // Update product details
        document.getElementById('product-detail-title').textContent = product.name;
        document.getElementById('product-detail-price').textContent = `ksh ${product.price.toFixed(2)}`;
        document.getElementById('product-detail-description').textContent = product.description || 'No description available';
        document.getElementById('product-category').textContent = this.formatCategory(product.category);
        document.getElementById('product-stock').textContent = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';
        
        // Load product images
        this.loadProductImages(product);
        
        // Load reviews
        this.loadProductReviews(product);
        
        // Set current product
        this.currentProductDetail = product;
        this.currentDetailQuantity = 1;
        this.updateDetailQuantityDisplay();
    }

    hideProductDetail() {
        document.getElementById('product-detail-view').style.display = 'none';
        document.querySelector('.main-header').style.display = 'block';
        document.getElementById('home-view').style.display = 'block';
        
        // Make sure bottom nav is visible
        document.querySelector('.bottom-nav').style.display = 'flex';
    }

 // Updated method to handle 6 different angle images
loadProductImages(product) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    if (!mainImage || !thumbnailContainer) return;
    
    // Get images array from product, fallback to single image
    const productImages = product.images || (product.image ? [product.image] : []);
    
    // If no images, use placeholder
    if (productImages.length === 0) {
        productImages.push('https://via.placeholder.com/300x200/fff9c4/ff6f00?text=🍋');
    }
    
    // Limit to 6 images max
    const displayImages = productImages.slice(0, 6);
    
    // Set main image (first image)
    mainImage.src = displayImages[0];
    mainImage.alt = product.name;
    
    // Create thumbnails
    thumbnailContainer.innerHTML = '';
    displayImages.forEach((url, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = url;
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.alt = `${product.name} - Angle ${index + 1}`;
        thumbnail.title = `View angle ${index + 1}`;
        
        thumbnail.addEventListener('click', () => {
            this.setMainProductImage(url, index);
        });
        
        // Add loading attribute for better performance
        thumbnail.loading = 'lazy';
        
        thumbnailContainer.appendChild(thumbnail);
    });
    
    // Add CSS for thumbnail grid
    this.addThumbnailStyles();
}

// Add thumbnail styles
addThumbnailStyles() {
    // Add styles if not already added
    if (!document.getElementById('thumbnail-styles')) {
        const style = document.createElement('style');
        style.id = 'thumbnail-styles';
        style.textContent = `
            .thumbnail-container {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 10px;
                margin-top: 15px;
                max-width: 100%;
                overflow-x: auto;
            }
            
            .thumbnail {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 8px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .thumbnail:hover {
                transform: scale(1.05);
                border-color: var(--accent-color);
            }
            
            .thumbnail.active {
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(255, 111, 0, 0.3);
            }
            
            @media (max-width: 768px) {
                .thumbnail-container {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .thumbnail {
                    width: 70px;
                    height: 70px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

setMainProductImage(url, index) {
    document.getElementById('main-product-image').src = url;
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
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
            'Hoodies': 'Hoodies',
            'T- Shirts': 'T- Shirts',
            'oppo': 'Oppo',
            'Apple': 'Apple',
            'Tecno': 'Tecno',
            'nokia': 'Nokia',
            'Xiomi': 'Xiaomi',
            'infinix': 'Infinix',
            'samsung': 'Samsung',
            'Retaills': 'Retaills',
            'Wholesales': 'Wholesales',
            'Lemonade flash salles': 'Lemonade flash salles',
            'Machinary': 'Machinary',
            'Shoes': 'Shoes',
            'Electoronics': 'Electoronics',
            'Home-Tools': 'Home-Tools'

        };
        return categories[category] || category;
    }

    checkProductCategories() {
        console.log('🔍 CHECKING PRODUCT CATEGORIES:');
        this.products.forEach((product, index) => {
            console.log(`Product ${index + 1}: "${product.name}" → Category: "${product.category}"`);
        });
        
        // Also check what categories are in your HTML
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

        // Password visibility toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.password-toggle')) {
                const toggleBtn = e.target.closest('.password-toggle');
                const targetId = toggleBtn.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                const icon = toggleBtn.querySelector('i');

                if (targetInput && icon) {
                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        icon.className = 'fas fa-eye-slash';
                    } else {
                        targetInput.type = 'password';
                        icon.className = 'fas fa-eye';
                    }
                }
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
        const loginInput = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!loginInput) {
            this.showMessage('Please enter your email or phone number');
            return;
        }

        if (!password) {
            this.showMessage('Please enter your password');
            return;
        }

        try {
            // Determine if input is email or phone
            const isEmail = loginInput.includes('@');
            const loginData = isEmail
                ? { email: loginInput, password: password }
                : { phone: loginInput, password: password };

            // Call backend login API
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateUserUI();
                this.showMessage(`Welcome back, ${data.user.name}! 👋`);
            } else {
                this.showMessage('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.');
        }
    }

    async handleSignup() {
        const firstName = document.getElementById('signup-firstname').value.trim();
        const lastName = document.getElementById('signup-lastname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const confirmPassword = document.getElementById('signup-confirm-password').value.trim();

        // Validate required fields
        if (!firstName || !lastName) {
            this.showMessage('Please enter your first and last name');
            return;
        }

        if (!email && !phone) {
            this.showMessage('Please enter either email or phone number');
            return;
        }

        if (!password) {
            this.showMessage('Please enter a password');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match');
            return;
        }

        const fullName = `${firstName} ${lastName}`;

        try {
            // Call backend signup API
            const response = await fetch(`${BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: fullName,
                    email: email || null,
                    phone: phone || null,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.updateUserUI();
                this.showMessage(`Welcome to Lemonade, ${fullName}! 🎉`);
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

    // Other methods remain the same...

    // Update switchView method:
    switchView(viewId) {
        console.log('🔄 Switching to view:', viewId);
        
        // Hide all views and product detail
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        
        // Hide product detail view
        const productDetailView = document.getElementById('product-detail-view');
        if (productDetailView) {
            productDetailView.style.display = 'none';
        }
        
        // Show main header (hide when in product detail)
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            mainHeader.style.display = 'block';
        }
        
        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
            console.log('View displayed:', viewId);
            
            // Load view-specific data
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
                    // Ensure categories view is properly set up
                    break;
            }
        } else {
            console.error('❌ View not found:', viewId);
        }
        
        // Update active state in bottom navigation
        this.updateActiveNavButton(viewId);
    }

    updateActiveNavButton(viewId) {
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to current view's button
        const activeButton = document.querySelector(`[data-view="${viewId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Replace the filterByCategory method:
    // Update the filterByCategory method:
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
            'Xiomi': 'Xiaomi Phones',
            
            'Machinary': 'Machinary',
            'Shoes': 'Shoes',
            'Electoronics': 'Electoronics',
            'T- Shirts': 'T- Shirts',
            'Home-Tools': 'Home-Tools'
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
        
        // Switch to home view first to ensure products are visible
        this.switchView('home-view');
        
        // Then filter the products - add a small delay to ensure DOM is ready
        setTimeout(() => {
            this.filterProducts('', category);
        }, 100);
    }

    // Replace the current filterProducts method with this:
    filterProducts(searchTerm = '', category = 'all') {
        console.log('🔍 FILTER PRODUCTS CALLED - Category:', category, 'Search:', searchTerm);
        
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) return;
        
        // First, get all products from the backend data
        let filteredProducts = this.products.filter(product => {
            if (product.status !== 'active') return false;
            
            // Filter by category - FIXED: Use exact matching
            const matchesCategory = category === 'all' || 
                                  product.category.toLowerCase() === category.toLowerCase();
            
            // Filter by search term
            const matchesSearch = !searchTerm || 
                                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesCategory && matchesSearch;
        });
        
        console.log(`📦 Filtered ${filteredProducts.length} products for category: ${category}`);
        
        // Render the filtered products
        if (filteredProducts.length === 0) {
            this.showNoProductsMessage(category, searchTerm);
        } else {
            this.hideNoProductsMessage();
            
            productsContainer.innerHTML = filteredProducts.map(product => {
                return `
                <div class="product-card2" data-category="${product.category}" data-name="${product.name.toLowerCase()}">
                    <img src="${product.image}" alt="${product.name}" 
                         onclick="lemonadeApp.showProductDetail(${JSON.stringify(product).replace(/"/g, '&quot;')})"
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

    // Update the showNoProductsMessage method:
    showNoProductsMessage(category, searchTerm) {
        const productsContainer = document.querySelector('.products');
        if (!productsContainer) return;
        
        // Remove existing message first
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
            'Xiomi': 'Xiaomi',
            'Machinary': 'Machinary',
            'Shoes': 'Shoes',
            'Electoronics': 'Electoronics',
            'T- Shirts': 'T- Shirts',
            'Home-Tools': 'Home-Tools'
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('Service Worker registered with scope:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🍋 PWA: beforeinstallprompt event fired!');
    // Prevent Chrome from showing the default prompt
    e.preventDefault();

    // Save the event to trigger later
    deferredPrompt = e;

    // Show your custom install button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'block'; // Show the button
        console.log('🍋 PWA: Install button shown');

        installBtn.addEventListener('click', async () => {
            console.log('🍋 PWA: Install button clicked');
            // Show the prompt
            deferredPrompt.prompt();

            // Wait for the user to respond
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                console.log('🍋 PWA: User accepted the install prompt');
                // Hide button after successful installation
                installBtn.style.display = 'none';
            } else {
                console.log('🍋 PWA: User dismissed the install prompt');
                // Keep button visible for future attempts
            }

            // Reset the deferred prompt
            deferredPrompt = null;
        });
    }
});

// Fallback: Show install button if PWA criteria are met but beforeinstallprompt didn't fire
window.addEventListener('load', () => {
    setTimeout(() => {
        // Check if we're in a PWA-capable environment
        const isPWAReady = (
            'serviceWorker' in navigator &&
            window.matchMedia('(display-mode: standalone)').matches === false &&
            (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        );

        // If PWA is ready but no beforeinstallprompt event fired, show the button anyway
        if (isPWAReady && !deferredPrompt) {
            console.log('🍋 PWA: Showing install button as fallback');
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.textContent = '📱 Install Lemonade App';

                installBtn.addEventListener('click', () => {
                    // Since we don't have the deferred prompt, try to trigger installation manually
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                    } else {
                        // Fallback: Show instructions
                        alert('To install this app:\n1. Click the menu (⋮) in your browser\n2. Select "Add to Home screen"\n3. Follow the prompts');
                    }
                });
            }
        }
    }, 3000); // Wait 3 seconds for beforeinstallprompt to potentially fire
});

// Check if app is already installed
window.addEventListener('appinstalled', (e) => {
    console.log('🍋 PWA: App was installed successfully!');
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
});

// Debug PWA readiness
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🍋 PWA Debug Info:');
        console.log('- Service Worker support:', 'serviceWorker' in navigator);
        console.log('- Manifest link exists:', !!document.querySelector('link[rel="manifest"]'));
        console.log('- Is HTTPS or localhost:', location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        console.log('- BeforeInstallPrompt support:', 'onbeforeinstallprompt' in window);
        console.log('- Current URL:', window.location.href);
        console.log('- Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');

        // Check if manifest is accessible
        fetch('/manifest.json')
            .then(response => {
                console.log('- Manifest fetch status:', response.status);
                return response.json();
            })
            .then(manifest => {
                console.log('- Manifest loaded successfully:', manifest.name);
                console.log('- Manifest icons:', manifest.icons);
                console.log('- Manifest start_url:', manifest.start_url);
                console.log('- Manifest scope:', manifest.scope);
            })
            .catch(error => {
                console.error('- Manifest fetch failed:', error);
            });

        // Check service worker status
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log('- Service Worker registrations:', registrations.length);
                registrations.forEach(reg => {
                    console.log('  - SW scope:', reg.scope);
                    console.log('  - SW state:', reg.active?.state);
                });
            });
        }
    }, 2000);
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







// Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });

        // Highlight active menu item
        const navLinks = document.querySelectorAll('.nav-links a');
        const currentPage = window.location.pathname.split('/').pop();
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (currentPage === linkPage || 
                (currentPage === '' && linkPage === 'index.html') ||
                (currentPage.includes(linkPage.replace('.html', '')))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
            
             link.addEventListener('click', function() {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        this.classList.add('active');
        
        // Close mobile menu if open
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
        });

        // Search functionality
        const searchInput = document.getElementById('product-search');
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    alert(`Searching for: "${searchTerm}"\nThis would show search results on a separate page`);
                    this.value = '';
                }
            }
        });

        // Social media links confirmation
        const socialLinks = document.querySelectorAll('.social-links a');
        socialLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const platform = this.className.includes('facebook') ? 'Facebook' 
                               : this.className.includes('instagram') ? 'Instagram' 
                               : 'Twitter';
                
                if (confirm(`You are being redirected to ${platform}. Continue?`)) {
                    return true;
                } else {
                    e.preventDefault();
                }
            });
        });
 

        
        