// @todo: напишите здесь код парсера

function parsePage() {
    return {
        meta: getMeta(),
        product: {},
        suggested: [],
        reviews: []
    };
}

window.parsePage = parsePage;

function getMeta() {
  const language = document.documentElement.lang;

  const fullTitle = document.title;
  const title = fullTitle.split('—')[0].trim();

  const descriptionMeta = document.querySelector('meta[name="description"]');
  const description = descriptionMeta.content.trim();

  const keywordsMeta = document.querySelector('meta[name="keywords"]');

  const keywords = keywordsMeta.content.split(',');

  const opengraph = {};
  const ogMetas = document.querySelectorAll('meta[property^="og:"]');
  ogMetas.forEach((meta) => {
    const property = meta.getAttribute('property');
    const key = property.slice(3); 
    opengraph[key] = meta.content.trim();
  });

  return { title, description, keywords, language, opengraph };
}