// @todo: напишите здесь код парсера

function parsePage() {
  return {
    meta: getMeta(),
    product: getProduct(),
    suggested: getSuggested(),
    reviews: getReviews(),
  };
}

window.parsePage = parsePage;

// Отрезаем название сайта: "About Vite — Modern Development Tool" → "About Vite"
function removeSiteName(titleText) {
  return titleText.split('—')[0].trim();
}

// Мета-данные живут в <head> и в теге <html>, не ищем их по видимой части страницы
function getMeta() {
  const language = document.documentElement.lang;

  const title = removeSiteName(document.title);

  const descriptionMeta = document.querySelector('meta[name="description"]');
  const description = descriptionMeta.content.trim();

  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  // триммим каждое слово: пробелы после запятых эталон не содержит
  const keywords = keywordsMeta.content.split(',').map((word) => word.trim());

  const opengraph = {};
  const ogMetas = document.querySelectorAll('meta[property^="og:"]');
  ogMetas.forEach((meta) => {
    const property = meta.getAttribute('property');
    const key = property.slice(3); // отрезаем префикс 'og:'
    const value = meta.content.trim();

    // og:title содержит полный заголовок с названием сайта — режем, как и <title>
    if (key === 'title') {
      opengraph[key] = removeSiteName(value);
    } else {
      opengraph[key] = value;
    }
  });

  return { title, description, keywords, language, opengraph };
}

// Товар: id, название, лайк — все три поля лежат внутри секции .product
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

// Две ловушки: большое фото в figure — копия выбранной миниатюры (не дублируем);
// выбранная кнопка помечена disabled и может стоять не первой
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

// Теги по цветам: зелёный — category, синий — label, красный — discount.
// Порядок и количество случайные, ориентир — только цвет
function getTags(productSection) {
  const tags = {
    category: [],
    label: [],
    discount: [],
  };

  const tagsElement = productSection.querySelector('.tags');
  if (!tagsElement) {
    return tags; // блока может не быть — по условию это нормально
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

// Цены, валюта, скидка
const currencyCodes = {
  '₽': 'RUB',
  '$': 'USD',
  '€': 'EUR',
};

// Только режет строку "₽50" на сумму (строкой) и код валюты.
// В число превращает тот, кому нужно число
function parsePriceText(priceText) {
  const text = priceText.trim();
  const symbol = text[0];
  const amount = text.slice(1).trim();

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

  // копия блока: удаляем старую цену в копии, чтобы не менять живую страницу
  const priceCopy = priceElement.cloneNode(true);
  const oldPriceInCopy = priceCopy.querySelector('span');
  if (oldPriceInCopy) {
    oldPriceInCopy.remove();
  }

  const currentPrice = parsePriceText(priceCopy.textContent);
  const price = Number(currentPrice.amount);
  const currency = currentPrice.currency;

  let oldPrice = price; // скидки нет — старая цена равна текущей
  if (oldPriceElement) {
    oldPrice = Number(parsePriceText(oldPriceElement.textContent).amount);
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

// Свойства: каждый li — пара span (ключ, значение), накапливаем в объект
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

function removeAttributes(element) {
  // снимок имён: живую коллекцию attributes нельзя удалять по ходу перебора
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

// Дополнительные товары: article ищем только внутри .suggested,
// иначе в массив попадут обзоры
function getSuggestedItem(article) {
  const imageElement = article.querySelector('img');
  const nameElement = article.querySelector('h3');
  const descriptionElement = article.querySelector('p');
  const priceElement = article.querySelector('b');

  const priceData = parsePriceText(priceElement.textContent);

  return {
    name: nameElement.textContent.trim(),
    description: descriptionElement.textContent.trim(),
    image: imageElement.src,
    price: priceData.amount, // строка: в образце цена доп. товара в кавычках
    currency: priceData.currency,
  };
}

function getSuggested() {
  const suggested = [];

  const suggestedSection = document.querySelector('.suggested');
  if (!suggestedSection) {
    return suggested;
  }

  const articles = suggestedSection.querySelectorAll('article');
  articles.forEach((article) => {
    suggested.push(getSuggestedItem(article));
  });

  return suggested;
}

// Обзоры: рейтинг — количество .filled; имя автора ищем внутри .author,
// иначе поймаем span-звезду
function formatDate(dateText) {
  return dateText.trim().split('/').join('.');
}

function getReviewItem(article) {
  const ratingElement = article.querySelector('.rating');
  const titleElement = article.querySelector('h3');
  const descriptionElement = article.querySelector('p');
  const authorElement = article.querySelector('.author');

  const filledStars = ratingElement.querySelectorAll('.filled');
  const avatarElement = authorElement.querySelector('img');
  const nameElement = authorElement.querySelector('span');
  const dateElement = authorElement.querySelector('i');

  return {
    rating: filledStars.length,
    author: {
      avatar: avatarElement.src,
      name: nameElement.textContent.trim(),
    },
    title: titleElement.textContent.trim(),
    description: descriptionElement.textContent.trim(),
    date: formatDate(dateElement.textContent),
  };
}

function getReviews() {
  const reviews = [];

  const reviewsSection = document.querySelector('.reviews');
  if (!reviewsSection) {
    return reviews;
  }

  const articles = reviewsSection.querySelectorAll('article');
  articles.forEach((article) => {
    reviews.push(getReviewItem(article));
  });

  return reviews;
}