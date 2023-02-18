/* eslint-disable */

import ready from 'Utils/documentReady.js'

ready(function () {
  const offices = document.querySelectorAll('[data-directions]')
  offices.forEach(initBlock)
})

const initBlock = block => {
  const directionCards = block.querySelectorAll('[data-direction]')

  directionCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('direction--active')) {
        card.classList.remove('direction--active')
      } else {
        const activeCard = block.querySelector('.direction--active')
        if (activeCard) {
          activeCard.classList.remove('direction--active')
        }
        card.classList.add('direction--active')
      }
    })
  })
}
