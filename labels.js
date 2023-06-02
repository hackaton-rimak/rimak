// Variables for survey
const Title1 = "La experiencia de nuestros clientes es lo más importante, queremos conocer tu opinión sobre tu experiencia con los servicios que tu empresa/comercio ha tenido con Kushki:";
const Q1 = "1. Recomendarías a Kushki a otros colegas o empresas? Califica en una escala de 1 a 10, donde 10 es la recomendaría totalmente y 1 para nada la recomendaría.";
const Q2 = "2. Que tan fácil o tan fácil o tan difícil ha sido trabajar con Kushki. Califica en la escala de 1 a 5 donde 5 es muy fácil y 1 muy difícil";
const Q3 = "3.  Qué tan satisfecho te encuentras con los productos / servicios que Kushki provee a tu empresa. Califica en la escala de 1 a 5 donde 5 es muy satisfecho y 1 muy insatisfecho.";
const Q4 = "4. Queremos conocer tus comentarios sobre cómo ha sido tu experiencia con Kushki, cuéntanos sobre lo que debiésemos mejorar, lo que estamos haciendo bien, o lo que te gustaría en que trabajemos para que nos prefieras.";
const G1 = "Muchas gracias, tu opinión es muy importante para nosotros";

// Variables for feedback
const ProductList = {
    inline_keyboard: [
        [
            { text: "Kajita", callback_data: "kajita" },
            { text: "Smartlinks", callback_data: "smartlink" },
        ]
    ]
}

module.exports = {Title1, Q1, Q2, Q3, Q4, G1, ProductList};