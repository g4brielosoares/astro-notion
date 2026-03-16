---
title: "Composição de componentes e Boas práticas"
slug: "composicao-de-componentes"
status: "Publicado"
author: "Gabriel Soares"
tags: ["Astro","Componentes","HTML","Boas Práticas"]
pubDate: "2026-03-14T15:10:00.000Z"
updatedDate: "2026-03-15T06:03:00.000Z"
cover: "./cover.png"
coverAlt: "Composição de componentes e Boas práticas"
---
## Visão geral


Quando você trabalha com Astro para criar landing pages e sites institucionais, a melhor abordagem costuma ser **composição declarativa com poucas camadas, responsabilidades claras e o mínimo possível de acoplamento estrutural**.


A ideia central é simples: a página deve montar a experiência, as seções devem representar blocos reais da interface, e os componentes menores devem resolver estrutura, apresentação e padrões recorrentes.


---


## 1. Comece pelo modelo mental certo


A hierarquia mais saudável para esse tipo de projeto costuma ser:


```markdown
Page
  -> Section
    -> Pattern
      -> Primitive
```


Na prática:

- **Page**: define a ordem das seções
- **Section**: representa um bloco real da página
- **Pattern**: resolve padrões recorrentes de interface
- **Primitive**: resolve estrutura e apresentação base

Esse fluxo é suficiente para a maioria dos projetos em Astro sem cair em abstração excessiva.


---


## 2. Prefira compor de fora para dentro


Uma seção final deve, em geral, usar componentes estruturais por dentro, e não o contrário.


### Estrutura preferível


```markdown
FinalSection
  -> SectionShell
    -> Container
      -> HeadingBlock
      -> Content
```


### Por que isso é melhor

- `SectionShell` define a região da página
- `Container` define a largura útil
- `HeadingBlock` define o cabeçalho daquela seção
- o conteúdo entra depois

### Boa prática


**O componente mais estrutural deve envolver o mais específico.**


Evite inverter isso, por exemplo colocando `Section` e `Container` dentro de `HeadingBlock`.


---


## 3. Não encapsule `Container` dentro de `SectionShell` como regra geral


Embora isso pareça prático no começo, normalmente não é o melhor padrão base.


### Motivo principal


`SectionShell` e `Container` têm responsabilidades diferentes:

- **SectionShell**: espaçamento, fundo, `id`, semântica da região
- **Container**: largura máxima, centralização, gutters

### Problema de encapsular cedo demais


Quando `Container` já vem preso dentro de `SectionShell`, você perde flexibilidade para casos como:

- seções full width
- blocos com bleed
- grids mais largos
- mapas, banners e mídias sem container
- seções com mais de um container interno

### Boa prática


**Mantenha** **`SectionShell`** **e** **`Container`** **separados como base.**


Se quiser um atalho para o caso comum, crie um componente mais opinativo, como:

- `StandardSection`
- `ContentSection`

Esses sim podem encapsular os dois.


---


## 4. Organize `components/` por nível de abstração


Uma estrutura saudável para LPs e institucionais é:


```markdown
components/
  primitives/
    layout/
    content/

  patterns/

  sections/

  domain/
```


### O que vai em cada pasta


### `primitives/`


Componentes mais básicos e menos opinativos.


Exemplos:
- `Container`
- `SectionShell`
- `Stack`
- `Grid`
- `Heading`
- `Button`


### `patterns/`


Padrões recorrentes de interface, ainda genéricos.


Exemplos:
- `MediaText`
- `CardGrid`
- `CTABox`
- `FAQList`
- `FeatureList`


### `sections/`


Seções reais da página.


Exemplos:
- `HeroSection`
- `BenefitsSection`
- `FAQSection`
- `CTASection`


### `domain/`


Componentes que já carregam regra, semântica ou vocabulário do negócio.


Exemplos:
- `ServiceCard`
- `DoctorProfileCard`
- `TeamMemberCard`
- `PricingPlanCard`


---


## 5. Entenda a diferença entre `pattern` e `domain`


Essa distinção ajuda muito a manter a arquitetura clara.


### `pattern`


É um padrão reutilizável de interface.


Exemplos:
- `CardGrid`
- `MediaText`
- `FAQList`


Serve para vários projetos e contextos.


### `domain`


É como um `pattern`, mas com semântica de negócio.


Exemplos:
- `ServiceCard`
- `ClinicDifferentialCard`
- `MethodStepCard`


Ele já faz sentido dentro de um contexto específico e normalmente depende dos dados do projeto.


### Regra prática

- Se pode existir em quase qualquer projeto, é **pattern**
- Se depende do vocabulário ou estrutura do negócio, é **domain**

---


## 6. Use props para conteúdo previsível e slot para conteúdo variável


Essa é uma das decisões mais úteis em Astro.


### Use props quando:

- a estrutura da seção é estável
- muda só título, texto, imagem, CTA, lista de itens

### Use slot quando:

- a estrutura interna varia bastante
- você quer um bloco mais flexível

### Boa prática


**Props para variação previsível. Slot para composição aberta.**


---


## 7. A página deve instanciar a seção, não implementar tudo manualmente


Para páginas com seções parecidas, o ideal é:

- criar uma seção reutilizável
- passar os dados por props
- manter a página limpa e legível

Exemplo de papel da página:


```markdown
BaseLayout
  -> HeroSection
  -> BenefitsSection
  -> FAQSection
  -> CTASection
```


### Boa prática


**A página deve parecer um sumário da experiência.**


Ela organiza a ordem das seções, mas não deve carregar a implementação detalhada de cada uma.


---


## 8. Evite abstração em excesso


Esse é um dos riscos mais comuns.


Sinais de que você abstraiu demais:
- nomes genéricos demais (`Wrapper`, `Base`, `Renderer`, `Block`)
- profundidade excessiva
- muitos componentes que só passam props para o próximo
- muitas flags booleanas
- dificuldade para entender a árvore de arquivos


### Boa prática


**Não abstraia cedo demais.**


Para LPs e institucionais, normalmente o ponto ideal é:


```markdown
primitives -> patterns -> sections -> page
```


E `domain/` só entra quando houver necessidade real.


---


## 9. Estrutura recomendada para a maioria dos projetos


Se você quiser uma base simples e saudável, use:


```markdown
src/
  layouts/
    BaseLayout.astro

  components/
    primitives/
      layout/
        Container.astro
        SectionShell.astro
      content/
        HeadingBlock.astro
        Button.astro

    patterns/
      CardGrid.astro
      MediaText.astro
      FAQList.astro

    sections/
      HeroSection.astro
      BenefitsSection.astro
      FAQSection.astro
      CTASection.astro

  pages/
    index.astro
    sobre.astro
    servicos.astro
```


E só adicione `domain/` quando o projeto começar a pedir componentes realmente específicos do negócio.


---


## 10. Regra final de boa prática


Se precisar resumir tudo em uma direção só, use esta:

> **Componha de fora para dentro, separe estrutura de conteúdo, e pare de abstrair antes que a árvore de componentes fique mais complexa do que a própria interface.**

Essa lógica costuma gerar projetos mais:
- legíveis
- reutilizáveis
- previsíveis
- fáceis de manter
