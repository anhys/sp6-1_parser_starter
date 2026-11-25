// @todo: напишите здесь код парсера

function parsePage() {
    return {
        meta: getMeta(),
        product: getProduct(),
        suggested: [],
        reviews: []
    };
}

window.parsePage = parsePage;

// Мета-данные живут в <head> и в теге <html>, не будем искать по видимой части страницы

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

// шаг 2: Товар: id, название, лайк - Все три поля лежат внутри секции .product

function getProduct() {
  const productSection = document.querySelector('.product');

  const id = productSection.dataset.id;

  const nameElement = productSection.querySelector('h1');
  const name = nameElement.textContent.trim();

  const likeButton = productSection.querySelector('.like');
  const isLiked = likeButton.classList.contains('active');

  const images = getImages(productSection);

  return { id, name, isLiked, images };
}

// шаг 3: нашел две ловушки - первая дубль большого фото в figure - это копия выбранной миниатюры. Вторая - порядок, на тестовых страницах выбранной может оказаться не первая кнопка

function getImageData(img) {
  return {
    preview: img.src,
    full: img.dataset.src,
    alt: img.alt.trim(),
  };
}

function getImages(productSection) {
  const thumbnailsNav = productSection.querySelector('.preview nav');
  const selectedButton = thumbnailsNav.querySelector('button[disabled]');
  const thumbnailButtons = thumbnailsNav.querySelectorAll('button');

  const images = [];

  const selectedImg = selectedButton.querySelector('img');
  images.push(getImageData(selectedImg));

  thumbnailButtons.forEach((button) => {
    if (button !== selectedButton) {
      const img = button.querySelector('img');
      images.push(getImageData(img));
    }
  });

  return images;
}