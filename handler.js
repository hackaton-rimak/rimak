'use strict';

const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();


module.exports.sentimentAnalisys = async (event) => {
    console.log("BRAYA", event)

  const body = JSON.parse(event.body);

  // Parámetros para el análisis de sentimiento
  const params = {
    LanguageCode: 'es',
    Text: body.text
  };

  return comprehend.detectSentiment(params).promise().then(
    async data => {
      const word = data.Sentiment.toLowerCase()
      const firstLetter = word.charAt(0)
      const firstLetterCap = firstLetter.toUpperCase()
      const remainingLetters = word.slice(1)
      const capitalizedWord = firstLetterCap + remainingLetters


      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            sentiment:data.Sentiment,
            sentimentPercentage:data.SentimentScore[capitalizedWord]
          },
          null,
          2
        ),
      };
    }
  )
};
