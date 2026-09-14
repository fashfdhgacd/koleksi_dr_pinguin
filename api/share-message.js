module.exports = function shareLines(take) {
  return take.map(function (x) {
    return (
      "\u25b6 " +
      x.title +
      "\nhttps://www.koleksidrpinguin.com/v/" +
      x.key +
      "\nhttps://www.koleksidrpinguin.site/#/v/" +
      x.key
    );
  });
};
