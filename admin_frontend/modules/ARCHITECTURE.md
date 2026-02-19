# Clean Architecture - admin_frontend

Este frontend usa organizacao por modulo e camadas.

## Camadas

- `domain`: entidades, regras e contratos (sem React, sem fetch, sem libs de UI).
- `application`: casos de uso e validacoes de entrada.
- `infrastructure`: implementacoes concretas (HTTP, storage, token, etc).
- `composition`: wiring das dependencias (factory para montar caso de uso).
- `presentation` (quando necessario): adaptadores para UI.

## Regra de dependencias

- `domain` nao depende de nenhuma outra camada.
- `application` depende apenas de `domain`.
- `infrastructure` depende de `application`/`domain`.
- `composition` pode depender de todas para montar objetos.
- `app/**/page.tsx` deve consumir casos de uso prontos via `composition`.

## Estado atual

- Modulos alinhados: `auth`, `security`, `service-requests`.
- `app/solicitacoes/page.tsx` ja consome `service-requests` via caso de uso.

## Proximo passo de migracao

1. `app/projetos/page.tsx`
2. `app/clientes/page.tsx`
3. `app/users/page.tsx`
4. `app/page.tsx` (dashboard)

