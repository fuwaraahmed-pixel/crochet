/**
 * Dremoy Store — Interactive Micro-Interactions, Scroll Animations & CRO Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar Sticky Shadow, Smooth Scroll & ScrollSpy Active Link Highlight
  const navbar = document.querySelector('.navbar-custom');
  const navLinks = document.querySelectorAll('.nav-link-custom');
  const sections = document.querySelectorAll('section[id]');
  const navbarContent = document.getElementById('navbarContent');

  function getHeaderHeight() {
    return navbar ? navbar.offsetHeight : 70;
  }

  // Smooth Scroll on Link Click with Header Offset & Mobile Menu Close
  document.querySelectorAll('a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) return;

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      const targetId = href.substring(hashIndex);
      if (!targetId || targetId === '#') return;

      const pathBeforeHash = href.substring(0, hashIndex);
      const currentPath = window.location.pathname;

      const isCurrentPage = !pathBeforeHash || 
        pathBeforeHash === '/' || 
        pathBeforeHash === '/index.html' || 
        currentPath.endsWith(pathBeforeHash) || 
        pathBeforeHash === currentPath;

      const targetSection = document.querySelector(targetId);
      if (isCurrentPage && targetSection) {
        e.preventDefault();

        // Close mobile navbar if open
        if (navbarContent && navbarContent.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navbarContent) || new bootstrap.Collapse(navbarContent);
          bsCollapse.hide();
          document.body.classList.remove('menu-open');
        }

        const headerOffset = getHeaderHeight();
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  // ScrollSpy Active Link & Sticky Shadow
  function handleScroll() {
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = '0 10px 30px rgba(34, 34, 34, 0.06)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    }

    const headerOffset = getHeaderHeight() + 40;
    let currentSectionId = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - headerOffset;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 1b. Mobile Navigation Menu Toggle & Body Scroll Lock
  if (navbarContent) {
    navbarContent.addEventListener('show.bs.collapse', () => {
      document.body.classList.add('menu-open');
    });
    navbarContent.addEventListener('hide.bs.collapse', () => {
      document.body.classList.remove('menu-open');
    });
  }

  // 2. IntersectionObserver for Smooth Scroll Reveal Animations (300-700ms)
  const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right');

  const revealAll = () => {
    revealElements.forEach(el => el.classList.add('revealed'));
  };

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.05,
      rootMargin: '0px 0px 50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
    
    // Safety check: force reveal after 1.2s in case observer delays
    setTimeout(revealAll, 1200);
  } else {
    revealAll();
  }

  // 3. Button Ripple Effect Micro-Interaction
  const rippleButtons = document.querySelectorAll('.btn-primary-custom, .btn-secondary-custom, .btn-whatsapp-custom, .btn-hero-primary');

  rippleButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const circle = document.createElement('span');
      circle.classList.add('ripple-effect');
      circle.style.top = `${y}px`;
      circle.style.left = `${x}px`;

      const existingRipple = button.querySelector('.ripple-effect');
      if (existingRipple) {
        existingRipple.remove();
      }

      button.appendChild(circle);

      setTimeout(() => {
        circle.remove();
      }, 600);
    });
  });

  // 4. FAQ Accordion Handling with Smooth Expansion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const button = item.querySelector('.faq-button');
    const answer = item.querySelector('.faq-answer');

    if (button && answer) {
      button.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            const otherButton = otherItem.querySelector('.faq-button');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
            if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
          button.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          button.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // 5. Wishlist Heart Button Feedback & Toast Notification
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastText');

  function showToast(message) {
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function attachFavButtonListeners() {
    const favBtns = document.querySelectorAll('.product-fav-btn');
    favBtns.forEach(btn => {
      if (btn.dataset.favAttached) return;
      btn.dataset.favAttached = 'true';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        if (icon) {
          if (btn.classList.contains('active')) {
            icon.className = 'bi bi-heart-fill';
            showToast('💖 আপনার পছন্দের তালিকায় যোগ করা হয়েছে');

            // Trigger 3 tiny floating hearts
            for (let i = 0; i < 3; i++) {
              const miniHeart = document.createElement('span');
              miniHeart.className = 'floating-mini-heart';
              miniHeart.innerHTML = '❤️';
              const offset = (i - 1) * 16;
              miniHeart.style.setProperty('--tx', `${offset}px`);
              miniHeart.style.left = '50%';
              miniHeart.style.top = '20%';
              miniHeart.style.animationDelay = `${i * 0.1}s`;
              btn.appendChild(miniHeart);

              setTimeout(() => {
                miniHeart.remove();
              }, 850);
            }
          } else {
            icon.className = 'bi bi-heart';
            showToast('পছন্দের তালিকা থেকে সরানো হয়েছে');
          }
        }
      });
    });
  }

  attachFavButtonListeners();

  // 6. Quick Order Modal Logic & Live Price Sync from Google Sheets
  const orderModal = document.getElementById('orderModal');
  const orderForm = document.getElementById('quickOrderForm');
  const selectedProductInput = document.getElementById('modalProductName');

  if (orderModal) {
    orderModal.addEventListener('show.bs.modal', (event) => {
      const button = event.relatedTarget;
      if (button) {
        const productName = button.getAttribute('data-product-name') || 'সাধারণ প্রশ্ন / কাস্টম অর্ডার';
        const productPrice = button.getAttribute('data-product-price') || '600';
        if (selectedProductInput) {
          selectedProductInput.value = productName;
          selectedProductInput.dataset.price = productPrice;
        }
      }
    });
  }

  // Live Auto-Sync & Dynamic Product Rendering from Google Sheets API
  async function syncLiveProductsFromSheet() {
    try {
      let data = null;
      if (window.ApiService && typeof window.ApiService.getProducts === 'function') {
        data = await window.ApiService.getProducts();
      } else {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbyWD8TMbk4tO5EYjikoKvDOhlouZqCnWInjFQMYc-xNFYbQ2wM3zCnItmSo-dteArfpMQ/exec?action=getProducts&_t=" + Date.now();
        const res = await fetch(scriptUrl);
        data = await res.json();
      }

      if (data && data.status === "success" && Array.isArray(data.products) && data.products.length > 0) {
        window.dremoyLiveProducts = data.products;

        const isSubfolder = window.location.pathname.includes('/collection/') || 
                            window.location.pathname.includes('/pages/') || 
                            window.location.pathname.includes('/product/');
        const assetPrefix = isSubfolder ? '../' : '';

        const formatPrice = (val) => {
          const num = Number(val);
          if (isNaN(num)) return `৳ ${val}`;
          return `৳ ${num.toLocaleString('bn-BD')}`;
        };

        const resolveImagePath = (imgSrc) => {
          if (!imgSrc) return assetPrefix + 'assets/images/crochet-bag-tag.webp';
          if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) return imgSrc;
          let clean = imgSrc.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
          return assetPrefix + clean;
        };

        const getProductSlug = (name) => {
          return String(name || '').toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        };

        // 1. Dynamic Rendering for Home Product Grid (#homeProductGrid)
        const homeGrid = document.getElementById('homeProductGrid');
        if (homeGrid) {
          homeGrid.innerHTML = data.products.map((p, idx) => {
            const priceFormatted = formatPrice(p.price);
            const originalPriceFormatted = (p.discount && Number(p.discount) > 0) ? formatPrice(Number(p.price) + Number(p.discount)) : null;
            const imgSrc = resolveImagePath(p.image);
            const slug = getProductSlug(p.name);
            const detailUrl = `${assetPrefix}product/${slug}/index.html`;
            const categoryText = p.category ? String(p.category).toUpperCase() : 'HANDMADE';
            const descText = p.description ? String(p.description) : 'আপনার প্রিয় ব্যাগে কিউট ও স্নিগ্ধ এক নস্টালজিক লুক এনে দেবে এই চার্ম।';

            return `
              <div class="col-sm-6 col-lg-3 reveal-fade-up delay-${(idx % 4) + 1} revealed">
                <div class="editorial-product-card">
                  <div class="product-img-wrapper">
                    ${p.discount > 0 ? `<span class="product-badge-pill">SAVE ৳${p.discount}</span>` : `<span class="product-badge-pill">HANDMADE</span>`}
                    <button class="product-fav-btn" aria-label="উইশলিস্টে যুক্ত করুন"><i class="bi bi-heart"></i></button>
                    <a href="${detailUrl}">
                      <img src="${imgSrc}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='${assetPrefix}assets/images/crochet-bag-tag.webp'">
                    </a>
                    <button class="product-hover-overlay-btn" data-bs-toggle="modal" data-bs-target="#orderModal"
                      data-product-name="${p.name}" data-product-price="${p.price}">
                      এখনই অর্ডার করুন
                    </button>
                  </div>
                  <div class="product-info-body">
                    <div class="product-category-dots">
                      <span class="cat-dot cat-dot-pink">• ${categoryText}</span>
                      <span class="cat-dot cat-dot-purple">• DREMOY EXCLUSIVE</span>
                    </div>
                    <h3 class="editorial-product-title">
                      <a href="${detailUrl}">${p.name}</a>
                    </h3>
                    <p class="editorial-product-desc">${descText}</p>
                    <div class="product-rating-stars">★★★★★</div>
                    <div class="editorial-product-price">
                      ${priceFormatted}
                      ${originalPriceFormatted ? `<small class="text-muted text-decoration-line-through ms-2 fs-6">${originalPriceFormatted}</small>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        // 2. Dynamic Rendering for Collection Grid (#collectionProductGrid)
        const collectionGrid = document.getElementById('collectionProductGrid');
        if (collectionGrid) {
          collectionGrid.innerHTML = data.products.map((p, idx) => {
            const priceFormatted = formatPrice(p.price);
            const originalPriceFormatted = (p.discount && Number(p.discount) > 0) ? formatPrice(Number(p.price) + Number(p.discount)) : null;
            const imgSrc = resolveImagePath(p.image);
            const slug = getProductSlug(p.name);
            const detailUrl = `${assetPrefix}product/${slug}/index.html`;

            return `
              <div class="col-sm-6 col-lg-3 reveal-fade-up delay-${(idx % 4) + 1} revealed">
                <div class="product-card">
                  <div class="product-img-wrapper">
                    ${p.discount > 0 ? `<span class="product-badge">ডিসকাউন্ট</span>` : `<span class="product-badge">হাতে বোনা</span>`}
                    <button class="product-fav-btn" aria-label="উইশলিস্টে যুক্ত করুন"><i class="bi bi-heart"></i></button>
                    <a href="${detailUrl}">
                      <img src="${imgSrc}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='${assetPrefix}assets/images/crochet-bag-tag.webp'">
                    </a>
                    <button class="product-quick-view" data-bs-toggle="modal" data-bs-target="#orderModal"
                      data-product-name="${p.name}" data-product-price="${p.price}">
                      দ্রুত অর্ডার <i class="bi bi-cart-plus ms-1"></i>
                    </button>
                  </div>
                  <div class="product-info">
                    <span class="product-category">${p.category || 'Dremoy Collection'}</span>
                    <h3 class="product-title">
                      <a href="${detailUrl}">${p.name}</a>
                    </h3>
                    <div class="product-price">
                      ${priceFormatted}
                      ${originalPriceFormatted ? `<span class="price-original ms-2">${originalPriceFormatted}</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        // Re-attach wishlist heart button handlers for dynamically created cards
        attachFavButtonListeners();

        // 3. Fallback matching & Price updates for detail pages / existing buttons
        data.products.forEach(p => {
          if (!p.name) return;
          const cleanName = String(p.name).trim().toLowerCase();

          const btns = document.querySelectorAll('[data-product-name]');
          btns.forEach(btn => {
            const btnName = String(btn.getAttribute('data-product-name')).trim().toLowerCase();
            if (btnName === cleanName && p.price) {
              btn.setAttribute('data-product-price', p.price);
            }
          });

          const h1List = document.querySelectorAll('h1');
          h1List.forEach(h1 => {
            if (String(h1.textContent).trim().toLowerCase() === cleanName && p.price) {
              const detailContainer = h1.closest('.col-lg-6') || h1.parentElement;
              if (detailContainer) {
                const detailPriceEl = detailContainer.querySelector('.fs-2.text-primary, .text-primary, .product-price');
                if (detailPriceEl) {
                  detailPriceEl.innerHTML = formatPrice(p.price);
                }
              }
            }
          });
        });
      }
    } catch (e) {
      console.warn("Live product price sync fallback:", e);
    }
  }

  syncLiveProductsFromSheet();

  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = orderForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'অর্ডার সম্পূর্ণ করুন';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>প্রসেস হচ্ছে...';
      }

      // Pre-open WhatsApp tab immediately inside user interaction context (prevents popup blocker)
      const waWindow = window.open('about:blank', '_blank');

      const product = document.getElementById('modalProductName').value;
      const name = document.getElementById('customerName').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();
      const address = document.getElementById('customerAddress').value.trim();
      const district = document.getElementById('customerDistrict') ? document.getElementById('customerDistrict').value : 'Mymensingh';
      const quantity = document.getElementById('customerQuantity') ? parseInt(document.getElementById('customerQuantity').value) || 1 : 1;
      const paymentMethod = document.getElementById('customerPayment') ? document.getElementById('customerPayment').value : 'Cash on Delivery';
      const note = document.getElementById('customerNote') ? document.getElementById('customerNote').value.trim() : '';

      let unitPrice = 600;
      if (selectedProductInput && selectedProductInput.dataset.price) {
        unitPrice = parseFloat(selectedProductInput.dataset.price) || 600;
      } else if (window.dremoyLiveProducts && Array.isArray(window.dremoyLiveProducts)) {
        const found = window.dremoyLiveProducts.find(p => p.name && p.name.trim() === product.trim());
        if (found && found.price) unitPrice = parseFloat(found.price) || 600;
      }

      const deliveryCharge = (district && district.toLowerCase().includes('outside')) ? 120 : 60;

      let trackingId = '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbyWD8TMbk4tO5EYjikoKvDOhlouZqCnWInjFQMYc-xNFYbQ2wM3zCnItmSo-dteArfpMQ/exec";
        const res = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          signal: controller.signal,
          body: JSON.stringify({
            action: "createOrder",
            data: {
              name: name,
              phone: phone,
              address: address,
              district: district,
              productName: product,
              quantity: quantity,
              unitPrice: unitPrice,
              deliveryCharge: deliveryCharge,
              paymentMethod: paymentMethod,
              advancePaid: 0,
              note: note
            }
          })
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data && data.status === "success" && data.trackingId) {
          trackingId = data.trackingId;
        }
      } catch (err) {
        console.warn("Google Sheet Sync timeout/warning:", err);
      } finally {
        clearTimeout(timeoutId);
      }

      // Format WhatsApp message
      let message = `হ্যালো Dremoy Store! 👋\nআমি একটি অর্ডার করতে চাই:\n\n📌 *প্রোডাক্ট:* ${product}\n👤 *নাম:* ${name}\n📞 *ফোন:* ${phone}\n🏠 *ঠিকানা:* ${address}`;
      if (trackingId) {
        message += `\n🆔 *ট্র্যাকিং আইডি:* ${trackingId}`;
      }
      if (note) {
        message += `\n💌 *বিশেষ মেসেজ/উপহার নোট:* ${note}`;
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/8801622536026?text=${encodedMessage}`;

      // Redirect pre-opened tab to WhatsApp URL
      if (waWindow) {
        waWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      // Reset submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

      // Close modal
      const modalInstance = bootstrap.Modal.getInstance(orderModal);
      if (modalInstance) {
        modalInstance.hide();
      }

      showToast(trackingId ? `আপনার অর্ডার গুগল শীটে যুক্ত হয়েছে! ট্র্যাকিং আইডি: ${trackingId}` : 'আপনার অর্ডার হোয়াটসঅ্যাপে পাঠানো হচ্ছে...');
    });
  }

  // 7. Signature Brand Interaction — Primary CTA Button ("এখনই অর্ডার করুন")
  const primaryCta = document.getElementById('primarySignatureCta');
  const signatureOverlay = document.getElementById('signatureAnimationOverlay');
  const signatureText = document.getElementById('signatureText');

  const emotionalMessages = [
    '💝 ভালোবাসা দিয়ে তৈরি, আপনার জন্য।',
    '🎁 প্রতিটি সেলাইয়ে লুকিয়ে আছে ভালোবাসা।',
    '✨ একটি ছোট্ট উপহার, অনেক বড় অনুভূতি।'
  ];

  if (primaryCta && signatureOverlay) {
    primaryCta.addEventListener('click', function(e) {
      e.preventDefault();

      // Disable repeated clicks during animation
      if (this.disabled || this.classList.contains('is-animating')) return;
      this.disabled = true;
      this.style.pointerEvents = 'none';
      this.classList.add('is-animating');

      // Target WhatsApp URL with prefilled message
      const defaultMsg = 'হ্যালো Dremoy Store! 👋\nআমি অর্ডার সম্পর্কিত তথ্য জানতে এবং অর্ডারের প্রক্রিয়াটি সম্পন্ন করতে চাই।';
      const whatsappUrl = `https://wa.me/8801622536026?text=${encodeURIComponent(defaultMsg)}`;

      // Check prefers-reduced-motion: skip all animation if enabled
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        window.open(whatsappUrl, '_blank');
        this.disabled = false;
        this.style.pointerEvents = '';
        this.classList.remove('is-animating');
        return;
      }

      // Active tactile press effect (120ms)
      this.classList.add('active-press');
      setTimeout(() => this.classList.remove('active-press'), 120);

      // Select random emotional message
      const randomMsg = emotionalMessages[Math.floor(Math.random() * emotionalMessages.length)];
      if (signatureText) {
        signatureText.textContent = randomMsg;
      }

      // Step 1: Open Overlay Stage (0ms)
      signatureOverlay.className = 'signature-overlay active';

      // Step 2: Thin yarn weaves across (100ms)
      setTimeout(() => {
        signatureOverlay.classList.add('anim-step-2');
      }, 100);

      // Step 3 & 4: Yarn forms handcrafted heart (280ms)
      setTimeout(() => {
        signatureOverlay.classList.add('anim-step-4');
      }, 280);

      // Step 5: Heart transforms into premium wrapped gift box (480ms)
      setTimeout(() => {
        signatureOverlay.classList.add('anim-step-5');
      }, 480);

      // Step 6: Ribbon gently unties & gift box opens slightly (650ms)
      setTimeout(() => {
        signatureOverlay.classList.add('anim-step-6');
      }, 650);

      // Step 7 & 8: Soft golden sparkles appear & emotional message displays (780ms)
      setTimeout(() => {
        signatureOverlay.classList.add('anim-step-7', 'anim-step-8');
      }, 780);

      // Success Feedback: Tiny success ripple from button (920ms)
      setTimeout(() => {
        primaryCta.classList.add('cta-ripple-active');
      }, 920);

      // Step 9 & 10: Smooth fade out overlay and open WhatsApp (1050ms)
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        signatureOverlay.classList.remove('active');

        // Reset overlay & re-enable button after fade finishes
        setTimeout(() => {
          signatureOverlay.className = 'signature-overlay';
          primaryCta.disabled = false;
          primaryCta.style.pointerEvents = '';
          primaryCta.classList.remove('is-animating', 'cta-ripple-active');
        }, 350);
      }, 1050);
    });
  }

  // 8. Phase 2 — WhatsApp Button Animated Transformation
  const whatsappBtns = document.querySelectorAll('.btn-whatsapp-custom, .btn-cta-whatsapp');
  whatsappBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const targetUrl = this.getAttribute('href');
      if (!targetUrl || targetUrl === '#') return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return; // Immediate open handled by default link

      e.preventDefault();

      this.classList.add('wa-press', 'wa-animating');

      // Create overlay container inside button if not exists
      let overlay = this.querySelector('.wa-anim-overlay');
      if (!overlay) {
        overlay = document.createElement('span');
        overlay.className = 'wa-anim-overlay';
        overlay.innerHTML = '<i class="bi bi-chat-text-fill wa-anim-icon"></i>';
        this.appendChild(overlay);
      }

      const animIcon = overlay.querySelector('.wa-anim-icon');
      if (animIcon) {
        // Step 1: Chat bubble icon (0-150ms)
        animIcon.className = 'bi bi-chat-text-fill wa-anim-icon';
        
        // Step 2: Bubble transforms to small heart (at 200ms)
        setTimeout(() => {
          animIcon.className = 'bi bi-heart-fill wa-anim-icon';
          animIcon.style.color = '#FFFFFF';
        }, 200);

        // Step 3: Heart fades to WhatsApp icon (at 380ms)
        setTimeout(() => {
          animIcon.className = 'bi bi-whatsapp wa-anim-icon';
        }, 380);
      }

      // Step 4: Open WhatsApp after 450ms
      setTimeout(() => {
        window.open(targetUrl, '_blank');
        this.classList.remove('wa-press', 'wa-animating');
      }, 450);
    });
  });

  // 9. Phase 2 — Collection Button Yarn Draw Animation
  const collectionBtns = document.querySelectorAll('.btn-secondary-custom, a[href*="collection"]');
  collectionBtns.forEach(btn => {
    if (!btn.classList.contains('btn-secondary-custom')) return;
    
    // Inject yarn SVG path inside collection button
    if (!btn.querySelector('.btn-yarn-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'btn-yarn-svg');
      svg.setAttribute('viewBox', '0 0 200 12');
      svg.innerHTML = '<path class="btn-yarn-path" d="M 0 6 C 50 2, 100 10, 150 4 C 180 2, 195 8, 200 6" />';
      btn.appendChild(svg);
    }

    btn.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      e.preventDefault();
      this.classList.add('yarn-drawing');

      setTimeout(() => {
        window.location.href = href;
      }, 400);
    });
  });

  // 10. Phase 2 — Premium Lightbox Modal for Gallery Images
  const galleryCards = document.querySelectorAll('.lifestyle-card');
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let currentGalleryIndex = 0;
  const galleryItems = [];

  galleryCards.forEach((card, index) => {
    const img = card.querySelector('img');
    const title = card.querySelector('.lifestyle-title');
    const desc = card.querySelector('.lifestyle-desc');

    if (img) {
      galleryItems.push({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || 'Gallery Image',
        caption: title ? title.textContent : (desc ? desc.textContent : '')
      });

      card.addEventListener('click', () => {
        openLightbox(index);
      });
    }
  });

  function openLightbox(index) {
    if (!lightbox || !lightboxImg || galleryItems.length === 0) return;
    currentGalleryIndex = index;
    updateLightboxContent();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const item = galleryItems[currentGalleryIndex];
    if (item && lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      if (lightboxCaption) {
        lightboxCaption.textContent = item.caption;
      }
    }
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightboxContent();
  });
  if (lightboxNext) lightboxNext.addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
    updateLightboxContent();
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });

    // Keyboard support for Lightbox
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
        updateLightboxContent();
      }
      if (e.key === 'ArrowRight') {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
        updateLightboxContent();
      }
    });

    // Mobile Swipe Support for Lightbox
    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 40) {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
        updateLightboxContent();
      } else if (touchEndX > touchStartX + 40) {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
        updateLightboxContent();
      }
    }, { passive: true });
  }

  // 11. Single-Fire IntersectionObserver for reveal-scale-in
  const scaleInElements = document.querySelectorAll('.reveal-scale-in');
  if ('IntersectionObserver' in window && scaleInElements.length > 0) {
    const scaleObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    scaleInElements.forEach(el => scaleObserver.observe(el));
  }

  // ==========================================================================
  // Phase 3 — Luxury Brand Experience Logic
  // ==========================================================================

  // 1. Premium Page Loader (< 1.5s max duration)
  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    const hideLoader = () => {
      pageLoader.classList.add('fade-out');
      setTimeout(() => {
        pageLoader.style.display = 'none';
      }, 500);
    };

    if (document.readyState === 'complete') {
      setTimeout(hideLoader, 300);
    } else {
      window.addEventListener('load', hideLoader);
      setTimeout(hideLoader, 1000); // Safety fallback
    }
  }

  // 2. Luxury Page Transition (Soft Fade & Slight Blur on Link Navigation)
  document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"])').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      e.preventDefault();
      document.body.classList.add('page-transitioning');
      setTimeout(() => {
        window.location.href = href;
      }, 320);
    });
  });

  // 3. Scroll Progress Indicator Bar
  const progressBar = document.getElementById('scrollProgressBar');
  function updateScrollProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${scrollPercent}%`;
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // 4. Desktop Custom Pure Heart Cursor & Click Anywhere Heart Burst
  const cursor = document.getElementById('customCursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    if (!cursor.querySelector('.cursor-heart-icon')) {
      cursor.innerHTML = '<i class="bi bi-heart-fill cursor-heart-icon"></i>';
    }

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }, { passive: true });

    document.querySelectorAll('a, button, input, textarea, .lifestyle-card, .product-card').forEach(interactiveEl => {
      interactiveEl.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
      interactiveEl.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });

    window.addEventListener('mousedown', () => cursor.classList.add('cursor-click'));
    window.addEventListener('mouseup', () => cursor.classList.remove('cursor-click'));

    // Floating Heart Burst on Every Click
    window.addEventListener('click', (e) => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const heartCount = 3;
      const colors = ['#FF2D55', '#FF1493', '#E25B3E', '#FF385C', '#F59E0B'];

      for (let i = 0; i < heartCount; i++) {
        const particle = document.createElement('span');
        particle.className = 'click-heart-particle';
        particle.innerHTML = '<i class="bi bi-heart-fill"></i>';

        const offsetX = (Math.random() - 0.5) * 36;
        const rot = (Math.random() - 0.5) * 30;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 0.85 + Math.random() * 0.4;

        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        particle.style.color = color;
        particle.style.fontSize = `${size}rem`;
        particle.style.setProperty('--dx', `${offsetX}px`);
        particle.style.setProperty('--rot', `${rot}deg`);

        document.body.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 700);
      }
    });
  }

  // 10 & 11. Back to Top Button with Yarn Winding Animation
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      backToTopBtn.classList.add('top-animating');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      setTimeout(() => {
        backToTopBtn.classList.remove('top-animating');
      }, 800);
    });
  }

  // Live Gift Note Simulator Logic
  const giftRecipientInput = document.getElementById('giftRecipientInput');
  const giftMessageInput = document.getElementById('giftMessageInput');
  const giftSenderInput = document.getElementById('giftSenderInput');

  const previewRecipient = document.getElementById('previewRecipient');
  const previewMessage = document.getElementById('previewMessage');
  const previewSender = document.getElementById('previewSender');

  if (giftRecipientInput || giftMessageInput || giftSenderInput) {
    const updateNotePreview = () => {
      if (giftRecipientInput && previewRecipient) {
        const val = giftRecipientInput.value.trim();
        previewRecipient.textContent = val ? `${val},` : 'প্রিয় প্রিয়জন,';
      }

      if (giftMessageInput && previewMessage) {
        const val = giftMessageInput.value.trim();
        if (val) {
          // Remove existing outer quotes if user typed them to avoid double quotes
          const cleanVal = val.replace(/^["'“‘]+|["'”’]+$/g, '');
          previewMessage.textContent = `"${cleanVal}"`;
        } else {
          previewMessage.textContent = '"এখানে আপনার বিশেষ মেসেজটি সরাসরি ফুটে উঠবে..."';
        }
      }

      if (giftSenderInput && previewSender) {
        const val = giftSenderInput.value.trim();
        previewSender.textContent = val ? `ইতি — ${val}` : 'ইতি — আপনার নাম';
      }
    };

    ['input', 'keyup', 'change', 'paste'].forEach(eventType => {
      if (giftRecipientInput) giftRecipientInput.addEventListener(eventType, updateNotePreview);
      if (giftMessageInput) giftMessageInput.addEventListener(eventType, updateNotePreview);
      if (giftSenderInput) giftSenderInput.addEventListener(eventType, updateNotePreview);
    });

    // Run initial sync on load
    updateNotePreview();
  }

  // 12. Review Section: Filter Tabs & Live Search Logic
  const filterBtns = document.querySelectorAll('.btn-filter');
  const reviewItems = document.querySelectorAll('.review-item');
  const searchReviewInput = document.getElementById('searchReviewInput');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      reviewItems.forEach(item => {
        if (filter === 'all') {
          item.style.display = 'block';
        } else if (filter === 'with-photo') {
          const hasPhoto = item.getAttribute('data-has-photo') === 'true';
          item.style.display = hasPhoto ? 'block' : 'none';
        } else if (filter === '5-star') {
          const stars = item.getAttribute('data-stars');
          item.style.display = stars === '5' ? 'block' : 'none';
        }
      });
    });
  });

  if (searchReviewInput) {
    searchReviewInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      reviewItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  // 13. Write Review Modal Interactive Star Selection & Submit
  const starIcons = document.querySelectorAll('#starRatingSelect i');
  const selectedStarValue = document.getElementById('selectedStarValue');

  if (starIcons.length && selectedStarValue) {
    starIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const val = parseInt(icon.getAttribute('data-val'));
        selectedStarValue.value = val;
        starIcons.forEach((s, idx) => {
          if (idx < val) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill');
          } else {
            s.classList.remove('bi-star-fill');
            s.classList.add('bi-star');
          }
        });
      });
    });
  }

  const customerReviewForm = document.getElementById('customerReviewForm');
  if (customerReviewForm) {
    customerReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = document.getElementById('reviewAuthorName').value.trim();
      const location = document.getElementById('reviewLocation').value.trim();
      const content = document.getElementById('reviewTextContent').value.trim();
      const stars = selectedStarValue.value;
      const photoInput = document.getElementById('reviewPhotoInput');

      let photoUrl = '';
      if (photoInput && photoInput.files && photoInput.files[0]) {
        photoUrl = URL.createObjectURL(photoInput.files[0]);
      }

      // Generate HTML for new review
      const firstLetter = author ? author.charAt(0) : 'ক';
      const reviewsContainer = document.getElementById('reviewsContainer');

      const reviewCol = document.createElement('div');
      reviewCol.className = 'col-md-4 reveal-fade-up revealed review-item';
      reviewCol.setAttribute('data-stars', stars);
      reviewCol.setAttribute('data-has-photo', photoUrl ? 'true' : 'false');

      let starHtml = '';
      for (let i = 0; i < 5; i++) {
        starHtml += i < stars ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
      }

      let photoHtml = photoUrl ? `<div class="review-inline-photo mb-3"><img src="${photoUrl}" alt="কাস্টমার ফটো" class="rounded shadow-sm" style="height: 60px; width: 60px; object-fit: cover;"></div>` : '';

      reviewCol.innerHTML = `
        <div class="review-card">
          <div>
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="review-stars">${starHtml}</div>
              <span class="verified-badge"><i class="bi bi-patch-check-fill me-1"></i> ভেরিফাইড বায়ার</span>
            </div>
            <p class="review-text">"${content}"</p>
            ${photoHtml}
          </div>
          <div class="review-author">
            <div class="author-avatar">${firstLetter}</div>
            <div>
              <div class="author-name">${author}</div>
              <div class="author-location"><i class="bi bi-geo-alt me-1 text-primary-color"></i> ${location}</div>
            </div>
          </div>
        </div>
      `;

      if (reviewsContainer) {
        reviewsContainer.prepend(reviewCol);
      }

      // Hide Modal
      const modalEl = document.getElementById('writeReviewModal');
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
      }

      // Show Toast Notification
      if (toast && toastText) {
        toastText.textContent = 'আপনার পর্যালোচনাটি সফলভাবে যুক্ত করা হয়েছে! অসংখ্য ধন্যবাদ ❤️';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
      }

      customerReviewForm.reset();
    });
  }

  // 14. Lifestyle & Shop The Look Gallery Filter Logic
  const galleryFilterBtns = document.querySelectorAll('[data-gallery-filter]');
  const galleryFilterGridItems = document.querySelectorAll('.gallery-item');

  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-gallery-filter');
      galleryFilterGridItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (filter === 'all' || filter === cat) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
});
