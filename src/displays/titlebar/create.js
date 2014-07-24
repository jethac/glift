/**
 * Create a titlebar with:
 *
 * divId: The div in which the comment box should live
 * posBbox: The bounding box of the div (expensive to recompute)
 * theme: The theme object.
 */
glift.displays.titlebar.create = function(divId, posBbox, theme) {
  if (!theme) {
    throw new Error('Theme must be defined. was: ' + theme);
  }
  return new glift.displays.titlebar._TitleBar(divId, posBbox, theme).draw();
};

glift.displays.titlebar._TitleBar = function(divId, positioningBbox, theme) {
  this.divId = divId;
  this.bbox = glift.displays.bboxFromPts(
      glift.util.point(0,0),
      glift.util.point(positioningBbox.width(), positioningBbox.height()));
  this.theme = theme;
  this.el = undefined;
};

glift.displays.titlebar._TitleBar.prototype = {
  draw: function() {
    this.el = glift.displays.dom.elem(this.divId);
    this.el.html('<span id="' + this.divId + 'title' + '"></span>');
    this.elTitle = glift.displays.dom.elem(this.divId + 'title');
    if (this.el === null) {
      throw new Error('Could not find element with ID ' + this.divId);
    }
    var cssObj = {
      'overflow-y': 'auto',
      'overflowY': 'auto',
      'MozBoxSizing': 'border-box',
      'box-sizing': 'border-box',
      'text-align': 'center',
      'background': '#0f0'
    };
    var cssObj_title = {
    }
    if (this.theme.titleBar) {
      for (var key in this.theme.titleBar.css) {
        cssObj[key] = this.theme.titleBar.css[key]
      }
      for (var key in this.theme.titleBar.title.css) {
        cssObj_title[key] = this.theme.titleBar.title.css[key]
      }
    }
    this.el.css(cssObj);
    this.elTitle.css(cssObj_title);
    return this;
  },

  sanitize: function(text) {
    // re-use commentbox sanitizer for now
    return glift.displays.commentbox.sanitize(text);
  },

  setText: function(text) {
    this.elTitle.html(text.replace(/\n/g, ''));
  },

  clearText: function() {
    this.elTitle.html('');
  },

  destroy: function() {
    this.titlebarObj.empty();
  }
};
