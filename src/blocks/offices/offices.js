/* eslint-disable */

import ready from 'Utils/documentReady.js'
import Swiper from 'swiper'
import Scrollbar from 'smooth-scrollbar'

ready(function () {
  const offices = document.querySelectorAll('[data-offices]')
  offices.forEach(initBlock)
})

const initBlock = block => {

  const slider = block.querySelector('[data-slider]')

  const mapWrapper = block.querySelector('[data-offices-map-wrapper]')
  const points = mapWrapper.querySelectorAll('[data-point-district]')
  const pointHiddenClass = 'offices__point--hidden'

  const filter = block.querySelector('[data-offices-filter]')
  const filterOption = filter.querySelectorAll('[data-offices-filter-option]')
  const filterOptionActiveClass = 'offices__filter-option--active'

  const list = block.querySelector('[data-offices-list]')
  const listToggle = list.querySelector('[data-offices-list-toggle]')
  const listDistrictOpenClass = 'offices-list__district--open'
  const listDistrictTitle = list.querySelectorAll('[data-offices-list-district-title]')

  Scrollbar.init(mapWrapper)

  initSlider()
  initFilter()
  initList()

  function initSlider () {
    const defaultSetting = {
      slidesPerView: 'auto',
      spaceBetween: 16,
      breakpoints: {
        1440: {
          spaceBetween: 30
        },
        1280: {
          spaceBetween: 20
        },
      }
    }

    const setting = block.dataset.sliderSetting ? merge(defaultSetting, JSON.parse(block.dataset.sliderSetting)) : defaultSetting

    return new Swiper(slider, {
      ...setting,
    })
  }

  function initFilter () {
    filterOption.forEach(function (option) {
      option.addEventListener('click', (evt) => {
        if (block.classList.contains('offices--list-open')) return false
        if (!option.classList.contains(filterOptionActiveClass)) {
          const activeOption = filter.querySelector('.' + filterOptionActiveClass)
          if (activeOption) {
            activeOption.classList.remove(filterOptionActiveClass)
          }
          option.classList.add(filterOptionActiveClass)
          filterPoints(option.dataset.officesFilterOption)
        }
      })
    })

    function filterPoints (district) {
      if (district === 'all') {
        points.forEach(function (point) {
          point.classList.remove(pointHiddenClass)
        })
      } else {
        points.forEach(function (point) {
          if (point.dataset.pointDistrict === district) {
            point.classList.remove(pointHiddenClass)
          } else {
            point.classList.add(pointHiddenClass)
          }
        })
      }
    }
  }

  function initList () {
    listToggle.addEventListener('click', (evt) => {
      block.classList.toggle('offices--list-open')
    })
    listDistrictTitle.forEach(function (el) {
      el.addEventListener('click', (evt) => {
        el.closest('[data-offices-list-district]').classList.toggle(listDistrictOpenClass)
      })
    })
  }
}
