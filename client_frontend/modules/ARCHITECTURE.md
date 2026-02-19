# Clean Architecture - client_frontend

Este frontend usa organizacao por modulo e camadas para manter baixo acoplamento.

## Camadas

- `domain`: entidades e contratos de repositorio.
- `application`: casos de uso (orquestracao e validacao).
- `infrastructure`: adaptadores externos (HTTP/API).
- `composition`: factories para montar os casos de uso.

## Regra de dependencias

- `domain` nao importa nada de `application`, `infrastructure` ou `app`.
- `application` importa apenas `domain`.
- `infrastructure` implementa contratos de `domain`.
- `app/**/page.tsx` usa somente `composition`/`application`.

## Estado atual

- Modulo alinhado: `service-requests`.
- `app/solicitacoes/page.tsx` foi migrada para caso de uso e repositorio.

## Proximo passo de migracao

1. `app/projetos/page.tsx`
2. `app/pagamentos/page.tsx`
3. `app/conta/page.tsx`
4. `app/configuracoes/page.tsx`

