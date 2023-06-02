'use strict';
const AWS = require('aws-sdk');
const {Bot, session, InlineKeyboard} = require("grammy");
const {conversations, createConversation} = require("@grammyjs/conversations");
const {get} = require("lodash");
const { Title1, Q2, Q3, Q4, G1, Q1, ProductList} = require("./labels");

const lambda = new AWS.Lambda();
const comprehend = new AWS.Comprehend();

const TOKEN_BOT = "6056613927:AAEK1c8BVJRUTxxKb66_CmrZHheXifb3tVc";
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

    const res = await lambda.invoke(params).promise();

    return res;
}
async function survey(conversation, ctx) {
    await ctx.reply(Title1);
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

    console.log("Rquest survey",request);

    await invokeInsights(request);
}

bot.use(createConversation(survey));

bot.callbackQuery("survey", (ctx) => ctx.conversation.enter("survey"));

bot.callbackQuery("feedback", async (ctx) => {
    const request = {
        flow: "chat",
        indicator: [],
        client: ctx.chat.first_name,
        comment: "",
        product: "",
    };
    await ctx.reply("Desahogate con Kushki!!!");

    await ctx.reply("Puedes seleccionar un producto para feedback", {
        reply_markup: ProductList,
    });

    if (!ctx.session) {
        ctx.session = {};
    }

    bot.on("callback_query:data", (cbq) => {
        const productlocal = cbq.callbackQuery.data;

        ctx.session.product = productlocal;
        ctx.api.sendMessage(ctx.chat.id,"¿Cuál es tu comentario?");
    });

    bot.on("message:text", async(msg) => {
        const newcomment = msg.message.text;
        ctx.session.comment = newcomment;

        await ctx.api.sendMessage(ctx.chat.id, "Gracias por tu feedback");

        request.product = get(ctx, "session.product", "");
        request.comment = get(ctx, "session.comment", "");

        await invokeInsights(request);
        await showMenu(ctx);
    });
});

bot.command("start", async (ctx) => {
   await showMenu(ctx);
});