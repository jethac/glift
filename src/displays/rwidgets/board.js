(function() {

// should inherit from base widget
otre.displays.rwidgets.board = function(options, factory) {
  return new GoBoard(options);
};

var GoBoard = function(boardOptions) {
  factory.createBaseBoard()
      .createBoardLines()
      .createStarPoints()
      .createStones();
};

GoBoard.prototype = {
  draw: function() {
    factory.drawAll();
  }
};
})();
