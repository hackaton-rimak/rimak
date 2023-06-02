'use strict';
const AWS = require('aws-sdk');
const {Bot, session, InlineKeyboard} = require("grammy");
const {conversations, createConversation} = require("@grammyjs/conversations");
const {get} = require("lodash");
const { Q2, Q3, Q4, G1, Q1, ProductList}  = require("../constants/labels");


const lambda = new AWS.Lambda();
const comprehend = new AWS.Comprehend();

const TOKEN_BOT = "6056613927:AAEK1c8BVJRUTxxKb66_CmrZHheXifb3tVc";
const bot = new Bot(TOKEN_BOT);

module.exports.sentimentAnalisys = async (event) => {
  const body = JSON.parse(event.body);

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

module.exports.webhookBot = async (event) => {
    try{
        const parseBody = JSON.parse(event.body)
        console.log("info passed: ", parseBody);
        await bot.init();

        await bot.handleUpdate(parseBody);

        return { statusCode: 200, body: 'OK' };
    } catch (error){
        console.log("", error);
        return { statusCode: 500, body: error.toString() };
    }
};

// Install the session plugin.
bot.use(session({
    initial() {
        // return empty object for now
        return {};
    },
}));

bot.use(conversations());

async function showMenu(ctx) {
    const keyboard = new InlineKeyboard()
        .text("Encuesta de satisfacción", 'survey').row()
        .text("Danos un feedback", "feedback");

    await ctx.reply('¡Kushki te escucha!', {
        reply_markup: keyboard
    });
}
async function invokeInsights(request){
    let params = {
        FunctionName: 'rimak-dev-processInsights',
        LogType: 'Tail',
        Payload:JSON.stringify({body: JSON.stringify(request)}),
    };


    return lambda.invoke(params).promise();
}
async function survey(conversation, ctx) {
    await ctx.reply(Q1);
    const message1 = await conversation.form.number();
    await ctx.reply(Q2);
    const message2 = await conversation.form.number();
    await ctx.reply(Q3);
    const message3 = await conversation.form.number();
    await ctx.reply(Q4);
    const message4 = await conversation.form.text();
    await ctx.reply(G1);

    await showMenu(ctx);

    const request = {
        flow: "form",
        indicator: [
            {
                question: Q1,
                value: message1,
            },
            {
                question: Q2,
                value: message2
            },
            {
                question: Q3,
                value: message3
            },
        ],
        client: ctx.chat.first_name,
        comment: message4,
        product: "",
    };

    await invokeInsights(request);
}
async function feedback(conversation, ctx) {
    await ctx.reply("Puedes seleccionar un producto para feedback", {
        reply_markup: ProductList,
    });
    const callback = await conversation.wait();

    await ctx.reply("¿Cuál es tu comentario?");
    const comment = await conversation.form.text();

    await ctx.reply("Muchas gracias, analizaremos el feedback.")

    const request = {
        flow: "chat",
        indicator: [],
        client: ctx.chat.first_name,
        comment: comment,
        product: callback.callbackQuery.data,
    };

    await invokeInsights(request);
    await showMenu(ctx);
}

// Create conversation for feedback and survey.
bot.use(createConversation(survey));
bot.use(createConversation(feedback));

// Create action to options.
bot.callbackQuery("survey", (ctx) => ctx.conversation.enter("survey"));
bot.callbackQuery("feedback", (ctx) => ctx.conversation.enter("feedback"));

bot.command("start", async (ctx) => {
    await showMenu(ctx);
});