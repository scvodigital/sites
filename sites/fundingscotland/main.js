import "@babel/polyfill";
import { default as Headroom } from 'headroom.js';
import * as mdc from 'material-components-web';
import { ComponentsInitialiser } from '../../lib/components-initialiser';
import { Auth } from '../../lib/firebase-auth';
import * as querystring from 'querystring';

import * as cookieInfoScript from '../../lib/cookie-info-script' ;

window.firebase = firebase;

export class FundingScotland {
  constructor(firebaseConfig) {
    this.firebaseConfig = firebaseConfig;
    this.auth = new Auth(this.firebaseConfig, '/upgrade-token?token={idToken}', 'fs_cookie');

    this.displayMode = null;
    this.displayModes = [
      { name: 'mobile', min: 0, max: 599 },
      { name: 'tablet', min: 600, max: 959 },
      { name: 'desktop', min: 960, max: 20000 }
    ];

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

    this.componentsInitialiser = new ComponentsInitialiser();
    this.componentsInitialiser.initialise();

    // Headroom
    var header = document.querySelector("header.top-bar-stuck");
    var headroom  = new Headroom(header, {
      "offset": 100,
      "tolerance": 5
    });
    headroom.init();

    const ci = new cookieinfo();
    ci.options.message = "We use cookies to track anonymous usage statistics and do not collect any personal information that can be used to identify you. By continuing to visit this site you agree to our use of cookies.";
    ci.options.fontFamily = "'Open Sans',Helvetica,Arial,sans-serif";
    ci.options.bg = "#fff";
    ci.options.link = "#448532";
    ci.options.divlink = "#fff";
    ci.options.divlinkbg = "#448532";
    ci.options.position = "bottom";
    ci.options.acceptOnScroll = "true";
    ci.options.moreinfo = "/cookies";
    ci.options.cookie = "CookieInfoScript";
    ci.options.textAlign = "left";
    ci.run();

    this.$hideFundDialog = $('#hide-fund-dialog');
    if (this.$hideFundDialog.length > 0) {
      this.hideFundDialog = new mdc.dialog.MDCDialog(this.$hideFundDialog[0]);
      $('[data-hide-fund-id]').on('click', (evt) => {
        const $el = $(evt.currentTarget);
        const id = $el.data('hide-fund-id');
        const redirect = $el.data('hide-fund-redirect');
        const name = $el.data('hide-fund-name');

         $('#hide-fund-dialog-id').val(id);
        $('#hide-fund-dialog-redirect').val(redirect);
        $('#hide-fund-dialog-name').text(name);

         this.hideFundDialog.open();
      });
    }

    this.$saveSearchDialog = $('#save-search-dialog');
    if (this.$saveSearchDialog.length > 0) {
      this.saveSearchDialog = new mdc.dialog.MDCDialog(this.$saveSearchDialog[0]);
      $('.save-search-dialog-button').on('click', (evt) => {
        const search = location.search.substring(1);
        const query = querystring.parse(search);
        const selected = {};
        for (const [selectedField, selectedTerm] of Object.entries(query)) {
          const selectedTerms = Array.isArray(selectedTerm) ? selectedTerm : [selectedTerm];
          if (!terms[selectedField]) continue;
          const field = terms[selectedField];
          selected[field.label] = [];
          for (const [termGroupName, termGroup] of Object.entries(field.termGroups)) {
            const inGroup = [];
            for (const [term, termItem] of Object.entries(termGroup.terms)) {
              if (selectedTerms.indexOf(term) > -1) {
                inGroup.push(termItem.label);
              }
            }
            if (inGroup.length === Object.keys(termGroup.terms).length) {
              selected[field.label].push(termGroup.label);
            } else {
              selected[field.label].push(...inGroup);
            }
          }
        }
        const nameParts = [];
        if (query.keywords) {
          nameParts.push('Keywords: ' + keywords);
        }
        for (const [field, terms] of Object.entries(selected)) {
          if (terms.length > 2) {
            nameParts.push(field + ': ' + terms.slice(0, 2).join(', ') + ' (+' + (terms.length - 2) + ')');
          } else {
            nameParts.push(field + ': ' + terms.join(', '))
          }
        }
        const name = nameParts.join(' - ');
        $('#saved-search-name').val(name.substr(0, 254));

         this.saveSearchDialog.open();
      });
    }
    this.helpBoxes();
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
    // console.log('Display Mode!xs:', this.displayMode);
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

  helpBoxes() {
    this.$helpBoxes = $('[data-help-box-id]').each((i, o) => {
      const $helpBox = $(o);
      const id = $helpBox.data('help-box-id');
      const $dismissButton = $helpBox.find('.help-box__dismiss-button');
      $dismissButton.on('click', (evt) => {
        $helpBox.addClass('help-box--dismissed');
        const dismissedCookie = this.getCookie('fs_dismissed') || '';
        const dismissedList = dismissedCookie.substr(1, dismissedCookie.length - 2).split('][');
        if (dismissedList.indexOf(id) === -1) {
          dismissedList.push(id);
        }
        const newCookie = '[' + dismissedList.join('][') + ']';
        this.setCookie('fs_dismissed', newCookie);
      });
    });

    this.$helpBoxToggles = $('[data-help-box-toggle]').click(evt => {
      const $helpBoxToggle = $(evt.currentTarget);
      const id = $helpBoxToggle.data('help-box-toggle');
      const $helpBox = $('[data-help-box-id="' + id + '"]');

      if ($helpBox.hasClass('help-box--dismissed')) {
        $helpBox.removeClass('help-box--dismissed');
      } else {
        $helpBox.addClass('help-box--flash').fadeOut(50).fadeIn(250);
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
    console.log('DEPRECATED SNACKBARSHOW CALLED:', arguments);
  }
}