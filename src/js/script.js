/* global document window*/

import './polyfills'
import ready from 'Utils/documentReady.js'
import LazyLoad from 'vanilla-lazyload'
import throttle from 'lodash.throttle'

ready(function () {
  const app = {}

  app.init = function () {
    app.lazyLoad()
    setTimeout(function () {
      app.initAnimations()
    }, 200)
  }

  app.initAnimations = function () {
    var animations = document.querySelectorAll('[data-animation]'),
      top = null,
      winHeight = null

    updatePosition()

    function updatePosition () {

      winHeight = window.innerHeight

      animations.forEach(function (el) {
        if (el.classList.contains('active-animation')) return

        const type = el.dataset.animation
        const offset = +el.dataset.animationOffset || 0.7
        const sourceOffset = document.querySelector(el.dataset.sourceOffset) || el
        top = sourceOffset.getBoundingClientRect().top
        if (top <= winHeight * offset) {
          switch (type) {
            case 'numbers':
              app.numbersAnimation(el)
              break
            case 'words':
              app.wordsAnimation(el)
              break
            case 'offices':
              app.officesAnimation(el)
              break
          }
          el.classList.add('active-animation')
        }
      })
    }

    document.addEventListener('scroll', throttle(updatePosition, 50))
  }

  app.wordsAnimation = function (block) {
    const blocks = block.querySelectorAll('[data-words-animation]')

    blocks.forEach(function (item) {
      const words = item.querySelectorAll('.word')
      words.forEach(function (word) {
        const wordWrap = word.querySelector('.word-wrap')
        const lineNum = (word.offsetTop - item.offsetTop) / word.clientHeight
        wordWrap.classList = ''
        wordWrap.classList.add('word-wrap')
        wordWrap.classList.add(`line-${lineNum}`)
      })
    })
  }

  app.numbersAnimation = function (block) {
    const numbers = block.querySelectorAll('[data-animate-number]')
    numbers.forEach(function (el) {
      animateNumber(el)
    })

    function animateNumber (element) {
      const time = 1000
      let text = 0
      let value = +element.dataset.animateNumber
      const step = Math.ceil(value / 10)
      let t = Math.round(time / (value / step))
      let interval = setInterval(() => {
        text = text + step
        if (text >= value) {
          text = value
          clearInterval(interval)
        }
        element.innerHTML = text
      }, t)
    }
  }

  app.officesAnimation = function (block) {
    const points = block.querySelectorAll('[data-point-district]')
    points.forEach(function (point) {
      point.style.transitionDelay = Math.ceil(Math.random() * 300) + 'ms'
    })
  }

  app.lazyLoad = function () {
    new LazyLoad({
      cancel_on_exit: false,
    })

    // Используется для загрузки картинок которые на половину выходят за видимую область (без контейнера не загружается)
    const lazyLoadInstances = []

    const initOneLazyLoad = function (horizContainerElement) {
      var oneLL = new LazyLoad({
        container: horizContainerElement
      })
      lazyLoadInstances.push(oneLL)
    }

    new LazyLoad({
      elements_selector: '.lazy-container',
      callback_enter: initOneLazyLoad,
      unobserve_entered: true,
      cancel_on_exit: false,
    })
  }

  app.init()
})
