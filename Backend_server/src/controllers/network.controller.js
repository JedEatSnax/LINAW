// Authentication??

// async
exports.createNetwork = (req, res, next) => {
  // MSP Identification
  // generate files: crypto material via CA, channel configuration, and docker containers??
  // start network??
  try {
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};

exports.channelConfiguration = (req, res, next) => {
  // I dunno if need toh ng MSP identification, gotta read more :((
  try {
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};

// Orderer
// Policies
//
