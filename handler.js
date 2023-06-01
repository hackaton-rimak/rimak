'use strict';

const {Bot, session} = require("grammy");
const {get} = require("lodash");
const TOKEN_BOT = "6056613927:AAEK1c8BVJRUTxxKb66_CmrZHheXifb3tVc";
const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();
const lambda = new AWS.Lambda();

const bot = new Bot(TOKEN_BOT);

module.exports.sentimentAnalisys = async (event) => {
    console.log("event", event)

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
    console.log("token: ", TOKEN_BOT);
    //console.log("bot: ", bot)
    try{
        console.log("before pase: ", event.body);

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

const form = {
    inline_keyboard: [
        [
            { text: 'Opción 1', callback_data: 'opcion1' },
            { text: 'Opción 2', callback_data: 'opcion2' },
            { text: 'Opción 3', callback_data: 'opcion3' }
        ]
    ]
};

const productList = {
    inline_keyboard: [
        [
            { text: "Kajita", callback_data: "kajita" },
            { text: "Smartlinks", callback_data: "smartlink" },
        ]
    ]
}

bot.use(session({product: "", comment: ""}));

bot.command("start",  (ctx) => ctx.reply("test from bot", {
    reply_markup: form
}));

async function invokeInsights(request){
    let params = {
        FunctionName: 'rimak-dev-processInsights',
        LogType: 'Tail',
        Payload:JSON.stringify({body: JSON.stringify(request)}),
    };

    const res = await lambda.invoke(params).promise();

    return res;
}
bot.command("feedback", async (ctx) => {
    const request = {
        flow: "chat",
        indicator: [],
        client: ctx.chat.first_name,
        comment: "",
        product: "",
    };
    await ctx.reply("Desahogate con Kushki!!!");

    await ctx.reply("Puedes seleccionar un producto para feedback", {
        reply_markup: productList,
    });

    if (!ctx.session) {
        ctx.session = {};
    }

    bot.on("callback_query:data", (cbq) => {
        const productlocal = cbq.callbackQuery.data;

        ctx.session.product = productlocal;
        ctx.reply("¿Cuál es tu comentario?", {
            reply_to_message_id: ctx.msg.message_id,
        });
    });

    bot.on("message:text", async(msg) => {
        const newcomment = msg.message.text;
        ctx.session.comment = newcomment;

        await ctx.reply("Gracias por tu feedback",{
            reply_to_message_id: ctx.msg.message_id,
        });

        request.product = get(ctx, "session.product", "");
        request.comment = get(ctx, "session.comment", "");

        await invokeInsights(request);
    });
});

bot.callbackQuery("opcion1", (ctx) => ctx.answerCallbackQuery("opcion1"));