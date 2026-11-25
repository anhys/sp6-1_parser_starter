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

  const tags = getTags(productSection);

  const priceData = getPriceData(productSection);

  const properties = getProperties(productSection);

  const description = getDescription(productSection);

  return {
    id,
    name,
    isLiked,
    tags,
    price: priceData.price,
    oldPrice: priceData.oldPrice,
    discount: priceData.discount,
    discountPercent: priceData.discountPercent,
    currency: priceData.currency,
    properties,
    description,
    images,
  };
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

// шаг 4: теги по цветам. Ориентироваться на порядок нельзя: на тестовых страницах тегов может быть сколько угодно и в любой последовательности

function getTags(productSection) {
  const tags = {
    category: [],
    label: [],
    discount: [],
  };

  const tagsElement = productSection.querySelector('.tags');
  if (!tagsElement) {
    return tags; 
  }

  const tagElements = tagsElement.querySelectorAll('span');
  tagElements.forEach((tagElement) => {
    const text = tagElement.textContent.trim();

    if (tagElement.classList.contains('green')) {
      tags.category.push(text);
    } else if (tagElement.classList.contains('blue')) {
      tags.label.push(text);
    } else if (tagElement.classList.contains('red')) {
      tags.discount.push(text);
    }
  });

  return tags;
}

// шаг 5. Товар: цены, валюта и скидка. Нужно отделить текст от span

const currencyCodes = {
  '₽': 'RUB',
  '$': 'USD',
  '€': 'EUR',
};

function parsePriceText(priceText) {
  const text = priceText.trim();
  const symbol = text[0];
  const amount = Number(text.slice(1).trim());

  return { amount, currency: currencyCodes[symbol] };
}

function calculateDiscount(price, oldPrice) {
  const discount = oldPrice - price;
  const percent = (discount / oldPrice) * 100;

  return { discount, discountPercent: percent.toFixed(2) + '%' };
}

function getPriceData(productSection) {
  const priceElement = productSection.querySelector('.price');
  const oldPriceElement = priceElement.querySelector('span');

  const priceCopy = priceElement.cloneNode(true);
  const oldPriceInCopy = priceCopy.querySelector('span');
  if (oldPriceInCopy) {
    oldPriceInCopy.remove();
  }

  const currentPrice = parsePriceText(priceCopy.textContent);
  const price = currentPrice.amount;
  const currency = currentPrice.currency;

  let oldPrice = price;
  if (oldPriceElement) {
    oldPrice = parsePriceText(oldPriceElement.textContent).amount;
  }

  const discountData = calculateDiscount(price, oldPrice);

  return {
    price,
    oldPrice,
    discount: discountData.discount,
    discountPercent: discountData.discountPercent,
    currency,
  };
}

// шаг 6. Товар: свойства

function getProperties(productSection) {
  const properties = {};

  const propertiesElement = productSection.querySelector('.properties');
  if (!propertiesElement) {
    return properties;
  }

  const propertyItems = propertiesElement.querySelectorAll('li');
  propertyItems.forEach((item) => {
    const spans = item.querySelectorAll('span');
    const key = spans[0].textContent.trim();
    const value = spans[1].textContent.trim();

    properties[key] = value;
  });

  return properties;
}

// шаг 7. Товар: полное описание

function removeAttributes(element) {
  const attributeNames = element.getAttributeNames();

  attributeNames.forEach((name) => {
    element.removeAttribute(name);
  });
}

function getDescription(productSection) {
  const descriptionElement = productSection.querySelector('.description');
  if (!descriptionElement) {
    return '';
  }

  // работаем с копией: живую страницу не меняем
  const descriptionCopy = descriptionElement.cloneNode(true);

  const innerElements = descriptionCopy.querySelectorAll('*');
  innerElements.forEach((element) => {
    removeAttributes(element);
  });

  // innerHTML здесь читаем как строку, а не вставляем данные
  return descriptionCopy.innerHTML.trim();
}