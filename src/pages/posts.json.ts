import type { APIRoute } from "astro";
import { Client } from "@notionhq/client";

export const GET: APIRoute = async () => {
  const notionToken = import.meta.env.NOTION_TOKEN;
  const dataSourceId = import.meta.env.NOTION_DATA_SOURCE_ID;

  if (!notionToken) {
    return new Response(
      JSON.stringify({ error: "NOTION_SECRET não definido" }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }

  if (!dataSourceId) {
    return new Response(
      JSON.stringify(
        { error: "NOTION_POST_DATA_SOURCE_ID não definido" },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }

  try {
    const notion = new Client({ auth: notionToken });

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 10
    });

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify(
        {
          error: true,
          message: error?.message ?? "Erro desconhecido",
          code: error?.code ?? null,
          status: error?.status ?? null,
          body: error?.body ?? null
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
};