glift.themes.registered.DEFAULT = {
  board: {
    boardAttr: {
      fill: "#f5be7e",
    },
    lineColor: "black",
    lineSize: 1,
    edgeLineSize: 1,
    starPointSize: .15, // As a fraction of the spacing.
    textColor: "white"
  },

  stones: {
    hoverOpacity: 0.5,
    "EMPTY" : {
      fill: 'blue',
      opacity: 0
    },
    "BLACK" : {
      fill: "black",
      opacity: 1,
      "stroke-width": 1, // The default value
      stroke: "black"
    },
    "BLACK_HOVER" : {
      fill: "black",
      opacity: 0.5
    },
    "WHITE" : {
      stroke: "black",
      fill: "white",
      opacity: 1,
      "stroke-width": 1 // The default value
    },
    "WHITE_HOVER" : {
      fill: "white",
      opacity: 0.5
    }
  },

  marks: {
    // TODO(kashomon): add
    XMARK : {
    }
  }
};