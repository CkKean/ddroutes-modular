generateTrackingId = (prefix, suffix) => {
    return prefix + Math.random().toString(36).substr(2, 6).toUpperCase() + suffix;
}

module.exports = generateTrackingId;
