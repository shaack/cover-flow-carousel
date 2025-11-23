export class CoverFlowCarousel {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container
        this.items = options.items || []
        this.currentIndex = 0
        this.touchStartX = 0
        this.touchEndX = 0

        this.init()
    }

    init() {
        this.render()
        this.bindEvents()
        this.updateDisplay()
    }

    render() {
        this.container.innerHTML = `
            <div class="cfc-wrapper">
                <button class="cfc-nav cfc-nav-prev" aria-label="Previous">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                </button>

                <div class="cfc-track">
                    ${this.items.map((item, index) => this.renderCard(item, index)).join('')}
                </div>

                <button class="cfc-nav cfc-nav-next" aria-label="Next">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,6 15,12 9,18"></polyline>
                    </svg>
                </button>

                <div class="cfc-dots">
                    ${this.items.map((_, index) => `
                        <button class="cfc-dot" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
                    `).join('')}
                </div>
            </div>
        `

        this.track = this.container.querySelector('.cfc-track')
        this.cards = this.container.querySelectorAll('.cfc-card')
        this.dots = this.container.querySelectorAll('.cfc-dot')
        this.prevBtn = this.container.querySelector('.cfc-nav-prev')
        this.nextBtn = this.container.querySelector('.cfc-nav-next')
    }

    renderCard(item, index) {
        return `
            <div class="cfc-card" data-index="${index}" style="--card-bg: ${item.bgColor || '#f8f9fa'}">
                <div class="cfc-card-content">
                    <blockquote class="cfc-quote">${item.quote}</blockquote>
                    <div class="cfc-author">
                        <img class="cfc-avatar" src="${item.avatar}" alt="${item.name}">
                        <div class="cfc-author-info">
                            <div class="cfc-name">${item.name}</div>
                            <div class="cfc-title">${item.title}</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    bindEvents() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prev())
        this.nextBtn.addEventListener('click', () => this.next())

        // Dot navigation
        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.goTo(parseInt(e.target.dataset.index))
            })
        })

        // Touch events for swipe
        this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true })
        this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true })
        this.track.addEventListener('touchend', () => this.handleTouchEnd())

        // Keyboard navigation
        this.container.setAttribute('tabindex', '0')
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e))
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX
    }

    handleTouchMove(e) {
        this.touchEndX = e.changedTouches[0].screenX
    }

    handleTouchEnd() {
        const diff = this.touchStartX - this.touchEndX
        const threshold = 50

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next()
            } else {
                this.prev()
            }
        }
    }

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') {
            this.prev()
        } else if (e.key === 'ArrowRight') {
            this.next()
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--
            this.updateDisplay()
        }
    }

    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++
            this.updateDisplay()
        }
    }

    goTo(index) {
        if (index >= 0 && index < this.items.length) {
            this.currentIndex = index
            this.updateDisplay()
        }
    }

    updateDisplay() {
        // Update cards
        this.cards.forEach((card, index) => {
            const offset = index - this.currentIndex
            card.classList.remove('cfc-card-active', 'cfc-card-prev', 'cfc-card-next', 'cfc-card-hidden')

            if (offset === 0) {
                card.classList.add('cfc-card-active')
            } else if (offset === -1) {
                card.classList.add('cfc-card-prev')
            } else if (offset === 1) {
                card.classList.add('cfc-card-next')
            } else {
                card.classList.add('cfc-card-hidden')
            }
        })

        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex)
        })

        // Update navigation buttons
        this.prevBtn.disabled = this.currentIndex === 0
        this.nextBtn.disabled = this.currentIndex === this.items.length - 1
    }
}
