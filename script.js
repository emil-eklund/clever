const production = false;

if (production) {
  log = console.log;
} else {
  log = () => { };
}

/** @returns {boolean} */
function isIterable(value) {
  return value && typeof value[Symbol.iterator] === 'function';
}

class Soup {

  constructor(context = {}) {
    this._context = context;
    this._ingredients = [];
  }

  /** @param {HTMLElement} hostElement */
  setHost(hostElement) {
    this._hostElement = hostElement;
    
    return this;
  }

  clear() {
    while (this._hostElement.firstChild) {
      this._hostElement.removeChild(this._hostElement.firstChild);
    }

    return this;
  }


  /**
   * @param {Array<Ingredient>} ingredients
   */
  add(...ingredients) {
    this._ingredients.push(...ingredients);

    return this;
  }

  /**
   * Renders the registered content.
   * @param {Node} host
   * @param {Array<[string, any]>} ingredients
   */
  serve(ingredients, host) {
    ingredients = ingredients || this._ingredients
    host = host || this._hostElement;
    for(let recipe of ingredients) {
      if (recipe instanceof Soup) {
        recipe.setHost(host);
        recipe.serve();
      } else {
        let {tag, content, events, classes, attributes} = recipe;
        let element = document.createElement(tag);

        if (classes) {
          element.classList.add(classes);
        }

        if (attributes) {
          for (let [attribute, value] of attributes) {
            element.setAttribute(attribute, value);
          }
        }

        if (events) {
          for(let [event, handler] of events) {
            element.addEventListener(event, (...args) => {
              handler.bind();
              const shouldUpdate = handler.call(this._context, ...args);
              if (shouldUpdate !== false) {
                this.clear();
                this.serve();
              }
            });
          }
        }

        if (typeof(content) === 'function') {
          content = content();
        }
        if (content === undefined) {
          // Nothing to do here
        } else if (typeof(content) === 'string') {
          element.innerText = this._context[content] || content;
        } else if (isIterable(content)) {
          this.serve(content, element);
        } else {
          throw Error('Unknown element.' + content)
        }

        host.appendChild(element);
      }
    }

    return this;
  }
}

const links = ['Home', 'Posts', 'Tips'];

window.articles = [
  {
    'title': 'Preventing Disasters',
    'content': 'Utilising git to its full potential and reverting what seems irrevertable.'
  },
  {
    'title': 'I don\' have it now but I can GIT it',
    'content': 'Rebasing vs. Merging and the implication "fast-forward" can have on history.'
  },
  {
    'title': 'Defying opinionated frameworks',
    'content': 'A completely incomplete list of ways you may be shooting yourself in the foot by defying the limits bestowed upon you by an opinionated framework'
  }
];

new Soup()
  .setHost(document.body)
  .add({
    tag: 'header',
    classes: ['dark-section'],
    content: [{
      tag: 'h1',
      content: `Don't be clever - Unless you have to`
    }]
  })
  .add({
    tag: 'div',
    classes: ['main-container'],
    content: [{
      tag: 'nav',
      classes: ['dark-section'],
      content: [{
        tag: 'ul',
        content: [ 
          ...links.map(link => ({
            tag: 'li',
            content: [{
              tag: 'a',
              content: link
            }]
          })),
          {
            tag: 'li',
            content: [{
              tag: 'a',
              content: 'New Post',
              events: [['click', (e) => articles.unshift({title: '', content: ''})]]
            }]
          }
        ]
      }]
    }, {
      tag: 'main',
      content: () => articles.map(article => new Soup(article)
        .add({
          tag: 'article',
          content: [{
            tag: 'h2',
            content: 'title',
            attributes: [['contenteditable', 'true']],
            events: [['input', (e) => { this.title = e.target.innerHTML; return false}]]
          }, {
            tag: 'p',
            content: 'content'
          }]
        })
      )
    }]
  })
  .serve();