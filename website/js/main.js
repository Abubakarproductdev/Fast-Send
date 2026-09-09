/**
 * Fast Send - Website Interactivity & Utility Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.flexDirection = 'column';
        navLinks.style.backgroundColor = 'var(--color-cream)';
        navLinks.style.padding = '1.5rem';
        navLinks.style.borderBottom = 'var(--border-md)';
        navLinks.style.boxShadow = 'var(--shadow-md)';
      }
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
        }
      });
    });
  }

  // 2. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close all other items
        faqItems.forEach(other => other.classList.remove('active'));
        // Toggle current item
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // 3. Smooth scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // 4. Data Deletion Form Simulation
  const deletionForm = document.getElementById('deletion-request-form');
  if (deletionForm) {
    deletionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('user-email');
      const tripCodeInput = document.getElementById('trip-code');
      const submitBtn = deletionForm.querySelector('button[type="submit"]');

      if (!emailInput || !emailInput.value) {
        alert('Please enter your email or phone number.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      setTimeout(() => {
        const alertBox = document.getElementById('deletion-success-alert');
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.scrollIntoView({ behavior: 'smooth' });
        }
        deletionForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Deletion Request';
      }, 1000);
    });
  }

  // 5. Copy Email Helper
  window.copySupportEmail = function() {
    const email = 'support@fastsend.app';
    navigator.clipboard.writeText(email).then(() => {
      alert('Support email copied to clipboard: ' + email);
    }).catch(() => {
      prompt('Copy our support email:', email);
    });
  };
});
