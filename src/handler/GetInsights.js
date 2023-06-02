const {getInsights} = require("../service/GetInsightsService");

module.exports.handler = async (event) => {
    return getInsights(event)
};