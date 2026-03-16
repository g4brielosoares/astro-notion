import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import slugify from "slugify";

const notionToken = process.env.NOTION_TOKEN;
const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

if (!notionToken) {
  throw new Error("NOTION_TOKEN não definido.");
}

if (!dataSourceId) {
  throw new Error("NOTION_DATA_SOURCE_ID não definido.");
}

const notion = new Client({ auth: notionToken });
const n2m = new NotionToMarkdown({ notionClient: notion });

const CONTENT_ROOT = path.resolve("src/content/blog");

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function richTextToPlain(prop) {
  if (!prop || prop.type !== "rich_text") return "";
  return ensureArray(prop.rich_text).map((item) => item.plain_text || "").join("");
}

function titleToPlain(prop) {
  if (!prop || prop.type !== "title") return "";
  return ensureArray(prop.title).map((item) => item.plain_text || "").join("");
}

function statusName(prop) {
  if (!prop) return "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "rich_text") return richTextToPlain(prop);
  return "";
}

function multiSelectNames(prop) {
  if (!prop || prop.type !== "multi_select") return [];
  return ensureArray(prop.multi_select).map((item) => item.name).filter(Boolean);
}

function dateLikeValue(prop) {
  if (!prop) return "";
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "created_time") return prop.created_time || "";
  if (prop.type === "last_edited_time") return prop.last_edited_time || "";
  return "";
}

function authorName(prop) {
  if (!prop) return "";
  if (prop.type === "created_by") return prop.created_by?.name || "";
  if (prop.type === "last_edited_by") return prop.last_edited_by?.name || "";
  if (prop.type === "people") {
    return ensureArray(prop.people)
      .map((person) => person.name || person.person?.email || "")
      .filter(Boolean)
      .join(", ");
  }
  if (prop.type === "rich_text") return richTextToPlain(prop);
  return "";
}

function getCoverUrlFromPage(page) {
  const cover = page.cover;
  if (!cover) return "";

  if (cover.type === "file") {
    return cover.file?.url || "";
  }

  if (cover.type === "external") {
    return cover.external?.url || "";
  }

  return "";
}

function getPageMeta(page) {
  const props = page.properties || {};

  const title =
    titleToPlain(props.Nome) ||
    titleToPlain(props.Name) ||
    titleToPlain(props.Title) ||
    "Sem título";

  const rawSlug =
    richTextToPlain(props.Slug) ||
    richTextToPlain(props.slug) ||
    title;

  const slug = slugify(rawSlug, {
    lower: true,
    strict: true,
    trim: true
  });

  const status = statusName(props.Status) || "Rascunho";
  const tags = multiSelectNames(props.Tags);

  const pubDate =
    dateLikeValue(props["Data de publicação"]) ||
    page.created_time ||
    "";

  const updatedDate =
    dateLikeValue(props["Última edição"]) ||
    page.last_edited_time ||
    "";

  const author = authorName(props.Autor) || page.created_by?.name || page.last_edited_by?.name || "";

  const coverUrl = getCoverUrlFromPage(page);

  return {
    title,
    slug,
    status,
    tags,
    pubDate,
    updatedDate,
    author,
    coverUrl
  };
}

async function mkdirp(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar arquivo: ${url}`);
  }

  await mkdirp(path.dirname(filePath));
  const stream = createWriteStream(filePath);
  await pipeline(response.body, stream);
}

function escapeYamlString(value) {
  return JSON.stringify(value ?? "");
}

function buildFrontmatter(data) {
  const lines = [
    "---",
    `title: ${escapeYamlString(data.title)}`,
    `slug: ${escapeYamlString(data.slug)}`,
    `status: ${escapeYamlString(data.status)}`,
    `author: ${escapeYamlString(data.author)}`,
    `tags: ${JSON.stringify(data.tags || [])}`,
    `pubDate: ${escapeYamlString(data.pubDate)}`,
    `updatedDate: ${escapeYamlString(data.updatedDate)}`
  ];

  if (data.coverRelativePath) {
    lines.push(`cover: ${escapeYamlString(data.coverRelativePath)}`);
    lines.push(`coverAlt: ${escapeYamlString(data.title)}`);
  }

  lines.push("---", "");
  return lines.join("\n");
}

async function replaceRemoteImages(markdown, postDir) {
  const matches = [...markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g)];
  let output = markdown;
  let imageIndex = 1;

  for (const match of matches) {
    const alt = match[1] || "";
    const url = match[2];
    const ext = getExtensionFromUrl(url);
    const filename = `image-${String(imageIndex).padStart(2, "0")}${ext}`;
    const absolutePath = path.join(postDir, filename);
    const relativePath = `./${filename}`;

    try {
      await downloadFile(url, absolutePath);
      output = output.replace(match[0], `![${alt}](${relativePath})`);
      imageIndex += 1;
    } catch (error) {
      console.warn(`Não consegui baixar imagem ${url}: ${error.message}`);
    }
  }

  return output;
}

async function downloadCover(coverUrl, postDir) {
  if (!coverUrl) return "";
  const ext = getExtensionFromUrl(coverUrl);
  const fileName = `cover${ext}`;
  const absolutePath = path.join(postDir, fileName);

  await downloadFile(coverUrl, absolutePath);
  return `./${fileName}`;
}

async function getAllPagesFromDataSource() {
  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100
    });

    for (const result of response.results) {
      if (result.object === "page") {
        pages.push(result);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}

async function syncPost(page) {
  const meta = getPageMeta(page);

  console.log({
    title: meta.title,
    slug: meta.slug,
    status: meta.status,
    pubDate: meta.pubDate,
    author: meta.author,
    coverUrl: meta.coverUrl
  });

  if (meta.status.toLowerCase() !== "publicado") {
    console.log(`IGNORADO: ${meta.title} | status=${meta.status}`);
    return;
  }

  const postDir = path.join(CONTENT_ROOT, meta.slug);
  await mkdirp(postDir);

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdBlocks);
  let markdown = typeof mdString === "string" ? mdString : mdString.parent || "";

  markdown = await replaceRemoteImages(markdown, postDir);

  let coverRelativePath = "";
  if (meta.coverUrl) {
    try {
      coverRelativePath = await downloadCover(meta.coverUrl, postDir);
    } catch (error) {
      console.warn(`Não consegui baixar cover de ${meta.slug}: ${error.message}`);
    }
  }

  const frontmatter = buildFrontmatter({
    ...meta,
    coverRelativePath
  });

  await fs.writeFile(
    path.join(postDir, "index.md"),
    `${frontmatter}${markdown.trim()}\n`,
    "utf8"
  );

  console.log(`GERADO: ${path.join(postDir, "index.md")}`);
}

async function cleanContentRoot() {
  await fs.rm(CONTENT_ROOT, { recursive: true, force: true });
  await mkdirp(CONTENT_ROOT);
}

async function main() {
  console.log("Buscando posts do Notion...");
  const pages = await getAllPagesFromDataSource();

  await cleanContentRoot();

  for (const page of pages) {
    await syncPost(page);
  }

  console.log("Sync concluído.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});