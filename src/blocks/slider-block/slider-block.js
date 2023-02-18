/* eslint-disable */

import ready from 'Utils/documentReady.js'
import Swiper, { Autoplay, Navigation, Pagination } from 'swiper'
import merge from 'lodash.merge';

ready(function () {
  const sliderEls = document.querySelectorAll('[data-slider-block]')
  sliderEls.forEach(createSlider)
})

const createSlider = block => {
  const slider = block.querySelector('[data-slider]'),
    sliderNext = block.querySelector('[data-slider-button-next]'),
    sliderPrev = block.querySelector('[data-slider-button-prev]'),
    pagination = block.querySelector('[data-slider-pagination]');

  const delay = block.dataset.sliderDelay || 10000

  const defaultSetting = {
    slidesPerView: 1,
    spaceBetween: 16
  }

  const setting = block.dataset.sliderSetting ? merge(defaultSetting, JSON.parse(block.dataset.sliderSetting)) : defaultSetting;

  return new Swiper(slider, {
    modules: [Navigation, Pagination, Autoplay],
    navigation: {
      nextEl: sliderNext,
      prevEl: sliderPrev
    },
    autoplay: {
      disableOnInteraction: false,
      delay
    },
    pagination: {
      el: pagination,
      type: 'bullets',
      clickable: true,
      renderBullet: function (index, className) {
        return '<span class="' + className + '" style="animation-duration: ' + delay + 'ms;"></span>'
      }
    },
    ...setting,
  })
}
