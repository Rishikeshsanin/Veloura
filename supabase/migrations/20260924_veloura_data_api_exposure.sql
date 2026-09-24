-- Veloura V11 Data API exposure
-- Impact review (2026-09-24):
-- PostgREST reported 35 cached relations before this change.
-- Existing client-enabled custom schemas account for exactly 35 relations:
-- ai_research_os (15), closeby (6), commercialiq (7), koshora (7).
-- Preserve those schemas plus standard public/graphql_public and add only veloura.
--
-- Do not add hub, looply, or any unrelated application schema here.

alter role authenticator
  set pgrst.db_schemas = 'public, graphql_public, ai_research_os, closeby, commercialiq, koshora, veloura';

notify pgrst, 'reload config';
