import { chromium } from "playwright";


const TARGET_URL = process.env.TARGET_URL;

const listaUsuarios = [];


async function executarAutomacao() {
  console.log(`Iniciando automação Playwright para criação de ${listaUsuarios.length} contas.`);
  console.log(`URL de destino: ${TARGET_URL}\n`);

  // Inicializa o navegador Chromium de forma visível para acompanhar o processo
  const browser = await chromium.launch({ headless: false, slowMo: 100 }); 

  for (let i = 0; i < listaUsuarios.length; i++) {
    const usuario = listaUsuarios[i];
    console.log(`[${i + 1}/${listaUsuarios.length}] Cadastrando: ${usuario.nome} (${usuario.email})...`);

    // Cria um contexto limpo para garantir que a sessão de login anterior seja limpa
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // 1. Navega até a página de login
      await page.goto(TARGET_URL);
      await page.waitForLoadState("networkidle");

      // 2. Alterna para o modo de registro clicando no botão de alternância
      // O botão do final da tela diz "Criar conta" quando está no modo login
      await page.click('button:has-text("Criar conta")');

      // 3. Preenche os campos do formulário de cadastro
      await page.fill("#nome", usuario.nome);
      await page.fill("#email", usuario.email);
      await page.fill("#password", usuario.senha);

      // 4. Clica no botão de submit "Criar conta"
      await page.click('button[type="submit"]');

      // 5. Aguarda o redirecionamento pós-cadastro para a raiz "/" da aplicação
      await page.waitForURL((url) => url.pathname === "/" || url.toString().endsWith("/"), { timeout: 15000 });

      console.log(`✔️ Usuário ${usuario.nome} cadastrado com sucesso!`);
    } catch (error) {
      console.error(`❌ Falha ao cadastrar ${usuario.nome}:`, error.message);
    } finally {
      // Fecha o contexto para limpar cookies, localStorage e tokens da conta recém-criada
      await context.close();
    }
  }

  await browser.close();
  console.log("\nAutomação concluída.");
}

executarAutomacao();
