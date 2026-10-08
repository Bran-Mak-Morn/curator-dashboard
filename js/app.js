const sections = [
  ['work', '01', 'Work', 'content/01-work.md'],
  ['ai', '02', 'AI', 'content/02-ai.md'],
  ['web', '03', 'Web', 'content/03-web.md'],
  ['social', '04', 'Social', 'content/04-social.md'],
  ['programming', '05', 'Programming', 'content/05-programming.md']
];

const sectionMap = new Map(sections.map(section => [section[0], section]));

async function loadSection(id) {
  const section = sectionMap.get(id) || sectionMap.get('work');
  const [sectionId, number, title, file] = section;
  const content = document.querySelector('#content');

  content.setAttribute('aria-busy', 'true');
  content.innerHTML = '<p>Loading section…</p>';

  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Cannot load ${file}`);

    const markdown = await response.text();
    const html = marked.parse(markdown);

    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(html, 'text/html');

    const tools = [];
    let currentTool = null;

    for (const element of documentFragment.body.children) {
      if (element.tagName === 'H3') {
        currentTool = {
          name: element.textContent,
          summary: '',
          content: []
        };

        tools.push(currentTool);
        continue;
      }

      if (!currentTool) continue;

      if (
        element.tagName === 'P' &&
        element.querySelector('em') &&
        element.textContent.trim() === element.querySelector('em').textContent.trim()
      ) {
        currentTool.summary = element.textContent.trim();
        continue;
      }

      currentTool.content.push(element.outerHTML);
    }

    const toolsHtml = tools.map(tool => `
      <article class="tool">
        <div class="tool-name">
          <h3>${tool.name}</h3>
          ${tool.summary ? `<p>${tool.summary}</p>` : ''}
        </div>
        <div class="tool-description">
          ${tool.content.join('')}
        </div>
      </article>
    `).join('');

    content.innerHTML = `
      <section class="category" id="${sectionId}">
        <header class="category-head">
          <h2>${title}</h2>
          <span>${number} / SECTOR</span>
        </header>

        <div class="tools">
          ${toolsHtml}
        </div>
      </section>
    `;

    document.querySelectorAll('.section-nav a').forEach(link => {
      const active = link.dataset.section === sectionId;
      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    content.removeAttribute('aria-busy');
  } catch (error) {
    content.innerHTML = `
      <section class="category">
        <header class="category-head">
          <h2>${title}</h2>
          <span>${number} / SECTOR</span>
        </header>
        <p>Content could not be loaded. Run this site through a local web server, not directly from <code>file://</code>.</p>
      </section>
    `;

    content.removeAttribute('aria-busy');
    console.error(error);
  }
}

function getSectionFromHash() {
  const id = window.location.hash.slice(1).toLowerCase();
  return sectionMap.has(id) ? id : 'work';
}

async function showSection(id, updateUrl = true) {
  const validId = sectionMap.has(id) ? id : 'work';

  if (updateUrl) {
    history.pushState(null, '', `#${validId}`);
  }

  await loadSection(validId);
  window.scrollTo(0, 0);
}

document.querySelectorAll('.section-nav a').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showSection(link.dataset.section);
  });
});

window.addEventListener('popstate', () => {
  showSection(getSectionFromHash(), false);
});

window.addEventListener('hashchange', () => {
  showSection(getSectionFromHash(), false);
});

showSection(getSectionFromHash(), false);