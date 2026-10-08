/* =========================================================
   Ciclo Prato — configuração do Supabase
   Cole aqui a "Project URL" e a chave PÚBLICA do projeto (Supabase > Project Settings > API):
   - "anon public" (formato antigo, começa com eyJ...) ou "publishable" (formato novo, sb_publishable_...).
   Essas duas são públicas de propósito: quem protege os dados é o RLS do banco (banco.sql).
   NUNCA cole aqui a chave "service_role" nem a "secret" (sb_secret_...): elas ignoram o RLS.
   Se os campos ficarem vazios, a plataforma abre no MODO DEMONSTRAÇÃO (dados só no navegador).
   ========================================================= */
window.CICLO_PRATO_CONFIG = {
  supabaseUrl: "https://xehcgloexizdvojuxjwe.supabase.co",
  supabaseChave: "sb_publishable_9CkMr6LJwn6_YZ1sy3qzaA_apP5iaSb"
};
