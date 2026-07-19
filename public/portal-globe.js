/* Drag-to-rotate for the analytics globe (/analytics). Progressive
   enhancement: the globe already auto-spins via CSS, so if this same-origin
   file never loads the globe still turns — this only adds touch/drag control
   with flick momentum that settles back into the ambient spin. */
;(() => {
  const globes = document.querySelectorAll('.globe')
  globes.forEach((globe) => {
    const spin = globe.querySelector('.globe-spin')
    if (!spin) return
    spin.style.animation = 'none' // take over from the CSS keyframe spin

    let half = spin.scrollWidth / 2 // one full map width; wrap at this for a seam-free loop
    const measure = () => {
      half = spin.scrollWidth / 2
    }
    window.addEventListener('resize', measure)

    const IDLE = -0.35 // ambient leftward drift, px per frame
    let x = 0
    let v = IDLE
    let dragging = false
    let lastX = 0

    const wrap = () => {
      if (!half) return
      while (x <= -half) x += half
      while (x > 0) x -= half
    }
    const frame = () => {
      if (globe.offsetParent !== null) {
        // offsetParent is null when hidden (the flat map shows on desktop),
        // so we only compute while the globe is actually on screen.
        if (!dragging) {
          x += v
          v += (IDLE - v) * 0.03 // ease flick momentum back to the idle spin
        }
        wrap()
        spin.style.transform = `translateX(${x.toFixed(2)}px)`
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    globe.addEventListener('pointerdown', (e) => {
      dragging = true
      lastX = e.clientX
      v = 0
      try {
        globe.setPointerCapture(e.pointerId)
      } catch (_) {
        // setPointerCapture can throw on stale pointers — safe to ignore.
      }
    })
    globe.addEventListener('pointermove', (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      x += dx
      v = dx // seed the flick momentum from the last drag delta
    })
    const release = () => {
      dragging = false
    }
    globe.addEventListener('pointerup', release)
    globe.addEventListener('pointercancel', release)
  })
})()
