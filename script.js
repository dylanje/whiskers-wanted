const ADOPTION_EMAIL = 'hello@whiskerswanted.com'

async function init() {
  const res = await fetch('cats.json')
  const data = await res.json()
  renderCurrentCat(data.current)
  renderArchive(data.archive)
  initGalleryCarousel()
  initLightbox()
}

function renderCurrentCat(cat) {
  document.getElementById('cat-name').textContent = cat.name
  document.getElementById('cat-tagline').textContent = cat.tagline
  document.getElementById('cat-bio').textContent = cat.bio

  const locationEl = document.getElementById('cat-location')
  locationEl.textContent = cat.location ? `📍 ${cat.location}` : ''
  locationEl.hidden = !cat.location

  const gallery = document.getElementById('cat-gallery')
  gallery.innerHTML = ''
  cat.photos.forEach(src => {
    const img = document.createElement('img')
    img.src = src
    img.alt = `Photo of ${cat.name}`
    img.tabIndex = 0
    img.setAttribute('role', 'button')
    gallery.appendChild(img)
  })

  const traitsList = document.getElementById('cat-traits')
  traitsList.innerHTML = ''
  cat.traits.forEach(trait => {
    const li = document.createElement('li')
    li.textContent = trait
    traitsList.appendChild(li)
  })

  const redFlagsList = document.getElementById('cat-redflags')
  redFlagsList.innerHTML = ''
  cat.redFlags.forEach(flag => {
    const li = document.createElement('li')
    li.textContent = flag
    redFlagsList.appendChild(li)
  })

  const emailButton = document.getElementById('email-button')
  const subject = encodeURIComponent(`Adopting ${cat.name}!`)
  const body = encodeURIComponent(
    `Hi! I'd love to learn more about ${cat.name} and the adoption process.`
  )
  emailButton.href = `mailto:${ADOPTION_EMAIL}?subject=${subject}&body=${body}`

  const catCard = document.getElementById('featured-cat')
  const banner = document.getElementById('adopted-banner')
  const adoptedNote = document.getElementById('adopted-note')

  if (cat.status === 'adopted') {
    catCard.classList.add('is-adopted')
    banner.hidden = false
    emailButton.classList.add('disabled')
    emailButton.removeAttribute('href')
    emailButton.textContent = 'Already Adopted'
    adoptedNote.hidden = false
    adoptedNote.textContent = cat.adoptedDate
      ? `${cat.name} found their forever home on ${formatDate(cat.adoptedDate)}. Check back soon for our next star!`
      : `${cat.name} has found their forever home. Check back soon for our next star!`
  }
}

function renderArchive(archive) {
  const grid = document.getElementById('archive-grid')
  grid.innerHTML = ''
  archive.forEach(cat => {
    const card = document.createElement('div')
    card.className = 'archive-card'

    const img = document.createElement('img')
    img.src = cat.photo
    img.alt = `Photo of ${cat.name}`

    const name = document.createElement('h3')
    name.textContent = cat.name

    const tagline = document.createElement('p')
    tagline.className = 'archive-tagline'
    tagline.textContent = cat.tagline

    const date = document.createElement('p')
    date.className = 'archive-date'
    date.textContent = `Adopted ${formatDate(cat.adoptedDate)}`

    const blurb = document.createElement('p')
    blurb.className = 'archive-blurb'
    blurb.textContent = cat.blurb

    card.append(img, name, tagline, date, blurb)
    grid.appendChild(card)
  })
}

function initGalleryCarousel() {
  const track = document.getElementById('cat-gallery')
  const prevBtn = document.getElementById('gallery-prev')
  const nextBtn = document.getElementById('gallery-next')
  if (!track || !prevBtn || !nextBtn) return

  const scrollByOneSlide = direction => {
    const slide = track.querySelector('img')
    if (!slide) return
    const slideWidth = slide.getBoundingClientRect().width
    const gap = parseFloat(getComputedStyle(track).gap || '0')
    track.scrollBy({ left: direction * (slideWidth + gap), behavior: 'smooth' })
  }

  prevBtn.addEventListener('click', () => scrollByOneSlide(-1))
  nextBtn.addEventListener('click', () => scrollByOneSlide(1))
}

function initLightbox() {
  const gallery = document.getElementById('cat-gallery')
  const dialog = document.getElementById('lightbox')
  if (!gallery || !dialog || typeof dialog.showModal !== 'function') return

  const view = document.getElementById('lightbox-img')
  const prevBtn = document.getElementById('lightbox-prev')
  const nextBtn = document.getElementById('lightbox-next')
  const closeBtn = document.getElementById('lightbox-close')
  let index = 0

  const photos = () => Array.from(gallery.querySelectorAll('img'))

  const show = i => {
    const list = photos()
    index = (i + list.length) % list.length
    view.src = list[index].src
    view.alt = list[index].alt
  }

  const open = i => {
    show(i)
    const multiple = photos().length > 1
    prevBtn.hidden = !multiple
    nextBtn.hidden = !multiple
    dialog.showModal()
  }

  gallery.addEventListener('click', e => {
    const i = photos().indexOf(e.target)
    if (i !== -1) open(i)
  })

  gallery.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'IMG') {
      e.preventDefault()
      open(photos().indexOf(e.target))
    }
  })

  prevBtn.addEventListener('click', () => show(index - 1))
  nextBtn.addEventListener('click', () => show(index + 1))
  closeBtn.addEventListener('click', () => dialog.close())

  // The dialog fills the viewport, so a click on it (not on the photo or a
  // button) is a click on the backdrop.
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close()
  })

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1)
    if (e.key === 'ArrowRight') show(index + 1)
  })

  // Leave the carousel on the photo the visitor ended on.
  dialog.addEventListener('close', () => {
    view.removeAttribute('src')
    const current = photos()[index]
    if (current) current.scrollIntoView({ block: 'nearest', inline: 'center' })
  })
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

init()
