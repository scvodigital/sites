import * as firebase from 'firebase/app';
import 'firebase/auth';
import "@babel/polyfill";
import 'leaflet';
import 'mapbox.js';
import { default as Headroom } from 'headroom.js';
import * as mdc from 'material-components-web';
import { MDCInitialiser } from '../../lib/mdc-initialiser';

export class Goodmoves {
  constructor(firebaseConfig) {
    this.firebaseConfig = firebaseConfig;
    this.app = firebase.initializeApp(this.firebaseConfig);
    
    this.displayMode = null;
    this.displayModes = [
      { name: 'mobile', min: 0, max: 599 },
      { name: 'tablet', min: 600, max: 959 },
      { name: 'desktop', min: 960, max: 20000 }
    ];

    this.snackbar = null;
    this.maps = {};

    this.ie = navigator.appName.indexOf('Microsoft') > -1 || navigator.userAgent.indexOf('Trident') > -1;
    this.occasionalDrawers = Array.from(document.querySelectorAll('.mdc-drawer--occasional')).map(el => {
      return {
        element: el,
        mdc: null
      };
    });
    
    $(window).on('resize', () => {
      this.windowResized();
    });
    this.windowResized();

    this.mdcInitialiser = new MDCInitialiser();
    this.mdcInitialiser.initialise();

    // Headroom
    var header = document.querySelector("header.top-bar-stuck");
    var headroom  = new Headroom(header, {
      "offset": 138,
      "tolerance": 5
    });
    headroom.init();
  }

  windowResized() {
    var width = $(window).width();
    var newDisplayMode = null;
    this.displayModes.forEach(function(mode) {
      if (width >= mode.min && width < mode.max) {
        newDisplayMode = mode.name;
      }
    });
    if (newDisplayMode !== this.displayMode) {
      this.displayMode = newDisplayMode;
      this.displayModeChanged();
    }
    this.fie();
  }

  displayModeChanged() {
    // console.log('Display Mode:', this.displayMode);
    
    this.occasionalDrawers.forEach(od => {
      var menuButton = $(od.element).data('menu-button');
      if (this.displayMode === 'desktop') {
        if (od.mdc) {
          od.mdc.destroy();
        }
        $(od.element).removeClass('mdc-drawer--modal');
        $(menuButton).off('click');
      } else {
        $(od.element).addClass('mdc-drawer--modal');
        od.mdc = mdc.drawer.MDCDrawer.attachTo(od.element);
        $(menuButton).on('click', () => { od.mdc.open = !od.mdc.open; });
      }
    });
  }

  fie() {
    if (!this.ie) return;
    $('.mdc-drawer--occasional .mdc-drawer__drawer').each(function(i, o) {
      var $o = $(o);
      var parentHeight = $o.parent().height();
      $o.css('height', parentHeight);
    });
  }

  setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; secure";
  }

  getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }
  
  disable(elements, disable) {
    disable = typeof disable === 'undefined' ? true : disable;
    for (var e = 0; e < elements.length; ++e) {
      var element = elements[e];
      var opacity = disable ? 0.5 : 1;
      $(element).prop('disabled', disable).css('opacity', opacity);
    }
  }

  snackbarShow(options) {
    var $snackbar = $('#app-snackbar');
    $snackbar.css($snackbar.data('defaultCss'));

    if (options.backgroundColor) {
      $snackbar.css('background-color', options.backgroundColor);
      delete options.backgroundColor;
    }
    if (options.color) {
      $snackbar.css('color', options.color);
      delete options.color;
    }
    this.snackbar.show(options);
  }

  popupPagerPage(pager, direction) {
    var currentPage = $(pager).find('.map-content:visible');
    var nextPage = currentPage;
    if (direction === 'next') {
      var nextElement = currentPage.next();
      if (!nextElement || nextElement.length === 0) {
        nextPage = $(pager).children().first();
      } else {
        nextPage = nextElement;
      }
    } else if (direction === 'back') {
      var prevElement = currentPage.prev();
      if (!prevElement || prevElement.length === 0) {
        nextPage = $(pager).children().last();
      } else {
        nextPage = prevElement;
      }
    }
    currentPage.hide();
    nextPage.show();
  }

  handleLocationBoxes() {
    $('[data-location-options]').each(function(i, o) {
      var options = $(o).data('location-options');
      var latSelector = $(o).data('location-lat');
      var lngSelector = $(o).data('location-lng');
      var lsSelector = $(o).data('location-services');

      var autocomplete = new google.maps.places.Autocomplete(o, options);
      autocomplete.addListener('place_changed', function(evt) {
        var place = this.getPlace();
        if (place.geometry.location) {
          $(o).val(place.formatted_address);
          $(latSelector).val(place.geometry.location.lat());
          $(lngSelector).val(place.geometry.location.lng());
        }
      });

      $(o).on('focus', function(evt) {
        if ($(latSelector).val() !== '') {
          $(o).val('');
          $(latSelector).val('');
          $(lngSelector).val('');
        }
      }).on('blur', function(evt) {
        if ($(latSelector).val() === '') {
          $(o).val('');
        }
      });

      $(lsSelector).on('click', function(evt) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            $(latSelector).val(lat);
            $(lngSelector).val(lng);

            var base = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=';
            var coords = lat + ',' + lng;
            var key = 'AIzaSyCT7vZkJdto5JoAUDx3asuHu7mHcl8UanQ';
            var url = base + coords + '&key=' + key + '&result_type=locality';
            $.getJSON(url, function(place) {
              if (place.results && place.results.length > 0) {
                var locality = place.results[0].address_components[0].short_name;
              }
              if (locality) {
                $(o).val(locality);
              } else {
                $(o).val(lat + ', ' + lng);
                goodmoves.snackbarShow({
                  message: 'Could not find a name for your location'
                });
              }
            });
          });
        }
      });
    }).on('keypress', function(evt) {
      if (evt.which === 13) {
        evt.preventDefault();
        return false;
      }
    });
  }
}
