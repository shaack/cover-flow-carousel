class TextAutoFit {
    constructor(element, options = {}) {
        this.element = element
        this.options = {
            minFontSize: options.minFontSize || 10,
            maxFontSize: options.maxFontSize || 200,
            resolution: options.resolution || 1,
            ...options
        }
        this.fit()
    }

    fit() {
        const element = this.element
        const style = window.getComputedStyle(element)
        const paddingLeft = parseFloat(style.paddingLeft) || 0
        const paddingRight = parseFloat(style.paddingRight) || 0
        const paddingTop = parseFloat(style.paddingTop) || 0
        const paddingBottom = parseFloat(style.paddingBottom) || 0

        const containerWidth = element.clientWidth - paddingLeft - paddingRight
        const containerHeight = element.clientHeight - paddingTop - paddingBottom

        let low = this.options.minFontSize
        let high = this.options.maxFontSize

        while (low <= high) {
            const fontSize = Math.floor((low + high) / 2)
            element.style.fontSize = fontSize + 'px'

            if (element.scrollWidth <= containerWidth && element.scrollHeight <= containerHeight) {
                low = fontSize + this.options.resolution
            } else {
                high = fontSize - this.options.resolution
            }
        }

        element.style.fontSize = high + 'px'
    }
}

export class CoverFlowCarousel {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container
        this.items = options.items || []
        this.currentIndex = 0

        // Drag state
        this.isDragging = false
        this.dragStartX = 0
        this.dragOffset = 0

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

        // Apply auto-fit to all quotes
        this.fitQuotes()

        // Re-fit on window resize
        let resizeTimeout
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => this.fitQuotes(), 100)
        })
    }

    fitQuotes() {
        this.container.querySelectorAll('.cfc-quote').forEach(quote => {
            new TextAutoFit(quote, { minFontSize: 12, maxFontSize: 24 })
        })
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
        this.track.addEventListener('touchstart', (e) => this.handleDragStart(e.changedTouches[0].screenX), { passive: true })
        this.track.addEventListener('touchmove', (e) => this.handleDragMove(e.changedTouches[0].screenX), { passive: true })
        this.track.addEventListener('touchend', () => this.handleDragEnd())

        // Mouse events for drag
        this.track.addEventListener('mousedown', (e) => {
            e.preventDefault()
            this.handleDragStart(e.screenX)
        })
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) this.handleDragMove(e.screenX)
        })
        document.addEventListener('mouseup', () => {
            if (this.isDragging) this.handleDragEnd()
        })

        // Wheel events for touchpad swipe
        // this.track.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false })

        // Keyboard navigation
        this.container.setAttribute('tabindex', '0')
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e))
    }

    handleDragStart(x) {
        this.isDragging = true
        this.dragStartX = x
        this.dragOffset = 0
        this.setTransitions(false)
        this.updateCardPositions()
        this.track.classList.add('cfc-dragging')
    }

    handleDragMove(x) {
        if (!this.isDragging) return
        this.dragOffset = x - this.dragStartX
        this.updateCardPositions()
    }

    handleDragEnd() {
        if (!this.isDragging) return
        this.isDragging = false
        this.setTransitions(true)
        this.track.classList.remove('cfc-dragging')

        const threshold = 80
        if (this.dragOffset < -threshold && this.currentIndex < this.items.length - 1) {
            this.currentIndex++
        } else if (this.dragOffset > threshold && this.currentIndex > 0) {
            this.currentIndex--
        }

        this.dragOffset = 0
        this.updateDisplay()
    }

    handleWheel(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault()

            if (!this.isDragging) {
                this.isDragging = true
                this.dragOffset = 0
                this.setTransitions(false)
            }

            this.dragOffset -= e.deltaX
            this.updateCardPositions()

            clearTimeout(this.wheelTimeout)
            this.wheelTimeout = setTimeout(() => this.handleDragEnd(), 100)
        }
    }

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') {
            this.prev()
        } else if (e.key === 'ArrowRight') {
            this.next()
        }
    }

    setTransitions(enabled) {
        this.cards.forEach(card => {
            card.style.transition = enabled ? '' : 'none'
        })
    }

    updateCardPositions() {
        const trackWidth = this.track.offsetWidth
        const maxDrag = 150
        const clampedOffset = Math.max(-maxDrag, Math.min(maxDrag, this.dragOffset))
        const dragPercent = (clampedOffset / trackWidth) * 100

        // Match CSS media query breakpoints
        const baseOffset = window.innerWidth >= 992 ? 70 : 80

        this.cards.forEach((card, index) => {
            const relativeIndex = index - this.currentIndex
            let translateX = 0
            let scale = 0.85
            let opacity = 0.6

            if (relativeIndex === 0) {
                translateX = dragPercent
                scale = 1 - Math.abs(clampedOffset) / maxDrag * 0.15
                opacity = 1
            } else if (relativeIndex === -1) {
                translateX = -baseOffset + dragPercent * 0.5
                if (clampedOffset > 0) {
                    scale = 0.85 + (clampedOffset / maxDrag) * 0.15
                    opacity = 0.6 + (clampedOffset / maxDrag) * 0.4
                }
            } else if (relativeIndex === 1) {
                translateX = baseOffset + dragPercent * 0.5
                if (clampedOffset < 0) {
                    scale = 0.85 + (Math.abs(clampedOffset) / maxDrag) * 0.15
                    opacity = 0.6 + (Math.abs(clampedOffset) / maxDrag) * 0.4
                }
            } else {
                opacity = 0
                scale = 0.7
            }

            card.style.transform = `scale(${scale}) translateX(${translateX}%)`
            card.style.opacity = opacity
        })
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
        // Update cards with final positions
        this.cards.forEach((card, index) => {
            const offset = index - this.currentIndex
            card.classList.remove('cfc-card-active', 'cfc-card-prev', 'cfc-card-next', 'cfc-card-hidden')
            card.style.transform = ''
            card.style.opacity = ''

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
