/**
 * Find the optimal positioning of the widget. Creates divs for all the
 * necessary elements and then returns the divIds. Specifically, returns:
 *  {
 *    commentBox: ...
 *    goBox: ...
 *    iconBox: ...
 *  }
 *
 * divBox: The cropbox for the div.
 * boardRegion: The region of the go board that will be displayed.
 * ints: The number of intersections.
 * compsToUse: The board components requseted by the user
 * oneColSplits: The split percentages for a one-column format
 * twoColSplits: The split percentages for a two-column format
 */
glift.displays.positionWidget = function(
    divBox, boardRegion, ints, compsToUse, oneColSplits, twoColSplits) {
  var comps = glift.enums.boardComponents;
  var bcMap = {};
  for (var i = 0; i < compsToUse.length; i++) {
    bcMap[compsToUse[i]] = true;
  }
  var cropbox = glift.displays.cropbox.getFromRegion(boardRegion, ints);

  // These are simple heuristics.  They do not optimally place the board, but I
  // prefer the simplicity.
  var longBoxRegions = { TOP: true, BOTTOM: true };
  // Whether to position vertically (one column) or horizontally (two column).
  // By default, we draw a vertical box.
  var useVertical = true;

  if (!bcMap.hasOwnProperty(comps.COMMENT_BOX) ||
      !bcMap.hasOwnProperty(comps.BOARD)) {
    useVertical = true;
  } else if (divBox.hwRatio() < 0.45 && longBoxRegions[boardRegion]) {
    useVertical = false;
  } else if (divBox.hwRatio() < 0.800 && !longBoxRegions[boardRegion]) {
    // In other words, the width == 1.5 * height;
    // Also: Requires a comment box
    useVertical = false;
  } 

  if (useVertical) {
    var splits = glift.displays.recalcSplits(bcMap, oneColSplits);
    return glift.displays.positionWidgetVert(divBox, cropbox, bcMap, splits);
  } else {
    var splits = glift.displays.recalcSplits(bcMap, twoColSplits);
    return glift.displays.positionWidgetHorz(divBox, cropbox, bcMap, splits);
  }
};

glift.displays._extractRatios = function(column) {
  var out = [];
  for (var i = 0; i < column.length; i++) {
    out.push(column[i].ratio);   
  }
  return out;
};

/**
 * Recalculate the proper splits for a vertical orientation.
 *
 * compsToUseSet: Set of board components to use.
 * columnSplits: The splits for a 1 or 2 column orientation.
 */
glift.displays.recalcSplits = function(compsToUseSet, columnSplits) {
  var out = {};
  for (var colKey in columnSplits) {
    var col = columnSplits[colKey];
    var colOut = [];
    var extra = 0;

    var total = 0;
    for (var i = 0; i < col.length; i++) {
      var part = col[i];
      if (compsToUseSet[part.component]) {
        colOut.push({ // perform a copy
          component: part.component,
          ratio: part.ratio
        });
        total += part.ratio;
      }
    }
    if (colOut.length === 0) continue;
    for (var i = 0; i < colOut.length; i++) {
      var part = colOut[i];
      part.ratio = part.ratio / total;
    }
    out[colKey] = colOut;
  }
  return out;
};

glift.displays.positionWidgetVert = function(
    divBox, cropbox, componentMap, oneColSplits) {
  var point = glift.util.point;
  var aligns = glift.enums.boardAlignments;
  var comps = glift.enums.boardComponents;
  var outBoxes = {};
  var inOutMappings = {
    'BOARD': 'boardBox',
    'COMMENT_BOX': 'commentBox',
    'ICONBAR': 'iconBarBox',
    'TITLE_BAR': 'titleBarBox'
  }
  var ratios = glift.displays._extractRatios(oneColSplits.first);

  if (ratios.length === 1) {
    var splits = [];
    splits.push(divBox);
  } else {
    var splits = divBox.hSplit(ratios.slice(0, ratios.length - 1));
  }

  // Map from component name to split box.
  var splitMap = {};
  for (var i = 0; i < oneColSplits.first.length; i++) {
    var comp = oneColSplits.first[i];
    splitMap[comp.component] = splits[i];

  }

  // TODO(kashomon): Make this more algorithmic by looping over the splits.
  // This doesn't even do the right thing right now -- it forces the order to be
  // board->comment_box->iconbar
  // UPDATE(jetha): Okay, you can designate the order now.

  // Desired order.
  // TODO(jethac): Let themes designate the order, maybe?
  var order = [
    'TITLE_BAR',
    'BOARD',
    'COMMENT_BOX',
    'ICONBAR'
  ];
  var orderedBoxes = [];

  // TODO(jethac): Make this suck less than it does. Really, this is A Bad Way.
  var tempBoard = glift.displays.getResizedBox(
    splitMap.BOARD,
    cropbox,
    aligns.Top
  );

  var j = 0;
  for (var i = 0; i < order.length; i++) {
    var thisObj = splitMap[order[i]];
    if (thisObj) {
      var thisBox;
      var thisHeight = thisObj.height();
      switch (i) {
        case 0:      
          thisBox = glift.displays.bbox(
            point(tempBoard.left(), 0),
            tempBoard.width(),
            thisHeight
          );
          break;
        default:
          var prevBox = orderedBoxes[j - 1];
          thisBox = glift.displays.bbox(
            point(prevBox.left(), prevBox.bottom()),
            prevBox.width(),
            thisHeight
          );
          break;
      }
      // Add this box to the ordered box list.
      orderedBoxes.push(thisBox);
      // Add the box to the named box object.
      outBoxes[inOutMappings[order[i]]] = thisBox;
      j++;
    }
  };

  return outBoxes;
};

/**
 * Position a widget horizontally, i.e.,
 * |   X   X   |
 *
 * Since a resizedBox is designed to fill up either the h or w dimension. There
 * are only three scenarios:
 *  1. The GoBoardBox naturally touches the top & bottom
 *  2. The GoBoardBox naturally touches the left & right
 *  2. The GoBoardBox fits perfectly.
 *
 * Note, we should never position horizontally for TOP and BOTTOM board regions.
 *
 * returns:
 *
 *  {
 *    boardBox: ...
 *    commentBox: ...
 *    iconBarBox: ...
 *    rightSide: ...
 *    leftSide: ....
 *  }
 */
glift.displays.positionWidgetHorz = function(
    divBox, cropbox, componentMap, twoColSplits) {
  var point = glift.util.point;
  var aligns = glift.enums.boardAlignments;
  var comps = glift.enums.boardComponents;
  if (!comps.hasOwnProperty(comps.COMMENT_BOX)) {
    throw new Error('The component map must contain a comment box');
  }
  var boardBox = glift.displays.getResizedBox(divBox, cropbox, aligns.RIGHT);
  var outBoxes = {};

  // These are precentages of boardWidth.  We require a minimum width of 1/2 the
  // GoBoardWidth.
  // TODO(kashomon): Make this configurable.
  var minCommentPercent = 0.5;
  var minCommentBoxSize = boardBox.width() * minCommentPercent;
  var maxCommentPercent = 0.75;
  var maxCommentBoxSize = boardBox.width() * maxCommentPercent;
  var widthDiff = divBox.width() - boardBox.width();

  // The commentBoxPercentage is percentage of the width of the goboard that
  // we want the comment box to be.
  if (widthDiff < minCommentBoxSize) {
    var commentBoxPercentage = minCommentPercent;
  } else if (widthDiff >= minCommentBoxSize
      && widthDiff < maxCommentBoxSize) {
    var commentBoxPercentage = widthDiff / boardBox.width();
  } else {
    var commentBoxPercentage = maxCommentPercent;
  }
  outBoxes.commentBoxPercentage = commentBoxPercentage;

  // Split percentage is how much we want to split the boxes by.
  var desiredWidth = commentBoxPercentage * boardBox.width();
  var splitPercentage = boardBox.width() / (desiredWidth + boardBox.width());
  // This means that if the divBox is very wide (> maxCommentBoxSize +
  // boardWidth), so we just need to partition the box.
  var splits = divBox.vSplit([splitPercentage]);
  outBoxes.leftSide = splits[0];

  // Find out what the resized box look like now.
  var newResizedBox = glift.displays.getResizedBox(splits[0], cropbox, aligns.RIGHT);
  var rightSide = splits[1];
  outBoxes.rightSide = rightSide;
  var baseCommentBox = glift.displays.bboxFromPts(
      point(rightSide.topLeft().x(), newResizedBox.topLeft().y()),
      point(rightSide.botRight().x(), newResizedBox.botRight().y()));
  if (rightSide.width() > (0.75 * newResizedBox.width())) {
    baseCommentBox = baseCommentBox.vSplit(
        [0.75 * newResizedBox.width() / baseCommentBox.width()])[0];
  }

  // TODO(kashomon): Actually use the two-column splits.
  if (componentMap.hasOwnProperty(comps.ICONBAR)) {
    var finishedBoxes = baseCommentBox.hSplit([0.9]);
    outBoxes.commentBox = finishedBoxes[0];
    outBoxes.iconBarBox = finishedBoxes[1];
  } else {
    outBoxes.commentBox = baseCommentBox;
  }
  outBoxes.boardBox = newResizedBox;
  return outBoxes;
};

glift.displays.setNotSelectable = function(divId) {
  // Note to self: common vendor property patterns:
  //
  // -webkit-property => webkitProperty
  // -moz-property => MozProperty
  // -ms-property => msProperty
  // -o-property => OProperty
  // property => property
  $('#' + divId).css({
      'webkitTouchCallout': 'none',
      'webkitUserSelect': 'none',
      'MozUserSelect': 'moz-none',
      'msUserSelect': 'none',
      'user-select': 'none',
      'webkitHighlight': 'none',
      'webkitTapHighlightColor': 'rgba(0,0,0,0)',
      'cursor': 'default'
  });
};
