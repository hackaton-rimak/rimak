const {processInsights} = require("../service/ProcessInsightsService");

module.exports.handler = async (event) => {
    return processInsights(event);
};