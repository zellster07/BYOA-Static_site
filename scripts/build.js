const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

// Configure marked for security
marked.setOptions({
  headerIds: false,
  mangle: false
});

// Function to extract title from markdown content
function extractTitle(content) {
  // Look for the first heading in the markdown
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

async function build() {
  // Ensure output directory exists
  await fs.ensureDir('dist');
  
  // Copy static assets
  await fs.copy('src/static', 'dist');
  
  // Build blog posts
  await fs.ensureDir('dist/blog');
  const blogFiles = await fs.readdir('src/content/blog');
  for (const file of blogFiles) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(`src/content/blog/${file}`, 'utf-8');
      const title = extractTitle(content);
      const html = marked(content);
      const template = await fs.readFile('src/templates/post.html', 'utf-8');
      const finalHtml = template
        .replace('{{title}}', title)
        .replace('{{content}}', html);
      
      await fs.writeFile(
        `dist/blog/${file.replace('.md', '.html')}`,
        finalHtml
      );
    }
  }
  
  // Build pages
  const pageFiles = await fs.readdir('src/content/pages');
  for (const file of pageFiles) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(`src/content/pages/${file}`, 'utf-8');
      const title = extractTitle(content);
      const html = marked(content);
      const template = await fs.readFile('src/templates/page.html', 'utf-8');
      const finalHtml = template
        .replace('{{title}}', title)
        .replace('{{content}}', html);
      
      await fs.writeFile(
        `dist/${file.replace('.md', '.html')}`,
        finalHtml
      );
    }
  }

  // Create blog index page
  const blogIndexTemplate = await fs.readFile('src/templates/page.html', 'utf-8');
  const blogList = blogFiles
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const name = file.replace('.md', '');
      return `<li><a href="/blog/${name}.html">${name}</a></li>`;
    })
    .join('\n');
    
  const blogIndexHtml = blogIndexTemplate
    .replace('{{title}}', 'Blog')
    .replace('{{content}}', `
      <h1>Blog Posts</h1>
      <ul>
        ${blogList}
      </ul>
    `);
  
  await fs.writeFile('dist/blog/index.html', blogIndexHtml);
}

build().catch(console.error); 